// DOM Elements
const booksContainer = document.getElementById('books-container');
const noBooksMessage = document.getElementById('no-books-message');
const bookSearchInput = document.getElementById('book-search');
const tabButtons = document.querySelectorAll('.tab-button');
const clearFiltersButton = document.getElementById('clear-filters');
const totalBooksElement = document.getElementById('total-books');
const totalViewsElement = document.getElementById('total-views');
const totalAdvertisedElement = document.getElementById('total-advertised');
const notificationTrigger = document.getElementById('notification-trigger');
const notificationDropdown = document.getElementById('notification-dropdown');
const userTrigger = document.getElementById('user-trigger');
const userDropdown = document.getElementById('user-dropdown');
const bookCardTemplate = document.getElementById('book-card-template');

// State
let activeTab = 'all';
let searchQuery = '';
let books = []; // Store fetched books

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  checkSession(); // Verify user is logged in
  setupEventListeners();
});

// Check session and redirect if not logged in
async function checkSession() {
  try {
    const response = await fetch('/api/session');
    const data = await response.json();
    if (!data.success) {
      window.location.href = '/login.html'; // Redirect to login page
    } else {
      fetchBooks(); // Fetch books if logged in
      fetchStats(); // Fetch seller stats
    }
  } catch (error) {
    console.error('Session check error:', error);
    showToast('error', 'Failed to verify session');
  }
}

// Fetch books from backend
async function fetchBooks() {
  try {
    const response = await fetch(`/api/user-books?search=${encodeURIComponent(searchQuery)}`);
    const data = await response.json();
    if (data.success) {
      books = data.books;
      renderBooks();
    } else {
      showToast('error', data.message || 'Failed to fetch books');
    }
  } catch (error) {
    console.error('Fetch books error:', error);
    showToast('error', 'Failed to fetch books');
  }
}

// Fetch seller statistics
async function fetchStats() {
  try {
    const response = await fetch('/api/seller-stats');
    const data = await response.json();
    if (data.success) {
      totalBooksElement.textContent = data.totalBooksUploaded;
      totalAdvertisedElement.textContent = data.advertisedBooks;
      totalViewsElement.textContent = 'N/A'; // Backend doesn't provide views; add if implemented
    } else {
      showToast('error', data.message || 'Failed to fetch stats');
    }
  } catch (error) {
    console.error('Fetch stats error:', error);
    showToast('error', 'Failed to fetch stats');
  }
}

// Event Listeners
function setupEventListeners() {
  // Tab buttons
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      tabButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      activeTab = button.dataset.tab;
      renderBooks();
    });
  });

  // Search input
  bookSearchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value.toLowerCase();
    fetchBooks();
  });

  // Clear filters
  clearFiltersButton.addEventListener('click', () => {
    searchQuery = '';
    activeTab = 'all';
    bookSearchInput.value = '';
    tabButtons.forEach(btn => {
      btn.classList.remove('active');
      if (btn.dataset.tab === 'all') {
        btn.classList.add('active');
      }
    });
    fetchBooks();
  });

  // Dropdown toggles
  notificationTrigger.addEventListener('click', (e) => {
    e.stopPropagation();
    notificationDropdown.classList.toggle('show');
    userDropdown.classList.remove('show');
  });

  userTrigger.addEventListener('click', (e) => {
    e.stopPropagation();
    userDropdown.classList.toggle('show');
    notificationDropdown.classList.remove('show');
  });

  // Close dropdowns when clicking elsewhere
  document.addEventListener('click', () => {
    notificationDropdown.classList.remove('show');
    userDropdown.classList.remove('show');
  });

  // Prevent dropdown close when clicking inside dropdown
  document.querySelectorAll('.dropdown-content').forEach(dropdown => {
    dropdown.addEventListener('click', (e) => {
      e.stopPropagation();
    });
  });

  // Add New Book button
  document.querySelector('.btn-primary').addEventListener('click', () => {
    window.location.href = '/post-book.html'; // Redirect to book posting page
  });

  // Logout
  document.querySelector('.logout-item').addEventListener('click', async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/login-signup/logout', { method: 'POST' });
      const data = await response.json();
      if (data.success) {
        window.location.href = '/login.html';
      } else {
        showToast('error', data.message || 'Logout failed');
      }
    } catch (error) {
      console.error('Logout error:', error);
      showToast('error', 'Failed to logout');
    }
  });
}

// Render books
function renderBooks() {
  // Filter books
  const filteredBooks = books.filter(book => {
    const matchesSearch = book.title.toLowerCase().includes(searchQuery) || 
                         book.author.toLowerCase().includes(searchQuery);
    
    if (activeTab === 'all') return matchesSearch;
    if (activeTab === 'advertised') return matchesSearch && book.isAdvertised;
    
    return matchesSearch;
  });
  
  // Clear container
  booksContainer.innerHTML = '';

  // Show books or no books message
  if (filteredBooks.length > 0) {
    filteredBooks.forEach(book => {
      const bookCard = createBookCard(book);
      booksContainer.appendChild(bookCard);
    });
    booksContainer.style.display = 'grid';
    noBooksMessage.style.display = 'none';
  } else {
    booksContainer.style.display = 'none';
    noBooksMessage.style.display = 'block';
  }
}

// Create book card
function createBookCard(book) {
  const template = bookCardTemplate.content.cloneNode(true);
  const card = template.querySelector('.book-card');
  
  // Set book data
  card.dataset.bookId = book._id;
  card.querySelector('.book-cover').src = book.images[0] || 'https://via.placeholder.com/150';
  card.querySelector('.book-cover').alt = book.title;
  card.querySelector('.book-title').textContent = book.title;
  card.querySelector('.book-author').textContent = `by ${book.author}`;
  card.querySelector('.book-price').textContent = `$${book.price.toFixed(2)}`;
  card.querySelector('.book-earnings span').textContent = `$${book.earnings.toFixed(2)}`;
card.querySelector('.book-views span').textContent = `${book.views} views`;
  
  // Show/hide advertise button and badge
  const advertiseButton = card.querySelector('.advertise-button');
  const advertisedBadge = card.querySelector('.advertised-badge');
  
  if (book.isAdvertised) {
    advertiseButton.style.display = 'none';
    advertisedBadge.style.display = 'block';
  } else {
    advertiseButton.style.display = 'block';
    advertisedBadge.style.display = 'none';
  }
  
  // Event listeners for buttons
  const advertiseBtn = card.querySelector('.advertise-button button');
  const editBtn = card.querySelector('.btn-brown');
  const deleteBtn = card.querySelector('.btn-red');
  const shareBtn = card.querySelector('.btn-gray');
  
  advertiseBtn?.addEventListener('click', () => {
    handleAdvertise(book);
  });
  
  editBtn.addEventListener('click', () => {
    handleEdit(book);
  });
  
  deleteBtn.addEventListener('click', () => {
    handleDelete(book);
  });
  
  shareBtn.addEventListener('click', () => {
    handleShare(book);
  });
  
  return card;
}

// Handle book actions
async function handleAdvertise(book) {
  try {
    const response = await fetch(`/api/books/${book._id}/advertise`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isAdvertised: true })
    });
    const data = await response.json();
    if (data.success) {
      book.isAdvertised = true;
      showToast('success', `${book.title} is now being advertised!`);
      renderBooks();
      fetchStats();
    } else {
      showToast('error', data.message || 'Failed to advertise book');
    }
  } catch (error) {
    console.error('Advertise error:', error);
    showToast('error', 'Failed to advertise book');
  }
}

function handleEdit(book) {
  showToast('info', `Editing ${book.title}...`);
  window.location.href = `/edit-book.html?id=${book._id}`; // Redirect to edit page
}

async function handleDelete(book) {
  showToast('warning', `Are you sure you want to delete ${book.title}?`, [
    {
      label: 'Confirm',
      action: async () => {
        try {
          const response = await fetch(`/api/book/${book._id}`, {
            method: 'DELETE'
          });
          const data = await response.json();
          if (data.success) {
            showToast('success', `${book.title} deleted`);
            fetchBooks();
            fetchStats();
          } else {
            showToast('error', data.message || 'Failed to delete book');
          }
        } catch (error) {
          console.error('Delete error:', error);
          showToast('error', 'Failed to delete book');
        }
      }
    }
  ]);
}

async function handleShare(book) {
  const bookUrl = `https://bookmarket.com/book/${book._id}`;
  try {
    await navigator.clipboard.writeText(bookUrl);
    showToast('success', `Link copied to clipboard!`);
  } catch (error) {
    console.error('Share error:', error);
    showToast('error', 'Failed to copy link');
  }
}

async function fetchUserName() {
  try {
    const response = await fetch('/api/user'); // Assumes a new endpoint
    const data = await response.json();
    if (data.success) {
      document.getElementById('user-name').textContent = data.name;
    } else {
      document.getElementById('user-name').textContent = 'User';
    }
  } catch (error) {
    console.error('Fetch user name error:', error);
    document.getElementById('user-name').textContent = 'User';
  }
}

// Call in checkSession
async function checkSession() {
  try {
    const response = await fetch('/api/session');
    const data = await response.json();
    if (!data.success) {
      window.location.href = '/login.html';
    } else {
      fetchUserName();
      fetchBooks();
      fetchStats();
    }
  } catch (error) {
    console.error('Session check error:', error);
    showToast('error', 'Failed to verify session');
  }
}

// Get User Info
app.get('/api/user', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('name');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, name: user.name });
  } catch (error) {
    console.error('Fetch user error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Toast system (unchanged)
function showToast(type, message, actions = []) {
  const toastContainer = document.getElementById('toast-container');
  
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  let iconHtml = '';
  switch(type) {
    case 'success':
      iconHtml = '<i class="fas fa-check-circle"></i>';
      break;
    case 'warning':
      iconHtml = '<i class="fas fa-exclamation-triangle"></i>';
      break;
    case 'error':
      iconHtml = '<i class="fas fa-times-circle"></i>';
      break;
    case 'info':
      iconHtml = '<i class="fas fa-info-circle"></i>';
      break;
  }
  
  toast.innerHTML = `
    <div class="toast-content">
      <div class="toast-icon">${iconHtml}</div>
      <div class="toast-message">${message}</div>
    </div>
    ${actions.length > 0 ? '<div class="toast-actions"></div>' : ''}
  `;
  
  if (actions.length > 0) {
    const actionsContainer = toast.querySelector('.toast-actions');
    actions.forEach(action => {
      const button = document.createElement('button');
      button.className = 'toast-action';
      button.textContent = action.label;
      button.addEventListener('click', () => {
        action.action();
        toast.remove();
      });
      actionsContainer.appendChild(button);
    });
  }
  
  toastContainer.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'slide-out 0.3s ease-in forwards';
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 5000);
  
  return toast;
}

// Slide-out animation
document.head.insertAdjacentHTML('beforeend', `
  <style>
    @keyframes slide-out {
      to {
        transform: translateX(100%);
        opacity: 0;
      }
    }
  </style>
`);