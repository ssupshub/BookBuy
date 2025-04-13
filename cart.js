// Initialize Lucide icons
document.addEventListener('DOMContentLoaded', async () => {
    lucide.createIcons();
  
    let wishlistItems = [];
  
    // Initialize UI
    await fetchWishlistItems();
    setupEventListeners();
  
    // Function to fetch wishlist items from backend
    async function fetchWishlistItems() {
      try {
        const response = await fetch('http://localhost:3000/api/wishlist', {
          method: 'GET',
          credentials: 'include'
        });
        const data = await response.json();
        if (data.success) {
          wishlistItems = data.books;
          renderWishlistItems();
        } else {
          showToast('Error', data.message || 'Failed to load wishlist.');
        }
      } catch (error) {
        console.error('Fetch wishlist error:', error);
        showToast('Error', 'Failed to load wishlist.');
      }
    }
  
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
      document.querySelector('.wishlist-items').addEventListener('click', async (e) => {
        const removeBtn = e.target.closest('.remove-btn');
        if (removeBtn) {
          const itemId = removeBtn.dataset.id;
          await removeWishlistItem(itemId);
        }
      });
  
      // Add to cart button
      document.querySelector('.wishlist-items').addEventListener('click', async (e) => {
        const addToCartBtn = e.target.closest('.add-to-cart-btn');
        if (addToCartBtn) {
          const itemId = addToCartBtn.dataset.id;
          const item = wishlistItems.find(item => item.id === itemId);
          await addToCart(item);
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
    async function removeWishlistItem(id) {
      try {
        const itemToRemove = wishlistItems.find(item => item.id === id);
        const response = await fetch(`http://localhost:3000/api/wishlist/${id}`, {
          method: 'DELETE',
          credentials: 'include'
        });
        const data = await response.json();
        if (data.success) {
          wishlistItems = wishlistItems.filter(item => item.id !== id);
          renderWishlistItems();
          showToast('Removed from wishlist', `${itemToRemove.title} has been removed from your wishlist.`, 'success');
        } else {
          showToast('Error', data.message || 'Failed to remove from wishlist.', 'error');
        }
      } catch (error) {
        console.error('Remove wishlist item error:', error);
        showToast('Error', 'Failed to remove from wishlist.', 'error');
      }
    }
  
    // Add item to cart
    async function addToCart(item) {
      try {
        const response = await fetch('http://localhost:3000/api/cart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ bookId: item.id, quantity: 1 })
        });
        const data = await response.json();
        if (data.success) {
          showToast('Added to cart', `${item.title} has been added to your cart.`, 'success');
        } else {
          showToast('Error', data.message || 'Failed to add to cart.', 'error');
        }
      } catch (error) {
        console.error('Add to cart error:', error);
        showToast('Error', 'Failed to add to cart.', 'error');
      }
    }
  
    // Add all items to cart
    async function addAllToCart() {
      if (wishlistItems.length > 0) {
        try {
          for (const item of wishlistItems) {
            await addToCart(item);
          }
          showToast('Added all to cart', `${wishlistItems.length} items have been added to your cart.`, 'success');
        } catch (error) {
          showToast('Error', 'Failed to add some items to cart.', 'error');
        }
      } else {
        showToast('Wishlist is empty', 'Add some books to your wishlist first.', 'error');
      }
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