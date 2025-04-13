// State management
let state = {
  books: [],
  searchQuery: "",
  selectedCategory: null,
  selectedSubcategory: null,
  sortBy: "",
  selectedCondition: "",
  priceRange: [0, 1500],
  selectedDiscount: null,
  wishlistedBooks: new Set(),
  categories: [],
  userId: null
};

// DOM Elements
document.addEventListener('DOMContentLoaded', async () => {
  // Check session to get userId
  await checkSession();

  // Mobile menu
  const mobileMenuToggle = document.getElementById('mobileMenuToggle');
  const mobileMenu = document.getElementById('mobileMenu');

  if (mobileMenuToggle && mobileMenu) {
    mobileMenuToggle.addEventListener('click', () => {
      mobileMenu.classList.toggle('open');
    });
  }

  // Initialize accordion functionality
  initAccordion();

  // Initialize price range slider
  initPriceRangeSlider();

  // Fetch categories, books, and wishlist on load
  await Promise.all([fetchCategories(), fetchBooks(), fetchWishlist()]).then(() => {
    // Initialize event listeners after data is loaded
    initEventListeners();
    // Render initial books
    renderBooks(state.books);
    // Render categories
    renderCategories();
  });
});

// Check user session
async function checkSession() {
  try {
    const response = await fetch('http://localhost:3000/api/session', {
      method: 'GET',
      credentials: 'include'
    });
    const data = await response.json();
    if (data.success) {
      state.userId = data.userId;
    }
  } catch (error) {
    console.error('Session check error:', error);
  }
}

// Initialize accordion functionality
function initAccordion() {
  const accordionHeaders = document.querySelectorAll('.accordion-header');
  accordionHeaders.forEach(header => {
    const accordionId = header.getAttribute('data-accordion');
    const content = document.getElementById(`${accordionId}-content`);

    // Open price-range by default
    if (accordionId === 'price-range') {
      header.classList.add('active');
      content.classList.add('open');
    }

    header.addEventListener('click', () => {
      header.classList.toggle('active');
      content.classList.toggle('open');
    });
  });
}

// Initialize price range slider
function initPriceRangeSlider() {
  const priceSlider = document.getElementById('priceRangeSlider');
  const priceMin = document.getElementById('priceRangeMin');
  const priceMax = document.getElementById('priceRangeMax');

  if (priceSlider && window.noUiSlider) {
    noUiSlider.create(priceSlider, {
      start: [0, 1500],
      connect: true,
      range: {
        'min': 0,
        'max': 1500
      },
      step: 50
    });

    priceSlider.noUiSlider.on('update', (values, handle) => {
      const value = Math.round(values[handle]);
      if (handle === 0) {
        priceMin.textContent = `₹${value}`;
        state.priceRange[0] = value;
      } else {
        priceMax.textContent = `₹${value}`;
        state.priceRange[1] = value;
      }
    });

    priceSlider.noUiSlider.on('change', debounce(() => {
      fetchBooks();
    }, 300));
  }
}

// Fetch categories from backend
async function fetchCategories() {
  try {
    const response = await fetch('/api/categories');
    const data = await response.json();
    if (data.success) {
      state.categories = data.categories;
    } else {
      showToast('Failed to load categories', 'error');
    }
  } catch (error) {
    console.error('Fetch categories error:', error);
    showToast('Error loading categories', 'error');
  }
}

// Fetch books from backend
async function fetchBooks() {
  try {
    const queryParams = new URLSearchParams({
      ...(state.searchQuery && { search: state.searchQuery }),
      ...(state.selectedCategory && { category: state.selectedCategory }),
      ...(state.selectedSubcategory && { subcategory: state.selectedSubcategory }),
      ...(state.selectedCondition && { condition: state.selectedCondition }),
      ...(state.priceRange[0] !== 0 && { minPrice: state.priceRange[0] }),
      ...(state.priceRange[1] !== 1500 && { maxPrice: state.priceRange[1] }),
      ...(state.selectedDiscount && { discount: state.selectedDiscount }),
      ...(state.sortBy && { sortBy: state.sortBy })
    });

    const response = await fetch(`/api/books?${queryParams}`);
    const data = await response.json();
    if (data.success) {
      state.books = data.books;
      renderBooks(state.books);
    } else {
      showToast('Failed to load books', 'error');
    }
  } catch (error) {
    console.error('Fetch books error:', error);
    showToast('Error loading books', 'error');
  }
}

// Fetch user's wishlist
async function fetchWishlist() {
  if (!state.userId) {
    state.wishlistedBooks = new Set();
    return;
  }
  try {
    const response = await fetch('http://localhost:3000/api/wishlist', {
      method: 'GET',
      credentials: 'include'
    });
    const data = await response.json();
    if (data.success) {
      state.wishlistedBooks = new Set(data.books.map(book => book.id));
    } else {
      showToast('Failed to load wishlist', 'error');
    }
  } catch (error) {
    console.error('Fetch wishlist error:', error);
    showToast('Error loading wishlist', 'error');
  }
}

// Render categories dynamically
function renderCategories() {
  const categoriesList = document.querySelector('.categories-list');
  if (!categoriesList) return;

  // Clear existing categories
  categoriesList.innerHTML = '';

  // Render each category
  state.categories.forEach((category, index) => {
    const categoryItem = document.createElement('div');
    categoryItem.className = 'category-item';

    const categoryButton = document.createElement('button');
    categoryButton.className = 'category-button';
    categoryButton.textContent = category.name;
    if (state.selectedCategory === category.id) {
      categoryButton.classList.add('active');
    }

    const subcategoriesDropdown = document.createElement('div');
    subcategoriesDropdown.className = 'subcategories-dropdown';

    category.subcategories.forEach(subcategory => {
      const subcategoryItem = document.createElement('div');
      subcategoryItem.className = 'subcategory-item';
      subcategoryItem.textContent = subcategory.name;
      if (state.selectedSubcategory === subcategory.id) {
        subcategoryItem.classList.add('active');
      }
      subcategoriesDropdown.appendChild(subcategoryItem);
    });

    categoryItem.appendChild(categoryButton);
    categoryItem.appendChild(subcategoriesDropdown);
    categoriesList.appendChild(categoryItem);
  });

  // Re-attach event listeners for newly rendered categories
  initCategoryListeners();
}

// Initialize event listeners
function initEventListeners() {
  // Search forms
  const navSearchForm = document.getElementById('navSearchForm');
  const filterSearchForm = document.getElementById('filterSearchForm');

  if (navSearchForm) {
    navSearchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const query = document.getElementById('navSearchInput').value;
      state.searchQuery = query;
      fetchBooks();
    });
  }

  if (filterSearchForm) {
    filterSearchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const query = document.getElementById('filterSearchInput').value;
      state.searchQuery = query;
      fetchBooks();
    });
  }

  // Condition radio buttons
  const conditionRadios = document.querySelectorAll('input[name="condition"]');
  conditionRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      state.selectedCondition = radio.value;
      fetchBooks();
    });
  });

  // Discount radio buttons
  const discountRadios = document.querySelectorAll('input[name="discount"]');
  discountRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      state.selectedDiscount = parseInt(radio.value);
      fetchBooks();
    });
  });

  // Sort radio buttons
  const sortRadios = document.querySelectorAll('input[name="sort"]');
  sortRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      state.sortBy = radio.value;
      fetchBooks();
    });
  });

  // Clear filters button
  const clearFiltersBtn = document.getElementById('clearFilters');
  if (clearFiltersBtn) {
    clearFiltersBtn.addEventListener('click', resetFilters);
  }

  // Initialize category listeners
  initCategoryListeners();
}

// Initialize category and subcategory event listeners
function initCategoryListeners() {
  const categoryButtons = document.querySelectorAll('.category-button');
  const subcategoryItems = document.querySelectorAll('.subcategory-item');

  categoryButtons.forEach((button, index) => {
    button.addEventListener('click', () => {
      const wasActive = button.classList.contains('active');

      // Reset all buttons
      categoryButtons.forEach(btn => btn.classList.remove('active'));

      if (!wasActive) {
        button.classList.add('active');
        state.selectedCategory = state.categories[index].id;
      } else {
        state.selectedCategory = null;
      }

      state.selectedSubcategory = null;
      fetchBooks();
    });
  });

  subcategoryItems.forEach((item, index) => {
    item.addEventListener('click', (e) => {
      e.stopPropagation();

      // Calculate category and subcategory indices
      let totalSubcategories = 0;
      let categoryIndex = 0;
      for (let i = 0; i < state.categories.length; i++) {
        if (index < totalSubcategories + state.categories[i].subcategories.length) {
          categoryIndex = i;
          break;
        }
        totalSubcategories += state.categories[i].subcategories.length;
      }
      const subcategoryIndex = index - totalSubcategories;

      categoryButtons.forEach(btn => btn.classList.remove('active'));
      categoryButtons[categoryIndex].classList.add('active');

      state.selectedCategory = state.categories[categoryIndex].id;
      state.selectedSubcategory = state.categories[categoryIndex].subcategories[subcategoryIndex].id;

      fetchBooks();
    });
  });
}

// Reset all filters
function resetFilters() {
  // Reset state
  state.searchQuery = "";
  state.selectedCategory = null;
  state.selectedSubcategory = null;
  state.sortBy = "";
  state.selectedCondition = "";
  state.priceRange = [0, 1500];
  state.selectedDiscount = null;

  // Reset UI elements
  document.querySelectorAll('.category-button').forEach(btn => {
    btn.classList.remove('active');
  });

  document.querySelectorAll('input[name="condition"]').forEach(radio => {
    radio.checked = false;
  });

  document.querySelectorAll('input[name="discount"]').forEach(radio => {
    radio.checked = false;
  });

  document.querySelectorAll('input[name="sort"]').forEach(radio => {
    radio.checked = false;
  });

  document.getElementById('navSearchInput').value = "";
  document.getElementById('filterSearchInput').value = "";

  // Reset price slider
  if (document.getElementById('priceRangeSlider').noUiSlider) {
    document.getElementById('priceRangeSlider').noUiSlider.set([0, 1500]);
  }

  // Fetch books with reset filters
  fetchBooks();
}

// Render books to the grid
function renderBooks(books) {
  const booksGrid = document.getElementById('booksGrid');
  const resultsCount = document.getElementById('resultsCount');
  const noResults = document.getElementById('noResults');

  if (!booksGrid) return;

  // Update results count
  if (resultsCount) {
    resultsCount.textContent = `Showing ${books.length} ${books.length === 1 ? 'book' : 'books'}${state.searchQuery ? ` for "${state.searchQuery}"` : ''}`;
  }

  // Clear grid
  booksGrid.innerHTML = '';

  // Show/hide no results message
  if (books.length === 0) {
    if (noResults) noResults.style.display = 'block';
    return;
  } else {
    if (noResults) noResults.style.display = 'none';
  }

  // Get template
  const template = document.getElementById('bookCardTemplate');

  // Create book cards
  books.forEach(book => {
    const bookElement = document.importNode(template.content, true);

    // Set book data
    const bookCardContainer = bookElement.querySelector('.book-card-container');
    const bookCard = bookElement.querySelector('.book-card');
    const bookCover = bookElement.querySelector('.book-cover');
    const bookTitle = bookElement.querySelector('.book-title');
    const bookAuthor = bookElement.querySelector('.book-author');
    const bookPrice = bookElement.querySelector('.book-price');
    const bookOriginalPrice = bookElement.querySelector('.book-original-price');
    const discountBadge = bookElement.querySelector('.discount-badge');
    const conditionBadge = bookElement.querySelector('.condition-badge');
    const bookCategory = bookElement.querySelector('.book-category');
    const wishlistButton = bookElement.querySelector('.wishlist-button');
    const wishlistIcon = bookElement.querySelector('.wishlist-icon');
    const freeShippingContainer = bookElement.querySelector('.free-shipping-container');
    const discountTag = bookElement.querySelector('.discount-tag');
    const addToCartButton = bookElement.querySelector('.add-to-cart-button');

    // Set cover image
    bookCover.src = book.coverImage;
    bookCover.alt = book.title;

    // Set text content
    bookTitle.textContent = book.title;
    bookAuthor.textContent = book.author;
    bookPrice.textContent = `₹${book.price}`;
    bookCategory.textContent = book.category;

    // Original price and discount
    if (book.originalPrice && book.discountPercentage) {
      bookOriginalPrice.textContent = `₹${book.originalPrice}`;
      discountBadge.textContent = `${book.discountPercentage}% off`;
      discountTag.textContent = `${book.discountPercentage}% OFF`;
      discountTag.style.display = 'block';
    } else {
      bookOriginalPrice.style.display = 'none';
      discountBadge.style.display = 'none';
      discountTag.style.display = 'none';
    }

    // Condition badge
    if (book.condition) {
      conditionBadge.textContent = book.condition;
    } else {
      conditionBadge.style.display = 'none';
    }

    // Free shipping badge
    if (book.freeShipping) {
      freeShippingContainer.style.display = 'block';
    }

    // Wishlist state
    if (state.wishlistedBooks.has(book.id)) {
      wishlistButton.classList.add('active');
      wishlistIcon.classList.add('active');
    }

    // Add click event to navigate to book details page
    bookCardContainer.addEventListener('click', (e) => {
      // Prevent navigation if clicking on wishlist or cart buttons
      if (
        e.target.closest('.wishlist-button') ||
        e.target.closest('.add-to-cart-button')
      ) {
        return;
      }
      window.location.href = `/bookdetails.html?id=${book.id}`;
    });

    // Event listeners for wishlist and cart
    wishlistButton.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      await toggleWishlist(book, wishlistButton, wishlistIcon);
    });

    addToCartButton.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      await addToCart(book);
    });

    // Append to grid
    booksGrid.appendChild(bookElement);
  });
}

// Toggle wishlist status for a book
async function toggleWishlist(book, button, icon) {
  if (!state.userId) {
    showToast('Please log in to manage your wishlist', 'error');
    window.location.href = '/login';
    return;
  }

  const isWishlisted = state.wishlistedBooks.has(book.id);

  try {
    if (isWishlisted) {
      // Remove from wishlist
      const response = await fetch(`http://localhost:3000/api/wishlist/${book.id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) {
        state.wishlistedBooks.delete(book.id);
        button.classList.remove('active');
        icon.classList.remove('active');
        showToast(`${book.title} removed from your wishlist`, 'info');
      } else {
        showToast(data.message || 'Failed to remove from wishlist', 'error');
      }
    } else {
      // Add to wishlist
      const response = await fetch('http://localhost:3000/api/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ bookId: book.id })
      });
      const data = await response.json();
      if (data.success) {
        state.wishlistedBooks.add(book.id);
        button.classList.add('active');
        icon.classList.add('active');
        showToast(`${book.title} added to your wishlist`, 'success');
      } else {
        showToast(data.message || 'Failed to add to wishlist', 'error');
      }
    }
  } catch (error) {
    console.error('Toggle wishlist error:', error);
    showToast('Error managing wishlist', 'error');
  }
}

// Add book to cart
async function addToCart(book) {
  if (!state.userId) {
    showToast('Please log in to add to cart', 'error');
    window.location.href = '/login';
    return;
  }

  try {
    const response = await fetch('http://localhost:3000/api/cart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ bookId: book.id, quantity: 1 })
    });
    const data = await response.json();
    if (data.success) {
      showToast(`${book.title} added to your cart`, 'success');
    } else {
      showToast(data.message || 'Failed to add to cart', 'error');
    }
  } catch (error) {
    console.error('Add to cart error:', error);
    showToast('Error adding to cart', 'error');
  }
}

// Show toast notification
function showToast(message, type = 'success') {
  const toaster = document.getElementById('toaster');
  if (!toaster) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;

  toaster.appendChild(toast);

  // Auto remove after 3 seconds
  setTimeout(() => {
    toast.style.animation = 'toast-out 0.3s forwards';
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 3000);
}

// Utility function to debounce frequent events
function debounce(func, wait) {
  let timeout;
  return function () {
    const context = this;
    const args = arguments;
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      func.apply(context, args);
    }, wait);
  };
}