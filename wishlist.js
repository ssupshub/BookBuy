
// Initialize Lucide icons
document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();
    
    // Initial mock data for wishlist items
    const initialWishlistItems = [
      {
        id: '1',
        title: 'The Great Gatsby',
        author: 'F. Scott Fitzgerald',
        price: 12.99,
        coverImage: 'https://m.media-amazon.com/images/I/71FTb9X6wsL._AC_UF1000,1000_QL80_.jpg',
      },
      {
        id: '2',
        title: 'To Kill a Mockingbird',
        author: 'Harper Lee',
        price: 10.95,
        coverImage: 'https://m.media-amazon.com/images/I/81+xb4gWYlL._AC_UF1000,1000_QL80_.jpg',
      },
      {
        id: '3',
        title: '1984',
        author: 'George Orwell',
        price: 9.99,
        coverImage: 'https://m.media-amazon.com/images/I/71kxa1-0mfL._AC_UF1000,1000_QL80_.jpg',
      },
      {
        id: '4',
        title: 'The Catcher in the Rye',
        author: 'J.D. Salinger',
        price: 8.99,
        coverImage: 'https://m.media-amazon.com/images/I/91HPG31dTwL._AC_UF1000,1000_QL80_.jpg',
      },
    ];
  
    // Load wishlist items from localStorage or use initial items
    let wishlistItems = JSON.parse(localStorage.getItem('wishlistItems')) || initialWishlistItems;
    
    // Initialize UI
    renderWishlistItems();
    setupEventListeners();
  
    // Function to render wishlist items
    function renderWishlistItems() {
      const wishlistItemsContainer = document.querySelector('.wishlist-items');
      const emptyWishlistElement = document.querySelector('.empty-wishlist');
      const wishlistCountElement = document.querySelector('.wishlist-count');
      const addAllToCartBtn = document.getElementById('addAllToCartBtn');
      
      // Update wishlist count
      wishlistCountElement.textContent = `${wishlistItems.length} items`;
      
      // Toggle visibility based on items count
      if (wishlistItems.length > 0) {
        wishlistItemsContainer.classList.remove('hidden');
        emptyWishlistElement.classList.add('hidden');
        addAllToCartBtn.disabled = false;
      } else {
        wishlistItemsContainer.classList.add('hidden');
        emptyWishlistElement.classList.remove('hidden');
        addAllToCartBtn.disabled = true;
      }
      
      // Clear current items
      wishlistItemsContainer.innerHTML = '';
      
      // Render each item
      wishlistItems.forEach(item => {
        const itemElement = createWishlistItemElement(item);
        wishlistItemsContainer.appendChild(itemElement);
      });
      
      // Save to localStorage
      saveWishlistToLocalStorage();
    }
    
    // Create wishlist item element
    function createWishlistItemElement(item) {
      const itemElement = document.createElement('div');
      itemElement.className = 'wishlist-item';
      itemElement.dataset.id = item.id;
      
      itemElement.innerHTML = `
        <div class="book-cover">
          <img src="${item.coverImage}" alt="${item.title}" />
        </div>
        
        <div class="book-info">
          <div>
            <h3 class="book-title">${item.title}</h3>
            <p class="book-author">by ${item.author}</p>
          </div>
          <div class="book-price">$${item.price.toFixed(2)}</div>
        </div>
        
        <div class="item-actions">
          <button class="remove-btn rounded-md w-10 h-10" data-id="${item.id}">
            <i data-lucide="trash-2" class="h-5 w-5"></i>
          </button>
          <button class="add-to-cart-btn" data-id="${item.id}">
            <i data-lucide="shopping-cart" class="h-4 w-4 mr-2"></i>
            Add
          </button>
        </div>
      `;
      
      // Initialize icons after adding to DOM
      setTimeout(() => lucide.createIcons({ parent: itemElement }), 0);
      
      return itemElement;
    }
    
    // Setup all event listeners
    function setupEventListeners() {
      // Search form submission
      document.getElementById('searchForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const searchQuery = document.getElementById('searchQuery').value;
        showToast('Searching for: ' + searchQuery, 'Search results would appear here', 'success');
      });
      
      // Profile dropdown toggle
      const dropdownTrigger = document.querySelector('.dropdown-trigger');
      const dropdownContent = document.querySelector('.dropdown-content');
      
      dropdownTrigger.addEventListener('click', () => {
        dropdownContent.classList.toggle('hidden');
      });
      
      // Close dropdown when clicking outside
      document.addEventListener('click', (e) => {
        if (!dropdownTrigger.contains(e.target) && !dropdownContent.contains(e.target)) {
          dropdownContent.classList.add('hidden');
        }
      });
      
      // Remove item button
      document.querySelector('.wishlist-items').addEventListener('click', (e) => {
        const removeBtn = e.target.closest('.remove-btn');
        if (removeBtn) {
          const itemId = removeBtn.dataset.id;
          removeWishlistItem(itemId);
        }
      });
      
      // Add to cart button
      document.querySelector('.wishlist-items').addEventListener('click', (e) => {
        const addToCartBtn = e.target.closest('.add-to-cart-btn');
        if (addToCartBtn) {
          const itemId = addToCartBtn.dataset.id;
          const item = wishlistItems.find(item => item.id === itemId);
          addToCart(item);
        }
      });
      
      // Add all to cart button
      document.getElementById('addAllToCartBtn').addEventListener('click', addAllToCart);
      
      // Browse books button in empty state
      document.querySelector('.empty-wishlist button').addEventListener('click', () => {
        window.location.href = '/browse';
      });
    }
    
    // Remove wishlist item
    function removeWishlistItem(id) {
      const itemToRemove = wishlistItems.find(item => item.id === id);
      wishlistItems = wishlistItems.filter(item => item.id !== id);
      renderWishlistItems();
      showToast('Removed from wishlist', `${itemToRemove.title} has been removed from your wishlist.`, 'success');
    }
    
    // Add item to cart
    function addToCart(item) {
      // In a real app, this would add to a cart in localStorage or send to an API
      showToast('Added to cart', `${item.title} has been added to your cart.`, 'success');
    }
    
    // Add all items to cart
    function addAllToCart() {
      if (wishlistItems.length > 0) {
        showToast('Added all to cart', `${wishlistItems.length} items have been added to your cart.`, 'success');
      } else {
        showToast('Wishlist is empty', 'Add some books to your wishlist first.', 'error');
      }
    }
    
    // Save wishlist to localStorage
    function saveWishlistToLocalStorage() {
      localStorage.setItem('wishlistItems', JSON.stringify(wishlistItems));
    }
    
    // Show toast notification
    function showToast(title, description, type = 'success') {
      const toastContainer = document.getElementById('toast-container');
      const toast = document.createElement('div');
      toast.className = `toast toast-${type}`;
      
      toast.innerHTML = `
        <div class="toast-title">${title}</div>
        <div class="toast-description">${description}</div>
      `;
      
      toastContainer.appendChild(toast);
      
      // Remove toast after 3 seconds
      setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
      }, 3000);
      
      // Initialize opacity for transition
      setTimeout(() => toast.style.opacity = '1', 10);
    }
  });