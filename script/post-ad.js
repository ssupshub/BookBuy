document.addEventListener('DOMContentLoaded', function() {
  lucide.createIcons();
  
  // State
  let uploadedImages = [];
  let userId = null;
  
  // DOM elements
  const bookForm = document.getElementById('book-form');
  const imageUpload = document.getElementById('image-upload');
  const uploadZone = document.getElementById('upload-zone');
  const imagePreviews = document.getElementById('image-previews');
  const imagesCount = document.getElementById('images-count');
  const requirementText = document.querySelector('.requirement-text');
  const uploadBtn = document.querySelector('.upload-btn');
  
  // Form elements
  const bookType = document.getElementById('book-type');
  const bookCategory = document.getElementById('book-category');
  const bookSubcategory = document.getElementById('book-subcategory');
  const conditionRating = document.getElementById('condition-rating');
  const ratingValue = document.getElementById('rating-value');
  const ratingLabel = document.getElementById('rating-label');
  const bookDescription = document.getElementById('book-description');
  const wordCount = document.getElementById('word-count');
  const shippingOptions = document.querySelectorAll('input[name="shipping"]');
  const shippingPriceGroup = document.getElementById('shipping-price-group');
  const advertiseBook = document.getElementById('advertise-book');
  const commissionRow = document.getElementById('commission-row');
  
  // Earnings elements
  const earningsPrice = document.getElementById('earnings-price');
  const earningsShipping = document.getElementById('earnings-shipping');
  const earningsCommission = document.getElementById('earnings-commission');
  const totalEarnings = document.getElementById('total-earnings');
  
  // Category data
  const categoryData = {
    college: [
      { value: 'engineering', label: 'Engineering' },
      { value: 'medical', label: 'Medical' },
      { value: 'commerce', label: 'Commerce' },
      { value: 'arts', label: 'Arts' }
    ],
    exam: [
      { value: 'jee', label: 'JEE' },
      { value: 'neet', label: 'NEET' },
      { value: 'upsc', label: 'UPSC' },
      { value: 'banking', label: 'Banking' }
    ],
    reading: [
      { value: 'fiction', label: 'Fiction' },
      { value: 'non-fiction', label: 'Non-Fiction' },
      { value: 'biography', label: 'Biography' },
      { value: 'self-help', label: 'Self Help' }
    ],
    school: [
      { value: 'primary', label: 'Primary (1-5)' },
      { value: 'middle', label: 'Middle (6-8)' },
      { value: 'secondary', label: 'Secondary (9-10)' },
      { value: 'senior', label: 'Senior (11-12)' }
    ]
  };
  
  const subcategoryData = {
    engineering: ['Computer Science', 'Mechanical', 'Electrical', 'Civil'],
    medical: ['MBBS', 'Nursing', 'Pharmacy', 'Dentistry'],
    commerce: ['Accounting', 'Economics', 'Business Studies', 'Statistics'],
    arts: ['History', 'Political Science', 'English', 'Psychology'],
    jee: ['Physics', 'Chemistry', 'Mathematics'],
    neet: ['Physics', 'Chemistry', 'Biology'],
    upsc: ['General Studies', 'Optional Subjects', 'Current Affairs'],
    banking: ['Quantitative Aptitude', 'Reasoning', 'General Awareness'],
    fiction: ['Romance', 'Thriller', 'Mystery', 'Fantasy'],
    'non-fiction': ['History', 'Science', 'Technology', 'Travel'],
    biography: ['Political Leaders', 'Business Leaders', 'Artists', 'Scientists'],
    'self-help': ['Personal Development', 'Career', 'Health', 'Relationships'],
    primary: ['English', 'Mathematics', 'Science', 'Social Studies'],
    middle: ['English', 'Mathematics', 'Science', 'Social Studies'],
    secondary: ['English', 'Mathematics', 'Science', 'Social Studies'],
    senior: ['Physics', 'Chemistry', 'Mathematics', 'Biology']
  };
  
  const ratingLabels = [
    'Poor', 'Very Poor', 'Poor', 'Below Average', 'Average',
    'Above Average', 'Good', 'Very Good', 'Excellent', 'Like New'
  ];
  
  // Initialize
  init();
  
  async function init() {
    await checkSession();
    setupEventListeners();
    updateEarnings();
  }
  
  async function checkSession() {
    try {
      const response = await fetch('http://localhost:3000/api/session', {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (data.success) {
        userId = data.userId;
      } else {
        showToast('Login Required', 'Please login to sell books', 'warning');
        setTimeout(() => window.location.href = 'login.html', 2000);
      }
    } catch (error) {
      console.error('Session check error:', error);
      showToast('Error', 'Please login to continue', 'error');
      setTimeout(() => window.location.href = 'login.html', 2000);
    }
  }
  
  function setupEventListeners() {
    // Form submission
    bookForm.addEventListener('submit', handleFormSubmit);
    
    // Category cascading
    bookType.addEventListener('change', updateCategories);
    bookCategory.addEventListener('change', updateSubcategories);
    
    // Rating slider
    conditionRating.addEventListener('input', updateRating);
    
    // Description word count
    bookDescription.addEventListener('input', updateWordCount);
    
    // Shipping options
    shippingOptions.forEach(option => {
      option.addEventListener('change', handleShippingChange);
    });
    
    // Advertising toggle
    advertiseBook.addEventListener('change', updateEarnings);
    
    // Price inputs
    document.getElementById('book-price').addEventListener('input', updateEarnings);
    document.getElementById('shipping-price').addEventListener('input', updateEarnings);
    
    // Image upload
    uploadBtn.addEventListener('click', () => imageUpload.click());
    imageUpload.addEventListener('change', handleImageUpload);
    
    // Drag and drop
    uploadZone.addEventListener('dragover', handleDragOver);
    uploadZone.addEventListener('dragleave', handleDragLeave);
    uploadZone.addEventListener('drop', handleDrop);
    
    // Quantity custom input
    document.getElementById('book-quantity').addEventListener('change', handleQuantityChange);
  }
  
  function updateCategories() {
    const selectedType = bookType.value;
    bookCategory.innerHTML = '<option value="">Select category</option>';
    bookSubcategory.innerHTML = '<option value="">Select subcategory</option>';
    bookSubcategory.disabled = true;
    
    if (selectedType && categoryData[selectedType]) {
      bookCategory.disabled = false;
      categoryData[selectedType].forEach(category => {
        const option = document.createElement('option');
        option.value = category.value;
        option.textContent = category.label;
        bookCategory.appendChild(option);
      });
    } else {
      bookCategory.disabled = true;
    }
  }
  
  function updateSubcategories() {
    const selectedCategory = bookCategory.value;
    bookSubcategory.innerHTML = '<option value="">Select subcategory</option>';
    
    if (selectedCategory && subcategoryData[selectedCategory]) {
      bookSubcategory.disabled = false;
      subcategoryData[selectedCategory].forEach(subcategory => {
        const option = document.createElement('option');
        option.value = subcategory.toLowerCase().replace(/\s+/g, '-');
        option.textContent = subcategory;
        bookSubcategory.appendChild(option);
      });
    } else {
      bookSubcategory.disabled = true;
    }
  }
  
  function updateRating() {
    const value = parseInt(conditionRating.value);
    ratingValue.textContent = value;
    ratingLabel.textContent = ratingLabels[value - 1];
  }
  
  function updateWordCount() {
    const text = bookDescription.value.trim();
    const words = text ? text.split(/\s+/).length : 0;
    wordCount.textContent = words;
    
    const wordCountContainer = wordCount.parentElement;
    if (words < 10 || words > 300) {
      wordCountContainer.classList.add('error');
    } else {
      wordCountContainer.classList.remove('error');
    }
  }
  
  function handleShippingChange() {
    const selectedShipping = document.querySelector('input[name="shipping"]:checked').value;
    
    if (selectedShipping === 'paid') {
      shippingPriceGroup.classList.remove('hidden');
      document.getElementById('shipping-price').required = true;
    } else {
      shippingPriceGroup.classList.add('hidden');
      document.getElementById('shipping-price').required = false;
      document.getElementById('shipping-price').value = '';
    }
    
    updateEarnings();
  }
  
  function updateEarnings() {
    const price = parseFloat(document.getElementById('book-price').value) || 0;
    const shippingPrice = parseFloat(document.getElementById('shipping-price').value) || 0;
    const isAdvertised = advertiseBook.checked;
    const isFreeShipping = document.querySelector('input[name="shipping"]:checked')?.value === 'free';
    
    const shipping = isFreeShipping ? 0 : shippingPrice;
    const subtotal = price + shipping;
    const commission = isAdvertised ? subtotal * 0.1 : 0;
    const total = subtotal - commission;
    
    earningsPrice.textContent = `₹${price}`;
    earningsShipping.textContent = `₹${shipping}`;
    earningsCommission.textContent = `-₹${commission.toFixed(2)}`;
    totalEarnings.textContent = `₹${total.toFixed(2)}`;
    
    if (isAdvertised) {
      commissionRow.classList.remove('hidden');
    } else {
      commissionRow.classList.add('hidden');
    }
  }
  
  function handleQuantityChange() {
    const quantity = document.getElementById('book-quantity');
    if (quantity.value === 'custom') {
      const customQty = prompt('Enter custom quantity (1-100):');
      if (customQty && !isNaN(customQty) && customQty > 0 && customQty <= 100) {
        const option = document.createElement('option');
        option.value = customQty;
        option.textContent = customQty;
        option.selected = true;
        quantity.appendChild(option);
      } else {
        quantity.value = '1';
      }
    }
  }
  
  function handleImageUpload(e) {
    const files = Array.from(e.target.files);
    processFiles(files);
  }
  
  function handleDragOver(e) {
    e.preventDefault();
    uploadZone.classList.add('dragover');
  }
  
  function handleDragLeave(e) {
    e.preventDefault();
    uploadZone.classList.remove('dragover');
  }
  
  function handleDrop(e) {
    e.preventDefault();
    uploadZone.classList.remove('dragover');
    const files = Array.from(e.dataTransfer.files);
    processFiles(files);
  }
  
  function processFiles(files) {
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (uploadedImages.length + imageFiles.length > 10) {
      showToast('Too Many Images', 'Maximum 10 images allowed', 'error');
      return;
    }
    
    imageFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        uploadedImages.push({
          file: file,
          dataUrl: e.target.result
        });
        renderImagePreviews();
      };
      reader.readAsDataURL(file);
    });
  }
  
  function renderImagePreviews() {
    imagePreviews.innerHTML = '';
    
    uploadedImages.forEach((image, index) => {
      const preview = document.createElement('div');
      preview.className = 'image-preview';
      preview.innerHTML = `
        <img src="${image.dataUrl}" alt="Book image ${index + 1}">
        <button type="button" class="remove-image" data-index="${index}">
          <i data-lucide="x"></i>
        </button>
      `;
      
      preview.querySelector('.remove-image').addEventListener('click', () => {
        removeImage(index);
      });
      
      imagePreviews.appendChild(preview);
    });
    
    updateImageCount();
    lucide.createIcons();
  }
  
  function removeImage(index) {
    uploadedImages.splice(index, 1);
    renderImagePreviews();
  }
  
  function updateImageCount() {
    imagesCount.textContent = uploadedImages.length;
    
    if (uploadedImages.length < 4) {
      requirementText.textContent = `${4 - uploadedImages.length} more images required`;
      requirementText.className = 'requirement-text error';
    } else {
      requirementText.textContent = `${10 - uploadedImages.length} more images allowed`;
      requirementText.className = 'requirement-text success';
    }
  }
  
  async function handleFormSubmit(e) {
    e.preventDefault();
    
    if (!userId) {
      showToast('Error', 'Please login to sell books', 'error');
      return;
    }
    
    // Validate form
    if (!validateForm()) {
      return;
    }
    
    const submitBtn = document.querySelector('.submit-btn');
    const btnText = submitBtn.querySelector('.btn-text');
    const btnSpinner = submitBtn.querySelector('.btn-spinner');
    
    // Show loading state
    btnText.classList.add('hidden');
    btnSpinner.classList.remove('hidden');
    submitBtn.disabled = true;
    
    try {
      const formData = new FormData();
      
      // Add form fields
      formData.append('title', document.getElementById('book-title').value);
      formData.append('author', document.getElementById('book-author').value);
      formData.append('edition', document.getElementById('book-edition').value);
      formData.append('bookType', bookType.value);
      formData.append('category', bookCategory.value);
      formData.append('subcategory', bookSubcategory.value);
      formData.append('condition', document.getElementById('book-condition').value);
      formData.append('conditionRating', conditionRating.value);
      formData.append('mrp', document.getElementById('book-mrp').value);
      formData.append('price', document.getElementById('book-price').value);
      formData.append('quantity', document.getElementById('book-quantity').value);
      formData.append('description', bookDescription.value);
      
      // Shipping
      const isFreeShipping = document.querySelector('input[name="shipping"]:checked').value === 'free';
      formData.append('isFreeShipping', isFreeShipping);
      formData.append('shippingPrice', isFreeShipping ? '0' : document.getElementById('shipping-price').value);
      
      // Advertising
      formData.append('isAdvertised', advertiseBook.checked);
      
      // Add images
      uploadedImages.forEach((image, index) => {
        formData.append('images', image.file);
      });
      
      const response = await fetch('http://localhost:3000/api/books/post', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (data.success) {
        showToast('Success', 'Your book has been listed successfully!', 'success');
        setTimeout(() => {
          window.location.href = 'mylibrary.html';
        }, 2000);
      } else {
        showToast('Error', data.message || 'Failed to list book', 'error');
      }
    } catch (error) {
      console.error('Form submission error:', error);
      showToast('Error', 'Something went wrong. Please try again.', 'error');
    } finally {
      // Reset button state
      btnText.classList.remove('hidden');
      btnSpinner.classList.add('hidden');
      submitBtn.disabled = false;
    }
  }
  
  function validateForm() {
    // Check required fields
    const requiredFields = [
      'book-title', 'book-author', 'book-edition', 'book-type',
      'book-category', 'book-subcategory', 'book-condition',
      'book-mrp', 'book-price', 'book-quantity'
    ];
    
    for (const fieldId of requiredFields) {
      const field = document.getElementById(fieldId);
      if (!field.value.trim()) {
        showToast('Missing Information', `Please fill in the ${field.previousElementSibling.textContent}`, 'error');
        field.focus();
        return false;
      }
    }
    
    // Check description word count
    const description = bookDescription.value.trim();
    const words = description.split(/\s+/).length;
    if (words < 10 || words > 300) {
      showToast('Invalid Description', 'Description must be between 10-300 words', 'error');
      bookDescription.focus();
      return false;
    }
    
    // Check images
    if (uploadedImages.length < 4) {
      showToast('Missing Images', 'Please upload at least 4 images of your book', 'error');
      return false;
    }
    
    // Check shipping price if paid shipping is selected
    const isPaidShipping = document.querySelector('input[name="shipping"]:checked').value === 'paid';
    if (isPaidShipping && !document.getElementById('shipping-price').value) {
      showToast('Missing Shipping Price', 'Please enter shipping charges', 'error');
      document.getElementById('shipping-price').focus();
      return false;
    }
    
    return true;
  }
  
  function showToast(title, message, type = 'info') {
    if (window.BookSell && window.BookSell.showToast) {
      window.BookSell.showToast(title, message, type);
    } else {
      console.log(`${type.toUpperCase()}: ${title} - ${message}`);
    }
  }
  
  // Initialize rating display
  updateRating();
  updateImageCount();
});