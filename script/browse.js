document.addEventListener('DOMContentLoaded', function() {
  lucide.createIcons();
  
  // State management
  let books = [];
  let filteredBooks = [];
  let wishlistedBooks = new Set();
  let currentView = 'grid';
  let isLoading = false;
  let userId = null;
  
  // DOM elements
  const searchForm = document.getElementById('search-form');
  const searchInput = document.getElementById('search-input');
  const booksGrid = document.getElementById('books-grid');
  const loadingState = document.getElementById('loading-state');
  const emptyState = document.getElementById('empty-state');
  const resultsCount = document.getElementById('results-count');
  const viewBtns = document.querySelectorAll('.view-btn');
  const filterInputs = document.querySelectorAll('input[name="condition"], #category-filter, #sort-filter, #min-price, #max-price');
  const clearFiltersBtn = document.getElementById('clear-filters');
  const wishlistCountEl = document.getElementById('wishlist-count');
  const cartCountEl = document.getElementById('cart-count');
  
  // Initialize
  init();
  
  async function init() {
    await checkSession();
    await fetchBooks();
    await updateWishlistCount();
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
        await fetchWishlist();
      }
    } catch (error) {
      console.error('Session check error:', error);
    }
  }
  
  async function fetchWishlist() {
    if (!userId) return;
    
    try {
      const response = await fetch('http://localhost:3000/api/wishlist', {
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) {
        wishlistedBooks = new Set(data.books.map(book => book.id));
      }
    } catch (error) {
      console.error('Fetch wishlist error:', error);
    }
  }
  
  async function fetchBooks() {
    setLoading(true);
    
    try {
      const params = new URLSearchParams();
      
      // Add search query
      const searchQuery = searchInput.value.trim();
      if (searchQuery) {
        params.append('search', searchQuery);
      }
      
      // Add filters
      const condition = document.querySelector('input[name="condition"]:checked')?.value;
      if (condition) params.append('condition', condition);
      
      const category = document.getElementById('category-filter').value;
      if (category) params.append('category', category);
      
      const minPrice = document.getElementById('min-price').value;
      if (minPrice) params.append('minPrice', minPrice);
      
      const maxPrice = document.getElementById('max-price').value;
      if (maxPrice) params.append('maxPrice', maxPrice);
      
      const sortBy = document.getElementById('sort-filter').value;
      if (sortBy) params.append('sortBy', sortBy);
      
      const response = await fetch(`http://localhost:3000/api/books?${params}`, {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (data.success) {
        books = data.books;
        filteredBooks = books;
        renderBooks();
      } else {
        showError('Failed to load books');
      }
    } catch (error) {
      console.error('Fetch books error:', error);
      showError('Failed to load books');
    } finally {
      setLoading(false);
    }
  }
  
  function setupEventListeners() {
    // Search form
    searchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      fetchBooks();
    });
    
    // Real-time search with debounce
    searchInput.addEventListener('input', debounce(fetchBooks, 500));
    
    // Filter changes
    filterInputs.forEach(input => {
      input.addEventListener('change', fetchBooks);
    });
    
    // Price inputs with debounce
    document.getElementById('min-price').addEventListener('input', debounce(fetchBooks, 800));
    document.getElementById('max-price').addEventListener('input', debounce(fetchBooks, 800));
    
    // View toggle
    viewBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        viewBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentView = btn.dataset.view;
        updateView();
      });
    });
    
    // Clear filters
    clearFiltersBtn.addEventListener('click', clearAllFilters);
  }
  
  function renderBooks() {
    if (filteredBooks.length === 0) {
      showEmptyState();
      return;
    }
    
    showBooksGrid();
    updateResultsCount();
    
    const template = document.getElementById('book-card-template');
    booksGrid.innerHTML = '';
    
    filteredBooks.forEach(book => {
      const bookElement = template.content.cloneNode(true);
      populateBookCard(bookElement, book);
      booksGrid.appendChild(bookElement);
    });
    
    lucide.createIcons();
    updateView();
  }
  
  function populateBookCard(element, book) {
    const card = element.querySelector('.book-card');
    const image = element.querySelector('.book-image');
    const title = element.querySelector('.book-title');
    const author = element.querySelector('.book-author');
    const condition = element.querySelector('.condition-badge');
    const price = element.querySelector('.book-price');
    const originalPrice = element.querySelector('.book-original-price');
    const discountBadge = element.querySelector('.discount-badge');
    const discountText = element.querySelector('.discount-text');
    const wishlistBtn = element.querySelector('.wishlist-btn');
    const addToCartBtn = element.querySelector('.add-to-cart-btn');
    
    // Set book data
    card.dataset.bookId = book.id;
    image.src = book.coverImage;
    image.alt = book.title;
    title.textContent = book.title;
    author.textContent = `by ${book.author}`;
    condition.textContent = book.condition;
    price.textContent = `₹${book.price}`;
    
    // Handle original price and discount
    if (book.originalPrice && book.discountPercentage) {
      originalPrice.textContent = `₹${book.originalPrice}`;
      originalPrice.style.display = 'inline';
      discountBadge.classList.remove('hidden');
      discountText.textContent = `${book.discountPercentage}% OFF`;
    } else {
      originalPrice.style.display = 'none';
      discountBadge.classList.add('hidden');
    }
    
    // Wishlist state
    if (wishlistedBooks.has(book.id)) {
      wishlistBtn.classList.add('active');
    }
    
    // Event listeners
    card.addEventListener('click', (e) => {
      if (!e.target.closest('.wishlist-btn') && !e.target.closest('.add-to-cart-btn')) {
        window.location.href = `bookdetails.html?id=${book.id}`;
      }
    });
    
    wishlistBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleWishlist(book.id, wishlistBtn);
    });
    
    addToCartBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      addToCart(book.id);
    });
  }
  
  async function toggleWishlist(bookId, button) {
    if (!userId) {
      showToast('Login Required', 'Please login to manage your wishlist', 'warning');
      setTimeout(() => window.location.href = 'login.html', 1000);
      return;
    }
    
    const isWishlisted = wishlistedBooks.has(bookId);
    
    try {
      if (isWishlisted) {
        const response = await fetch(`http://localhost:3000/api/wishlist/${bookId}`, {
          method: 'DELETE',
          credentials: 'include'
        });
        const data = await response.json();
        
        if (data.success) {
          wishlistedBooks.delete(bookId);
          button.classList.remove('active');
          showToast('Removed', 'Book removed from wishlist', 'info');
          updateWishlistCount();
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
          wishlistedBooks.add(bookId);
          button.classList.add('active');
          showToast('Added', 'Book added to wishlist', 'success');
          updateWishlistCount();
        }
      }
    } catch (error) {
      console.error('Wishlist error:', error);
      showToast('Error', 'Failed to update wishlist', 'error');
    }
  }
  
  async function addToCart(bookId) {
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
        body: JSON.stringify({ bookId, quantity: 1 })
      });
      const data = await response.json();
      
      if (data.success) {
        showToast('Added to Cart', 'Book added to your cart', 'success');
        updateCartCount();
      } else {
        showToast('Error', data.message || 'Failed to add to cart', 'error');
      }
    } catch (error) {
      console.error('Add to cart error:', error);
      showToast('Error', 'Failed to add to cart', 'error');
    }
  }
  
  async function updateWishlistCount() {
    if (wishlistCountEl) {
      wishlistCountEl.textContent = wishlistedBooks.size;
    }
  }
  
  async function updateCartCount() {
    // This would typically fetch cart count from backend
    // For now, just increment the display
    if (cartCountEl) {
      const currentCount = parseInt(cartCountEl.textContent) || 0;
      cartCountEl.textContent = currentCount + 1;
    }
  }
  
  function updateView() {
    if (currentView === 'list') {
      booksGrid.classList.add('list-view');
    } else {
      booksGrid.classList.remove('list-view');
    }
  }
  
  function setLoading(loading) {
    isLoading = loading;
    if (loading) {
      loadingState.classList.remove('hidden');
      booksGrid.classList.add('hidden');
      emptyState.classList.add('hidden');
    } else {
      loadingState.classList.add('hidden');
    }
  }
  
  function showBooksGrid() {
    booksGrid.classList.remove('hidden');
    emptyState.classList.add('hidden');
  }
  
  function showEmptyState() {
    booksGrid.classList.add('hidden');
    emptyState.classList.remove('hidden');
  }
  
  function showError(message) {
    showToast('Error', message, 'error');
    showEmptyState();
  }
  
  function updateResultsCount() {
    const count = filteredBooks.length;
    resultsCount.textContent = `${count} book${count !== 1 ? 's' : ''} found`;
  }
  
  function clearAllFilters() {
    // Clear search
    searchInput.value = '';
    
    // Clear radio buttons
    document.querySelectorAll('input[name="condition"]').forEach(input => {
      input.checked = false;
    });
    
    // Clear selects
    document.getElementById('category-filter').value = '';
    document.getElementById('sort-filter').value = '';
    
    // Clear price inputs
    document.getElementById('min-price').value = '';
    document.getElementById('max-price').value = '';
    
    // Fetch books with cleared filters
    fetchBooks();
  }
  
  // Make clearAllFilters available globally
  window.clearAllFilters = clearAllFilters;
  
  function showToast(title, message, type = 'info') {
    if (window.BookSell && window.BookSell.showToast) {
      window.BookSell.showToast(title, message, type);
    } else {
      console.log(`${type.toUpperCase()}: ${title} - ${message}`);
    }
  }
  
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
});