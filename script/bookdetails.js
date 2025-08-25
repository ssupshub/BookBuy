document.addEventListener('DOMContentLoaded', function() {
  lucide.createIcons();
  
  // State
  let bookData = null;
  let currentQuantity = 1;
  let userId = null;
  let isWishlisted = false;
  
  // DOM elements
  const loadingState = document.getElementById('loading-state');
  const errorState = document.getElementById('error-state');
  const bookDetailsContainer = document.getElementById('book-details');
  const mainImage = document.getElementById('main-image');
  const thumbnailGrid = document.getElementById('thumbnail-grid');
  const imageModal = document.getElementById('image-modal');
  const modalImage = document.getElementById('modal-image');
  const modalClose = document.querySelector('.modal-close');
  const imageZoomBtn = document.querySelector('.image-zoom-btn');
  
  // Book info elements
  const bookTitle = document.getElementById('book-title');
  const bookAuthor = document.getElementById('book-author');
  const bookCondition = document.getElementById('book-condition');
  const bookViews = document.getElementById('book-views');
  const bookDate = document.getElementById('book-date');
  const bookPrice = document.getElementById('book-price');
  const bookOriginalPrice = document.getElementById('book-original-price');
  const discountPercentage = document.getElementById('discount-percentage');
  const shippingText = document.getElementById('shipping-text');
  const stockText = document.getElementById('stock-text');
  const quantityDisplay = document.getElementById('quantity-display');
  const bookDescriptionText = document.getElementById('book-description-text');
  const sellerName = document.getElementById('seller-name');
  const sellerLocation = document.getElementById('seller-location');
  const breadcrumbTitle = document.getElementById('breadcrumb-title');
  
  // Action buttons
  const qtyDecrease = document.getElementById('qty-decrease');
  const qtyIncrease = document.getElementById('qty-increase');
  const buyNowBtn = document.getElementById('buy-now-btn');
  const addToCartBtn = document.getElementById('add-to-cart-btn');
  const wishlistBtn = document.getElementById('wishlist-btn');
  const viewSellerBooksBtn = document.getElementById('view-seller-books');
  
  // Get book ID from URL
  const urlParams = new URLSearchParams(window.location.search);
  const bookId = urlParams.get('id');
  
  if (!bookId) {
    showError();
    return;
  }
  
  // Initialize
  init();
  
  async function init() {
    await checkSession();
    await fetchBookDetails();
    setupEventListeners();
  }
  
  async function checkSession() {
    try {
      const response = await fetch('http://localhost:3000/api/session', {
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) {
        userId = data.userId;
      }
    } catch (error) {
      console.error('Session check error:', error);
    }
  }
  
  async function fetchBookDetails() {
    try {
      const response = await fetch(`http://localhost:3000/api/books/${bookId}`, {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (data.success) {
        bookData = data.book;
        populateBookDetails();
        await incrementViews();
      } else {
        showError();
      }
    } catch (error) {
      console.error('Fetch book details error:', error);
      showError();
    }
  }
  
  async function incrementViews() {
    try {
      await fetch(`http://localhost:3000/api/books/${bookId}/view`, {
        method: 'PATCH',
        credentials: 'include'
      });
    } catch (error) {
      console.error('Increment views error:', error);
    }
  }
  
  function populateBookDetails() {
    // Hide loading, show content
    loadingState.classList.add('hidden');
    bookDetailsContainer.classList.remove('hidden');
    
    // Populate basic info
    bookTitle.textContent = bookData.name;
    bookAuthor.textContent = `by ${bookData.author}`;
    bookCondition.textContent = `${bookData.condition} Condition`;
    bookViews.textContent = bookData.views || 0;
    bookDate.textContent = formatDate(bookData.dateAdded);
    bookDescriptionText.textContent = bookData.description;
    breadcrumbTitle.textContent = bookData.name;
    
    // Populate pricing
    bookPrice.textContent = `₹${bookData.sellingPrice}`;
    
    if (bookData.mrp > bookData.sellingPrice) {
      bookOriginalPrice.textContent = `₹${bookData.mrp}`;
      bookOriginalPrice.classList.remove('hidden');
      
      const discount = Math.round(((bookData.mrp - bookData.sellingPrice) / bookData.mrp) * 100);
      discountPercentage.textContent = `${discount}% OFF`;
      discountPercentage.classList.remove('hidden');
    }
    
    // Populate shipping info
    if (bookData.shippingCharges === 0) {
      shippingText.textContent = 'Free shipping';
    } else {
      shippingText.textContent = `₹${bookData.shippingCharges} shipping`;
    }
    
    // Populate stock info
    if (bookData.quantity > 0) {
      stockText.textContent = `${bookData.quantity} available`;
      stockText.className = 'in-stock';
    } else {
      stockText.textContent = 'Out of stock';
      stockText.className = 'out-of-stock';
    }
    
    // Populate seller info
    sellerName.textContent = bookData.seller.name;
    sellerLocation.textContent = `Ships from: ${bookData.seller.pincode}`;
    
    // Populate images
    if (bookData.photos && bookData.photos.length > 0) {
      mainImage.src = bookData.photos[0];
      mainImage.alt = bookData.name;
      
      // Create thumbnails
      thumbnailGrid.innerHTML = '';
      bookData.photos.forEach((photo, index) => {
        const thumbnail = document.createElement('div');
        thumbnail.className = `thumbnail ${index === 0 ? 'active' : ''}`;
        thumbnail.innerHTML = `<img src="${photo}" alt="${bookData.name} - Image ${index + 1}">`;
        thumbnail.addEventListener('click', () => selectImage(photo, thumbnail));
        thumbnailGrid.appendChild(thumbnail);
      });
    }
    
    // Update quantity controls
    updateQuantityControls();
    
    // Check wishlist status
    checkWishlistStatus();
  }
  
  function selectImage(imageSrc, thumbnailElement) {
    mainImage.src = imageSrc;
    
    // Update active thumbnail
    document.querySelectorAll('.thumbnail').forEach(thumb => {
      thumb.classList.remove('active');
    });
    thumbnailElement.classList.add('active');
  }
  
  function setupEventListeners() {
    // Quantity controls
    qtyDecrease.addEventListener('click', () => {
      if (currentQuantity > 1) {
        currentQuantity--;
        updateQuantityControls();
      }
    });
    
    qtyIncrease.addEventListener('click', () => {
      if (bookData && currentQuantity < bookData.quantity) {
        currentQuantity++;
        updateQuantityControls();
      }
    });
    
    // Action buttons
    buyNowBtn.addEventListener('click', handleBuyNow);
    addToCartBtn.addEventListener('click', handleAddToCart);
    wishlistBtn.addEventListener('click', handleWishlistToggle);
    viewSellerBooksBtn.addEventListener('click', handleViewSellerBooks);
    
    // Image modal
    imageZoomBtn.addEventListener('click', openImageModal);
    modalClose.addEventListener('click', closeImageModal);
    imageModal.addEventListener('click', (e) => {
      if (e.target === imageModal) closeImageModal();
    });
    
    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && imageModal.classList.contains('active')) {
        closeImageModal();
      }
    });
  }
  
  function updateQuantityControls() {
    quantityDisplay.textContent = currentQuantity;
    qtyDecrease.disabled = currentQuantity <= 1;
    qtyIncrease.disabled = !bookData || currentQuantity >= bookData.quantity;
  }
  
  async function checkWishlistStatus() {
    if (!userId) return;
    
    try {
      const response = await fetch('http://localhost:3000/api/wishlist', {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (data.success) {
        isWishlisted = data.books.some(book => book.id === bookId);
        updateWishlistButton();
      }
    } catch (error) {
      console.error('Check wishlist error:', error);
    }
  }
  
  function updateWishlistButton() {
    const wishlistText = wishlistBtn.querySelector('.wishlist-text');
    
    if (isWishlisted) {
      wishlistBtn.classList.add('active');
      wishlistText.textContent = 'Remove from Wishlist';
    } else {
      wishlistBtn.classList.remove('active');
      wishlistText.textContent = 'Add to Wishlist';
    }
  }
  
  async function handleBuyNow() {
    if (!userId) {
      showToast('Login Required', 'Please login to purchase books', 'warning');
      setTimeout(() => window.location.href = 'login.html', 1000);
      return;
    }
    
    if (!bookData || bookData.quantity < currentQuantity) {
      showToast('Out of Stock', 'This book is currently out of stock', 'error');
      return;
    }
    
    // Store checkout data
    const checkoutData = {
      bookId: bookData.id,
      quantity: currentQuantity,
      bookName: bookData.name,
      sellingPrice: bookData.sellingPrice,
      shippingCharges: bookData.shippingCharges,
      image: bookData.photos[0] || 'https://via.placeholder.com/150'
    };
    
    sessionStorage.setItem('checkoutData', JSON.stringify(checkoutData));
    window.location.href = 'checkout.html';
  }
  
  async function handleAddToCart() {
    if (!userId) {
      showToast('Login Required', 'Please login to add items to cart', 'warning');
      setTimeout(() => window.location.href = 'login.html', 1000);
      return;
    }
    
    try {
      const response = await fetch('http://localhost:3000/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ bookId: bookData.id, quantity: currentQuantity })
      });
      const data = await response.json();
      
      if (data.success) {
        showToast('Added to Cart', `${currentQuantity} copy added to your cart`, 'success');
      } else {
        showToast('Error', data.message || 'Failed to add to cart', 'error');
      }
    } catch (error) {
      console.error('Add to cart error:', error);
      showToast('Error', 'Failed to add to cart', 'error');
    }
  }
  
  async function handleWishlistToggle() {
    if (!userId) {
      showToast('Login Required', 'Please login to manage your wishlist', 'warning');
      setTimeout(() => window.location.href = 'login.html', 1000);
      return;
    }
    
    try {
      if (isWishlisted) {
        const response = await fetch(`http://localhost:3000/api/wishlist/${bookId}`, {
          method: 'DELETE',
          credentials: 'include'
        });
        const data = await response.json();
        
        if (data.success) {
          isWishlisted = false;
          updateWishlistButton();
          showToast('Removed', 'Book removed from wishlist', 'info');
        }
      } else {
        const response = await fetch('http://localhost:3000/api/wishlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ bookId })
        });
        const data = await response.json();
        
        if (data.success) {
          isWishlisted = true;
          updateWishlistButton();
          showToast('Added', 'Book added to wishlist', 'success');
        }
      }
    } catch (error) {
      console.error('Wishlist toggle error:', error);
      showToast('Error', 'Failed to update wishlist', 'error');
    }
  }
  
  function handleViewSellerBooks() {
    if (bookData && bookData.seller) {
      window.location.href = `seller-books.html?sellerId=${bookData.seller.id}`;
    }
  }
  
  function openImageModal() {
    modalImage.src = mainImage.src;
    imageModal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
  
  function closeImageModal() {
    imageModal.classList.remove('active');
    document.body.style.overflow = '';
  }
  
  function showError() {
    loadingState.classList.add('hidden');
    errorState.classList.remove('hidden');
  }
  
  function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
  
  function showToast(title, message, type = 'info') {
    if (window.BookSell && window.BookSell.showToast) {
      window.BookSell.showToast(title, message, type);
    } else {
      console.log(`${type.toUpperCase()}: ${title} - ${message}`);
    }
  }
});