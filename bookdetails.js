document.addEventListener('DOMContentLoaded', async function() {
  // Initialize Lucide icons
  lucide.createIcons();

  // DOM elements
  const mainImage = document.getElementById('mainImage');
  const thumbnailsContainer = document.querySelector('.thumbnail-grid');
  const quantityDisplay = document.getElementById('quantityDisplay');
  const decrementBtn = document.getElementById('decrementBtn');
  const incrementBtn = document.getElementById('incrementBtn');
  const buyNowBtn = document.getElementById('buyNowBtn');
  const addToCartBtn = document.getElementById('addToCartBtn');
  const wishlistBtn = document.getElementById('wishlistBtn');
  const viewSellerBooksBtn = document.getElementById('viewSellerBooksBtn');
  const imagePreview = document.getElementById('imagePreview');
  const previewImage = document.getElementById('previewImage');
  const closePreviewBtn = document.getElementById('closePreviewBtn');
  const bookTitle = document.querySelector('.book-title');
  const authorInfo = document.querySelector('.author-info span');
  const conditionBadge = document.querySelector('.condition-badge');
  const dateAdded = document.querySelector('.meta-item span:first-of-type');
  const viewsCount = document.querySelector('.meta-item span:last-of-type');
  const editionInfo = document.querySelector('.edition-info');
  const sellingPrice = document.querySelector('.selling-price');
  const mrp = document.querySelector('.mrp');
  const discount = document.querySelector('.discount');
  const shippingInfo = document.querySelector('.shipping-info');
  const stockInfo = document.querySelector('.stock-info');
  const descriptionText = document.querySelector('.description-text');
  const sellerName = document.querySelector('.seller-name');
  const sellerLocation = document.querySelector('.seller-location');

  // Current state
  let currentQuantity = 1;
  let bookData = null;
  let userId = null;

  // Get book ID from URL
  const urlParams = new URLSearchParams(window.location.search);
  const bookId = urlParams.get('id');

  if (!bookId) {
    showToast('Error', 'No book ID provided.');
    return;
  }

  // Check session
  async function checkSession() {
    try {
      const response = await fetch('http://localhost:3000/api/session', {
        method: 'GET',
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

  // Fetch book data
  async function fetchBookData() {
    try {
      const response = await fetch(`http://localhost:3000/api/books/${bookId}`, {
        method: 'GET',
        credentials: 'include'
      });
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message);
      }
      bookData = data.book;

      // Update DOM with book data
      bookTitle.textContent = bookData.name;
      authorInfo.textContent = `By ${bookData.author}`;
      conditionBadge.textContent = `${bookData.condition} Condition`;
      dateAdded.textContent = `Added ${bookData.dateAdded}`;
      viewsCount.textContent = `${bookData.views} views`;
      editionInfo.textContent = `Edition: ${bookData.edition}`;
      sellingPrice.textContent = `₹${bookData.sellingPrice}`;
      mrp.textContent = `₹${bookData.mrp}`;
      discount.textContent = `${Math.round(((bookData.mrp - bookData.sellingPrice) / bookData.mrp) * 100)}% off`;
      shippingInfo.textContent = `+ ₹${bookData.shippingCharges} shipping charges`;
      stockInfo.textContent = `In Stock (${bookData.quantity} available)`;
      descriptionText.textContent = bookData.description;
      sellerName.textContent = bookData.seller.name;
      sellerLocation.textContent = `Ships from: ${bookData.seller.pincode}`;

      // Update main image
      mainImage.src = bookData.photos[0] || 'https://via.placeholder.com/800';

      // Populate thumbnails
      thumbnailsContainer.innerHTML = '';
      bookData.photos.forEach((photo, index) => {
        const thumbnailDiv = document.createElement('div');
        thumbnailDiv.className = `thumbnail ${index === 0 ? 'active' : ''}`;
        thumbnailDiv.setAttribute('data-image', photo);
        thumbnailDiv.innerHTML = `<img src="${photo}" alt="${bookData.name} - view ${index + 1}" class="thumbnail-image">`;
        thumbnailsContainer.appendChild(thumbnailDiv);
      });


      const loadingEl = document.getElementById('loading');
  const errorEl = document.getElementById('error');
  try {
    loadingEl.style.display = 'block';
    errorEl.style.display = 'none';
    // ... existing fetch logic ...
    loadingEl.style.display = 'none';
  } catch (error) {
    loadingEl.style.display = 'none';
    errorEl.style.display = 'block';
    errorEl.textContent = error.message || 'Failed to load book details.';
    console.error('Fetch book error:', error);
  }

      // Re-attach thumbnail event listeners
      const thumbnails = document.querySelectorAll('.thumbnail');
      thumbnails.forEach(thumbnail => {
        thumbnail.addEventListener('click', function() {
          const imageSrc = this.getAttribute('data-image');
          mainImage.src = imageSrc;
          thumbnails.forEach(t => t.classList.remove('active'));
          this.classList.add('active');
        });
      });

      // Increment view count
      await fetch(`http://localhost:3000/api/books/${bookId}/view`, {
        method: 'PATCH',
        credentials: 'include'
      });

      // Initialize quantity
      updateQuantityDisplay();
    } catch (error) {
      console.error('Fetch book error:', error);
      showToast('Error', 'Failed to load book details.');
    }
  }

  // Initialize page
  await checkSession();
  await fetchBookData();

  // Image handling
  mainImage.addEventListener('click', function() {
    previewImage.src = mainImage.src;
    imagePreview.classList.add('show');
  });

  closePreviewBtn.addEventListener('click', function() {
    imagePreview.classList.remove('show');
  });

  imagePreview.addEventListener('click', function(e) {
    if (e.target === imagePreview) {
      imagePreview.classList.remove('show');
    }
  });

// Wishlist button handler
wishlistBtn.addEventListener('click', async function() {
  if (!userId) {
    showToast('Error', 'Please log in to add to wishlist.');
    return;
  }
  try {
    const response = await fetch('http://localhost:3000/api/wishlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ bookId: bookData.id })
    });
    const data = await response.json();
    if (data.success) {
      showToast('Added to wishlist', `"${bookData.name}" has been added to your wishlist.`);
    } else {
      showToast('Error', data.message || 'Failed to add to wishlist.');
    }
  } catch (error) {
    console.error('Add to wishlist error:', error);
    showToast('Error', 'Failed to add to wishlist.');
  }
});

  // Quantity control
  decrementBtn.addEventListener('click', function() {
    if (currentQuantity > 1) {
      currentQuantity--;
      updateQuantityDisplay();
    }
  });

  incrementBtn.addEventListener('click', function() {
    if (bookData && currentQuantity < bookData.quantity) {
      currentQuantity++;
      updateQuantityDisplay();
    }
  });

  function updateQuantityDisplay() {
    quantityDisplay.textContent = currentQuantity;
    decrementBtn.disabled = currentQuantity <= 1;
    incrementBtn.disabled = bookData && currentQuantity >= bookData.quantity;
  }

  // Action buttons
  buyNowBtn.addEventListener('click', async function() {
    if (!userId) {
      showToast('Error', 'Please log in to proceed to checkout.');
      return;
    }
  
    // Store book data in sessionStorage to pass to checkout
    const checkoutData = {
      bookId: bookData.id,
      quantity: currentQuantity,
      bookName: bookData.name,
      sellingPrice: bookData.sellingPrice,
      shippingCharges: bookData.shippingCharges,
      image: bookData.photos[0] || 'https://via.placeholder.com/150'
    };
    sessionStorage.setItem('checkoutData', JSON.stringify(checkoutData));
  
    // Redirect to checkout page
    window.location.href = '/checkout.html';
  });


  addToCartBtn.addEventListener('click', async function() {
    if (!userId) {
      showToast('Error', 'Please log in to add to cart.');
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
        showToast('Added to cart', `${currentQuantity} copy/copies of "${bookData.name}" added to your cart.`);
      } else {
        showToast('Error', data.message || 'Failed to add to cart.');
      }
    } catch (error) {
      console.error('Add to cart error:', error);
      showToast('Error', 'Failed to add to cart.');
    }
  });

  wishlistBtn.addEventListener('click', async function() {
    if (!userId) {
      showToast('Error', 'Please log in to add to wishlist.');
      return;
    }
    try {
      const response = await fetch('http://localhost:3000/api/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ bookId: bookData.id })
      });
      const data = await response.json();
      if (data.success) {
        showToast('Added to wishlist', `"${bookData.name}" has been added to your wishlist.`);
      } else {
        showToast('Error', data.message || 'Failed to add to wishlist.');
      }
    } catch (error) {
      console.error('Add to wishlist error:', error);
      showToast('Error', 'Failed to add to wishlist.');
    }
  });

  viewSellerBooksBtn.addEventListener('click', function() {
    showToast('Viewing seller\'s books', `Showing more books from ${bookData.seller.name}.`);
    // Navigate to seller's books page
    window.location.href = `/seller-books?sellerId=${bookData.seller.id}`;
  });

  // Toast notification functionality
  function showToast(title, message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
      <div class="toast-content">
        <div class="toast-title">${title}</div>
        <div class="toast-message">${message}</div>
      </div>
    `;
    
    document.body.appendChild(toast);
    
    Object.assign(toast.style, {
      position: 'fixed',
      bottom: '1rem',
      right: '1rem',
      backgroundColor: 'white',
      color: '#374151',
      borderRadius: '0.375rem',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08)',
      padding: '1rem',
      maxWidth: '24rem',
      zIndex: '100',
      transform: 'translateY(1rem)',
      opacity: '0',
      transition: 'transform 0.3s, opacity 0.3s'
    });
    
    Object.assign(toast.querySelector('.toast-title').style, {
      fontWeight: '600',
      fontSize: '1rem',
      marginBottom: '0.25rem'
    });
    
    Object.assign(toast.querySelector('.toast-message').style, {
      fontSize: '0.875rem',
      color: '#6b7280'
    });
    
    setTimeout(() => {
      toast.style.transform = 'translateY(0)';
      toast.style.opacity = '1';
    }, 10);
    
    setTimeout(() => {
      toast.style.transform = 'translateY(1rem)';
      toast.style.opacity = '0';
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 300);
    }, 3000);
  }
});