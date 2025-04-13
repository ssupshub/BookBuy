const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const path = require('path');
const multer = require('multer');
const session = require('express-session');
const fs = require('fs'); // For filesystem operations


const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Session middleware
app.use(session({
  secret: 'your-secret-key', // Replace with a strong secret in production
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: false, // Set to true in production with HTTPS
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// MongoDB connection
const uri = "mongodb+srv://swayam:Swayam%402303@booksell.bexwk.mongodb.net/";
mongoose.connect(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('✅ Mongoose connected to MongoDB');
});

// User Schema
const userSchema = new mongoose.Schema({
  name: String,
  phone_email: { type: String, required: true, unique: true },
  phone_number: { type: String, unique: true, sparse: true }, // sparse allows null values
  password: { type: String, required: true },
  resetToken: String,
  resetTokenExpiration: Date,
  isPhone: Boolean,
  address: String // Add this line
});

const User = mongoose.model('User', userSchema);

// Book Schema (updated to store file paths instead of ObjectIds)
const bookSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  bookType: { type: String, required: true },
  category: { type: String, required: true },
  subcategory: { type: String, required: true },
  mrp: { type: Number, required: true },
  author: { type: String, required: true },
  edition: { type: String, required: true },
  condition: { type: String, required: true },
  conditionRating: { type: Number, required: true },
  description: { type: String, required: true },
  imagePaths: [{ type: String }], // Array of file paths for images
  videoPath: { type: String, default: null }, // Single file path for video
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
  isFreeShipping: { type: Boolean, default: false },
  shippingPrice: { type: Number, default: 0 },
  isAdvertised: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  status: { 
    type: String, 
    enum: ['pending', 'active', 'sold', 'removed'], 
    default: 'active' 
  
},
views: { type: Number, default: 0 }, // Added views field
earnings: { type: Number, default: 0 } // Added earnings field
});

const Book = mongoose.model('Book', bookSchema);

// Email configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'swayam721765@gmail.com',
    pass: '7217650974' // Use app-specific password if using Gmail
  }
});

// Multer configuration for disk storage
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir); // Create uploads directory if it doesn’t exist
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir); // Save files to uploads/
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName); // Unique filename with timestamp
  }
});

const upload = multer({ storage });

// Serve uploaded files statically
app.use('/uploads', express.static(uploadDir));

// Near the existing Multer configuration
const slipStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir); // Save to uploads/
  },
  filename: (req, file, cb) => {
    const uniqueName = `slip-${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const slipUpload = multer({ storage: slipStorage });

// Authentication middleware
const requireAuth = (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }
  req.userId = req.session.userId;
  next();
};

// Login Route
app.post('/login-signup/login', async (req, res) => {
  try {
    const { phone_email, password } = req.body;
    console.log('Login request body:', req.body);
    const normalizedPhoneEmail = phone_email.toLowerCase();
    const user = await User.findOne({ phone_email: normalizedPhoneEmail });
    console.log('Found user:', user);
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid password' });
    }

    req.session.userId = user._id;
    res.json({ success: true, message: 'Login successful', userId: user._id });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Logout Route
app.post('/login-signup/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Logout failed' });
    }
    res.json({ success: true, message: 'Logged out successfully' });
  });
});

// Check Session Route
app.get('/api/session', (req, res) => {
  if (req.session.userId) {
    res.json({ success: true, userId: req.session.userId });
  } else {
    res.json({ success: false, message: 'Not logged in' });
  }
});

// Sign Up Route
app.post('/login-signup/register', async (req, res) => {
  try {
    const { name, phone_email, password } = req.body;
    console.log('Signup request body:', req.body);
    const normalizedPhoneEmail = phone_email.toLowerCase();
    const existingUser = await User.findOne({ phone_email: normalizedPhoneEmail });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email or phone already registered' });
    }

    const isPhone = /^\d+$/.test(normalizedPhoneEmail);
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = new User({
      name,
      phone_email: normalizedPhoneEmail,
      password: hashedPassword,
      isPhone
    });

    await user.save();
    res.status(201).json({ success: true, message: 'User registered successfully' });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Forgot Password Route
app.post('/login-signup/forgotPassword', async (req, res) => {
  try {
    const { phone_email } = req.body;
    
    const user = await User.findOne({ phone_email });
    if (!user) {
      return res.status(404).send('User not found');
    }

    const resetToken = crypto.randomBytes(20).toString('hex');
    user.resetToken = resetToken;
    user.resetTokenExpiration = Date.now() + 3600000;
    await user.save();

    if (user.isPhone) {
      console.log(`SMS Reset code ${resetToken} sent to ${phone_email}`);
      res.send('Reset code sent to your phone');
    } else {
      const mailOptions = {
        from: 'swayam721765@gmail.com',
        to: phone_email,
        subject: 'BookSell Password Reset',
        text: `You requested a password reset. Use this code: ${resetToken}\n\nIf you didn't request this, please ignore this email.`
      };

      await transporter.sendMail(mailOptions);
      res.send('Reset code sent to your email');
    }
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).send('Server error');
  }
});

// Reset Password Route
app.post('/login-signup/resetPassword', async (req, res) => {
  try {
    const { phone_email, resetCode, newPassword } = req.body;
    
    const user = await User.findOne({ 
      phone_email,
      resetToken: resetCode,
      resetTokenExpiration: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).send('Invalid or expired reset code');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    user.resetToken = undefined;
    user.resetTokenExpiration = undefined;
    await user.save();

    res.send('Password reset successful');
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).send('Server error');
  }
});

// Post Book Route
app.post(
  '/api/books/post',
  requireAuth,
  upload.fields([
    { name: 'images', maxCount: 10 },
    { name: 'video', maxCount: 1 }
  ]),
  async (req, res) => {
    try {
      const {
        title,
        bookType,
        category,
        subcategory,
        mrp,
        author,
        edition,
        condition,
        conditionRating,
        description,
        quantity,
        price,
        isFreeShipping,
        shippingPrice,
        isAdvertised
      } = req.body;

      const requiredFields = {
        title, bookType, category, subcategory, mrp, author, edition,
        condition, conditionRating, description, quantity, price
      };

      for (const [key, value] of Object.entries(requiredFields)) {
        if (!value) {
          return res.status(400).json({
            success: false,
            message: `${key} is required`
          });
        }
      }

      const images = req.files['images'];
      if (!images || images.length < 4) {
        return res.status(400).json({
          success: false,
          message: 'At least 4 images are required'
        });
      }
      if (images.length > 10) {
        return res.status(400).json({
          success: false,
          message: 'Maximum 10 images allowed'
        });
      }

      const wordCount = description.split(/\s+/).filter(Boolean).length;
      if (wordCount < 10 || wordCount > 300) {
        return res.status(400).json({
          success: false,
          message: 'Description must be between 10 and 300 words'
        });
      }

      // Store file paths
      const imagePaths = images.map(file => `/uploads/${file.filename}`);
      const video = req.files['video'] ? req.files['video'][0] : null;
      const videoPath = video ? `/uploads/${video.filename}` : null;

      const book = new Book({
        userId: req.userId,
        title,
        bookType,
        category,
        subcategory,
        mrp: Number(mrp),
        author,
        edition,
        condition,
        conditionRating: Number(conditionRating),
        description,
        imagePaths,
        videoPath,
        quantity: Number(quantity),
        price: Number(price),
        isFreeShipping: isFreeShipping === 'true',
        shippingPrice: isFreeShipping === 'true' ? 0 : Number(shippingPrice),
        isAdvertised: isAdvertised === 'true',
        createdAt: new Date()
      });

      await book.save();

      res.status(201).json({
        success: true,
        message: 'Book posted successfully',
        bookId: book._id,
        createdAt: book.createdAt,
        userId: book.userId,
        imagePaths: book.imagePaths,
        videoPath: book.videoPath
      });
    } catch (error) {
      console.error('Book posting error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while posting book'
      });
    }
  }
);

// Serve index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// Get Books Route
app.get('/api/books', async (req, res) => {
  try {
    const {
      search,
      category,
      subcategory,
      condition,
      minPrice,
      maxPrice,
      discount,
      sortBy
    } = req.query;

    // Build query object
    let query = { status: 'active' }; // Only fetch active books

    // Search by title or author
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { author: { $regex: search, $options: 'i' } }
      ];
    }

    // Filter by category
    if (category) {
      query.category = category;
    }

    // Filter by subcategory
    if (subcategory) {
      query.subcategory = subcategory;
    }

    // Filter by condition
    if (condition) {
      query.condition = condition;
    }

    // Filter by price range
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    // Filter by discount
    if (discount) {
      query.$expr = {
        $gte: [
          { $divide: [{ $subtract: ['$mrp', '$price'] }, '$mrp'] },
          Number(discount) / 100
        ]
      };
    }

    // Sorting
    let sortOption = {};
    if (sortBy) {
      switch (sortBy) {
        case 'price_low_high':
          sortOption.price = 1;
          break;
        case 'price_high_low':
          sortOption.price = -1;
          break;
        case 'date_newest':
          sortOption.createdAt = -1;
          break;
        case 'date_oldest':
          sortOption.createdAt = 1;
          break;
        default:
          sortOption.createdAt = -1;
      }
    }

    // Fetch books
    const books = await Book.find(query).sort(sortOption).lean();

    // Transform books to include calculated discount
    const transformedBooks = books.map(book => ({
      id: book._id.toString(),
      title: book.title,
      author: book.author,
      price: book.price,
      originalPrice: book.mrp,
      condition: book.condition,
      coverImage: book.imagePaths[0] || 'https://via.placeholder.com/150', // Use first image
      category: book.category,
      dateAdded: book.createdAt.toISOString().split('T')[0],
      freeShipping: book.isFreeShipping,
      discountPercentage: book.mrp > book.price
        ? Math.round(((book.mrp - book.price) / book.mrp) * 100)
        : null
    }));

    res.json({
      success: true,
      books: transformedBooks
    });
  } catch (error) {
    console.error('Fetch books error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching books'
    });
  }
});

// Get Categories Route
app.get('/api/categories', async (req, res) => {
  try {
    // Fetch unique categories
    const categories = await Book.distinct('category');

    // Fetch subcategories for each category
    const categoriesWithSubcategories = await Promise.all(
      categories.map(async (category) => {
        const subcategories = await Book.distinct('subcategory', { category });
        return {
          id: category, // Using category name as ID for simplicity
          name: category,
          subcategories: subcategories.map(sub => ({
            id: sub,
            name: sub
          }))
        };
      })
    );

    res.json({
      success: true,
      categories: categoriesWithSubcategories
    });
  } catch (error) {
    console.error('Fetch categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching categories'
    });
  }
});

// Update /api/user-books to include views and earnings
app.get('/api/user-books', requireAuth, async (req, res) => {
  try {
    const userId = req.userId;
    let query = { userId: userId, status: 'active' };
    const books = await Book.find(query).lean();
    const transformedBooks = books.map(book => ({
      _id: book._id.toString(),
      title: book.title,
      author: book.author,
      price: book.price,
      description: book.description,
      images: book.imagePaths,
      isAdvertised: book.isAdvertised,
      createdAt: book.createdAt.toISOString(),
      uploadDate: book.createdAt.toISOString(),
      views: book.views || 0,
      earnings: book.earnings || 0,
      salesCount: 0 // Placeholder
    }));
    res.json({
      success: true,
      books: transformedBooks
    });
  } catch (error) {
    console.error('Fetch user books error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching user books'
    });
  }
});

// Get Seller Statistics Route
app.get('/api/seller-stats', requireAuth, async (req, res) => {
  try {
    const userId = req.userId;

    // Calculate statistics
    const totalBooksUploaded = await Book.countDocuments({ userId, status: 'active' });
    const advertisedBooks = await Book.countDocuments({ userId, isAdvertised: true, status: 'active' });
    // Assuming a sales field doesn't exist yet; you can add it to the schema if needed
    const totalSales = await Book.aggregate([
      { $match: { userId, status: 'sold' } },
      { $group: { _id: null, total: { $sum: '$quantity' } } }
    ]).then(result => result[0]?.total || 0);

    res.json({
      success: true,
      totalBooksUploaded,
      advertisedBooks,
      totalSales
    });
  } catch (error) {
    console.error('Fetch stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching stats'
    });
  }
});


app.delete('/api/book/:id', requireAuth, async (req, res) => {
  try {
    const book = await Book.findOne({ _id: req.params.id, userId: req.userId });
    if (!book) {
      return res.status(404).json({ success: false, message: 'Book not found or unauthorized' });
    }
    await Book.deleteOne({ _id: req.params.id });
    res.json({ success: true, message: 'Book deleted successfully' });
  } catch (error) {
    console.error('Delete book error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Advertise Book Route
app.patch('/api/books/:id/advertise', requireAuth, async (req, res) => {
  try {
    const { isAdvertised } = req.body;
    const book = await Book.findOne({ _id: req.params.id, userId: req.userId });
    if (!book) {
      return res.status(404).json({ success: false, message: 'Book not found or unauthorized' });
    }
    book.isAdvertised = isAdvertised;
    await book.save();
    res.json({ success: true, message: 'Book advertisement status updated' });
  } catch (error) {
    console.error('Advertise book error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Increment Book Views
app.patch('/api/books/:id/view', async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ success: false, message: 'Book not found' });
    }
    book.views = (book.views || 0) + 1;
    await book.save();
    res.json({ success: true, views: book.views });
  } catch (error) {
    console.error('View book error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get Single Book Details
app.get('/api/books/:id', async (req, res) => {
  try {
    const book = await Book.findById(req.params.id).lean();
    if (!book || book.status !== 'active') {
      return res.status(404).json({ success: false, message: 'Book not found' });
    }

    // Fetch seller info
    const seller = await User.findById(book.userId, 'name').lean();

    // Transform book data
    const bookData = {
      id: book._id.toString(),
      name: book.title,
      condition: book.condition,
      photos: book.imagePaths,
      quantity: book.quantity,
      mrp: book.mrp,
      author: book.author,
      edition: book.edition,
      description: book.description,
      sellingPrice: book.price,
      shippingCharges: book.isFreeShipping ? 0 : book.shippingPrice,
      seller: {
        name: seller ? seller.name : 'Unknown Seller',
        pincode: '110001', // Replace with actual seller pincode if stored
        id: book.userId.toString()
      },
      dateAdded: book.createdAt.toISOString().split('T')[0],
      views: book.views || 0
    };

    res.json({ success: true, book: bookData });
  } catch (error) {
    console.error('Fetch book details error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Add to Cart Route (assuming you want to implement this)
app.post('/api/cart', requireAuth, async (req, res) => {
  try {
    const { bookId, quantity } = req.body;
    // Implement your cart logic here (e.g., save to a Cart collection)
    // For now, just validate
    const book = await Book.findById(bookId);
    if (!book || book.quantity < quantity) {
      return res.status(400).json({ success: false, message: 'Book not available' });
    }
    res.json({ success: true, message: 'Added to cart' });
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Add to Wishlist Route (assuming you want to implement this)
app.post('/api/wishlist', requireAuth, async (req, res) => {
  try {
    const { bookId } = req.body;
    // Implement your wishlist logic here (e.g., save to a Wishlist collection)
    res.json({ success: true, message: 'Added to wishlist' });
  } catch (error) {
    console.error('Add to wishlist error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

const cartSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [{
    bookId: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
    quantity: { type: Number, required: true, min: 1 }
  }],
  createdAt: { type: Date, default: Date.now }
});

const wishlistSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  bookIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Book' }],
  createdAt: { type: Date, default: Date.now }
});

const Cart = mongoose.model('Cart', cartSchema);
const Wishlist = mongoose.model('Wishlist', wishlistSchema);

// Order Schema
const orderSchema = new mongoose.Schema({
  buyerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  bookId: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
  quantity: { type: Number, required: true, min: 1 },
  totalPrice: { type: Number, required: true },
  shippingPrice: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },
  orderDate: { type: Date, default: Date.now },
  expiresAt: { type: Date, default: () => new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) },
  trackingNumber: { type: String },
  deliveryPartner: { type: String },
  slipImagePath: { type: String }, // Store path to uploaded slip image
  estimatedDelivery: { type: Date },
  shippingAddress: { type: String, required: true }
});

const Order = mongoose.model('Order', orderSchema);

app.get('/api/seller/:sellerId/books', async (req, res) => {
  try {
    const books = await Book.find({ userId: req.params.sellerId, status: 'active' }).lean();
    const transformedBooks = books.map(book => ({
      id: book._id.toString(),
      title: book.title,
      author: book.author,
      price: book.price,
      coverImage: book.imagePaths[0]
    }));
    res.json({ success: true, books: transformedBooks });
  } catch (error) {
    console.error('Fetch seller books error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get User Profile Route
app.get('/profile', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('name phone_email isPhone address');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const profileData = {
      name: user.name || '',
      email: user.isPhone ? '' : user.phone_email,
      phone: user.isPhone ? user.phone_number : '',
      address: user.address || '',
      aadharVerified: false // Placeholder
    };

    res.json({ success: true, ...profileData });
  } catch (error) {
    console.error('Fetch profile error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update User Profile Route (single instance)
app.post('/profile/update', requireAuth, async (req, res) => {
  try {
    const { name, email, phone, address } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Name is required' });
    }
    if (!email && !phone) {
      return res.status(400).json({ success: false, message: 'Either email or phone is required' });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const isPhone = phone && /^\d{10}$/.test(phone);
    const phone_email = isPhone ? phone : email;

    if (phone_email && phone_email.toLowerCase() !== user.phone_email.toLowerCase()) {
      const existingUser = await User.findOne({ phone_email: phone_email.toLowerCase() });
      if (existingUser) {
        return res.status(400).json({ success: false, message: 'Email or phone already registered' });
      }
    }

    user.name = name;
    user.phone_email = phone_email ? phone_email.toLowerCase() : user.phone_email;
    user.phone_number = isPhone ? phone : user.phone_number;
    user.isPhone = isPhone !== undefined ? isPhone : user.isPhone;
    user.address = address !== undefined ? address : user.address;

    await user.save();

    const updatedProfile = {
      name: user.name,
      email: user.isPhone ? '' : user.phone_email,
      phone: user.phone_number || '',
      address: user.address || '',
      aadharVerified: false
    };

    res.json({ success: true, ...updatedProfile });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});
// Change Password Route
app.post('/profile/change-password', requireAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Current and new passwords are required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'New password must be at least 8 characters long' });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    await user.save();

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Create Order Route (Buy Now)
app.post('/api/orders', requireAuth, async (req, res) => {
  try {
    const { bookId, quantity, shippingAddress } = req.body;
    const buyerId = req.userId;

    // Validate input
    if (!bookId || !quantity || !shippingAddress) {
      return res.status(400).json({ success: false, message: 'Book ID, quantity, and shipping address are required' });
    }

    // Fetch book details
    const book = await Book.findById(bookId);
    if (!book || book.status !== 'active') {
      return res.status(404).json({ success: false, message: 'Book not found or not available' });
    }
    if (book.quantity < quantity) {
      return res.status(400).json({ success: false, message: 'Insufficient stock' });
    }

    // Calculate total price
    const totalPrice = book.price * quantity;
    const shippingPrice = book.isFreeShipping ? 0 : book.shippingPrice;

    // Create order
    const order = new Order({
      buyerId,
      sellerId: book.userId,
      bookId,
      quantity,
      totalPrice,
      shippingPrice,
      shippingAddress,
      orderDate: new Date(),
      expiresAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) // 2 days expiration
    });

    await order.save();

    // Update book quantity
    book.quantity -= quantity;
    if (book.quantity === 0) {
      book.status = 'sold';
    }
    await book.save();

    // Update buyer's phone_number if provided
    const buyer = await User.findById(buyerId);
    const phoneMatch = shippingAddress.match(/Phone: (\d{10})/);
    if (phoneMatch && !buyer.phone_number) {
      buyer.phone_number = phoneMatch[1];
      await buyer.save();
    }

    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      orderId: order._id
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get Seller Orders Route
app.get('/api/seller-orders', requireAuth, async (req, res) => {
  try {
    const sellerId = req.userId;
    const { status } = req.query; // Optional status filter

    let query = { sellerId };
    if (status && status !== 'all') {
      query.status = status === 'rejected' ? { $in: ['rejected', 'cancelled'] } : status;
    }

    const orders = await Order.find(query)
      .populate('buyerId', 'name')
      .populate('bookId', 'title imagePaths')
      .lean();

    const transformedOrders = orders.map(order => ({
      id: order._id.toString(),
      bookTitle: order.bookId.title,
      bookCover: order.bookId.imagePaths[0] || 'https://via.placeholder.com/150',
      buyerName: order.buyerId.name,
      buyerAddress: order.shippingAddress,
      orderDate: order.orderDate.toISOString(),
      price: order.totalPrice,
      quantity: order.quantity,
      status: order.status,
      expiresAt: order.expiresAt ? order.expiresAt.toISOString() : null
    }));

    res.json({ success: true, orders: transformedOrders });
  } catch (error) {
    console.error('Fetch seller orders error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update Order Status Route
app.patch('/api/orders/:id/status', requireAuth, async (req, res) => {
  try {
    const { status } = req.body;
    const orderId = req.params.id;
    const sellerId = req.userId;

    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const order = await Order.findOne({ _id: orderId, sellerId });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found or unauthorized' });
    }

    if (order.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Order cannot be updated' });
    }

    order.status = status;
    if (status === 'accepted') {
      order.expiresAt = undefined; // Remove expiration for accepted orders
    } else if (status === 'rejected') {
      // Restore book quantity
      const book = await Book.findById(order.bookId);
      if (book) {
        book.quantity += order.quantity;
        book.status = 'active';
        await book.save();
      }
    }

    await order.save();

    res.json({ success: true, message: `Order ${status} successfully` });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get Buyer Orders Route
app.get('/api/buyer-orders', requireAuth, async (req, res) => {
  try {
    const buyerId = req.userId;
    const { status } = req.query; // Optional status filter

    let query = { buyerId };
    if (status === 'active') {
      query.status = { $in: ['pending', 'accepted', 'shipped'] };
    } else if (status === 'past') {
      query.status = { $in: ['delivered', 'cancelled', 'rejected'] };
    }

    const orders = await Order.find(query)
      .populate('bookId', 'title author imagePaths')
      .lean();

    const transformedOrders = orders.map(order => ({
      id: order._id.toString(),
      orderNumber: `ORD-${order._id.toString().slice(-4)}`,
      orderDate: order.orderDate.toISOString(),
      status: order.status,
      items: [{
        title: order.bookId.title,
        author: order.bookId.author,
        price: order.totalPrice / order.quantity,
        thumbnail: order.bookId.imagePaths[0] || 'https://via.placeholder.com/150'
      }],
      total: order.totalPrice + order.shippingPrice,
      shippingAddress: order.shippingAddress,
      trackingNumber: order.trackingNumber || null,
      estimatedDelivery: order.estimatedDelivery ? order.estimatedDelivery.toISOString() : null
    }));

    res.json({ success: true, orders: transformedOrders });
  } catch (error) {
    console.error('Fetch buyer orders error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get Order Details
app.get('/api/orders/:id', requireAuth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('buyerId', 'name phone_email phone_number isPhone')
      .populate('bookId', 'title author condition imagePaths')
      .lean();
    if (!order || order.sellerId.toString() !== req.userId) {
      return res.status(404).json({ success: false, message: 'Order not found or unauthorized' });
    }

    const orderData = {
      id: order._id.toString(),
      bookId: {
        title: order.bookId.title,
        author: order.bookId.author,
        condition: order.bookId.condition,
        imagePaths: order.bookId.imagePaths
      },
      buyerId: {
        name: order.buyerId.name,
        phone: order.buyerId.isPhone ? (order.buyerId.phone_number || order.buyerId.phone_email) : '',
        email: !order.buyerId.isPhone ? order.buyerId.phone_email : ''
      },
      quantity: order.quantity,
      totalPrice: order.totalPrice,
      shippingAddress: order.shippingAddress,
      status: order.status
    };

    res.json({ success: true, order: orderData });
  } catch (error) {
    console.error('Fetch order details error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Submit Delivery Slip
app.post('/api/orders/:id/delivery', requireAuth, slipUpload.single('slipImage'), async (req, res) => {
  try {
    const { deliveryPartner, trackingNumber } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order || order.sellerId.toString() !== req.userId) {
      return res.status(404).json({ success: false, message: 'Order not found or unauthorized' });
    }
    if (order.status !== 'accepted') {
      return res.status(400).json({ success: false, message: 'Order must be accepted to submit delivery details' });
    }

    order.deliveryPartner = deliveryPartner;
    order.trackingNumber = trackingNumber;
    order.slipImagePath = req.file ? `/uploads/${req.file.filename}` : order.slipImagePath;
    order.status = 'shipped';
    order.estimatedDelivery = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // Example: 7 days from now

    await order.save();

    res.json({ success: true, message: 'Delivery slip submitted successfully' });
  } catch (error) {
    console.error('Submit delivery slip error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.patch('/api/orders/:id/confirm-payment', requireAuth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order || order.buyerId.toString() !== req.userId) {
      return res.status(404).json({ success: false, message: 'Order not found or unauthorized' });
    }
    if (order.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Order cannot be confirmed' });
    }

    order.status = 'accepted';
    order.expiresAt = undefined;
    await order.save();

    // Notify seller (simulated)
    console.log(`Order ${order._id} confirmed. Address sent to seller: ${order.shippingAddress}`);

    res.json({ success: true, message: 'Payment confirmed, order accepted' });
  } catch (error) {
    console.error('Confirm payment error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Add to Wishlist Route
app.post('/api/wishlist', requireAuth, async (req, res) => {
  try {
    const { bookId } = req.body;
    const userId = req.userId;

    if (!bookId) {
      return res.status(400).json({ success: false, message: 'Book ID is required' });
    }

    // Find or create wishlist for the user
    let wishlist = await Wishlist.findOne({ userId });
    if (!wishlist) {
      wishlist = new Wishlist({ userId, bookIds: [] });
    }

    // Check if book is already in wishlist
    if (wishlist.bookIds.includes(bookId)) {
      return res.status(400).json({ success: false, message: 'Book already in wishlist' });
    }

    // Add book to wishlist
    wishlist.bookIds.push(bookId);
    await wishlist.save();

    // Fetch book details for response
    const book = await Book.findById(bookId).lean();
    if (!book) {
      return res.status(404).json({ success: false, message: 'Book not found' });
    }

    res.json({
      success: true,
      message: 'Added to wishlist',
      book: {
        id: book._id.toString(),
        title: book.title,
        author: book.author,
        price: book.price,
        coverImage: book.imagePaths[0] || 'https://via.placeholder.com/150'
      }
    });
  } catch (error) {
    console.error('Add to wishlist error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get Wishlist Route
app.get('/api/wishlist', requireAuth, async (req, res) => {
  try {
    const userId = req.userId;
    const wishlist = await Wishlist.findOne({ userId }).populate('bookIds').lean();
    if (!wishlist) {
      return res.json({ success: true, books: [] });
    }

    const books = wishlist.bookIds.map(book => ({
      id: book._id.toString(),
      title: book.title,
      author: book.author,
      price: book.price,
      coverImage: book.imagePaths[0] || 'https://via.placeholder.com/150'
    }));

    res.json({ success: true, books });
  } catch (error) {
    console.error('Fetch wishlist error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Remove from Wishlist Route
app.delete('/api/wishlist/:bookId', requireAuth, async (req, res) => {
  try {
    const { bookId } = req.params;
    const userId = req.userId;

    const wishlist = await Wishlist.findOne({ userId });
    if (!wishlist) {
      return res.status(404).json({ success: false, message: 'Wishlist not found' });
    }

    const bookIndex = wishlist.bookIds.indexOf(bookId);
    if (bookIndex === -1) {
      return res.status(404).json({ success: false, message: 'Book not in wishlist' });
    }

    wishlist.bookIds.splice(bookIndex, 1);
    await wishlist.save();

    res.json({ success: true, message: 'Book removed from wishlist' });
  } catch (error) {
    console.error('Remove from wishlist error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});


// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
