// Main JavaScript for BookSell
document.addEventListener('DOMContentLoaded', function() {
  // Initialize Lucide icons
  lucide.createIcons();
  
  // Mobile menu functionality
  initMobileMenu();
  
  // Dropdown functionality
  initDropdowns();
  
  // Toast system
  window.showToast = showToast;
  
  // Session check
  checkUserSession();
});

function initMobileMenu() {
  const mobileToggle = document.querySelector('.mobile-menu-toggle');
  const mobileMenu = document.querySelector('.mobile-menu');
  
  if (mobileToggle && mobileMenu) {
    mobileToggle.addEventListener('click', () => {
      mobileMenu.classList.toggle('active');
      const icon = mobileToggle.querySelector('i');
      if (mobileMenu.classList.contains('active')) {
        icon.setAttribute('data-lucide', 'x');
      } else {
        icon.setAttribute('data-lucide', 'menu');
      }
      lucide.createIcons();
    });
  }
}

function initDropdowns() {
  const dropdowns = document.querySelectorAll('.dropdown');
  
  dropdowns.forEach(dropdown => {
    const trigger = dropdown.querySelector('.dropdown-trigger');
    const menu = dropdown.querySelector('.dropdown-menu');
    
    if (trigger && menu) {
      trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        
        // Close other dropdowns
        dropdowns.forEach(otherDropdown => {
          if (otherDropdown !== dropdown) {
            otherDropdown.querySelector('.dropdown-menu')?.classList.remove('show');
          }
        });
        
        menu.classList.toggle('show');
      });
    }
  });
  
  // Close dropdowns when clicking outside
  document.addEventListener('click', () => {
    dropdowns.forEach(dropdown => {
      dropdown.querySelector('.dropdown-menu')?.classList.remove('show');
    });
  });
}

async function checkUserSession() {
  try {
    const response = await fetch('http://localhost:3000/api/session', {
      credentials: 'include'
    });
    const data = await response.json();
    
    if (data.success) {
      updateUIForLoggedInUser(data.userId);
    } else {
      updateUIForGuestUser();
    }
  } catch (error) {
    console.error('Session check error:', error);
    updateUIForGuestUser();
  }
}

function updateUIForLoggedInUser(userId) {
  // Update dropdown menu for logged in user
  const dropdownMenu = document.querySelector('.dropdown-menu');
  if (dropdownMenu) {
    dropdownMenu.innerHTML = `
      <a href="profile.html" class="dropdown-item">
        <i data-lucide="user"></i>
        Profile
      </a>
      <a href="mylibrary.html" class="dropdown-item">
        <i data-lucide="book"></i>
        My Library
      </a>
      <a href="myorders.html" class="dropdown-item">
        <i data-lucide="package"></i>
        My Orders
      </a>
      <a href="sellingorders.html" class="dropdown-item">
        <i data-lucide="truck"></i>
        Selling Orders
      </a>
      <div style="height: 1px; background-color: var(--border-light); margin: 0.5rem 0;"></div>
      <button onclick="logout()" class="dropdown-item" style="width: 100%; text-align: left;">
        <i data-lucide="log-out"></i>
        Logout
      </button>
    `;
    lucide.createIcons();
  }
}

function updateUIForGuestUser() {
  // Keep default dropdown menu for guest users
}

async function logout() {
  try {
    const response = await fetch('http://localhost:3000/login-signup/logout', {
      method: 'POST',
      credentials: 'include'
    });
    const data = await response.json();
    
    if (data.success) {
      showToast('Logged out successfully', 'You have been logged out.', 'success');
      setTimeout(() => {
        window.location.href = '/';
      }, 1000);
    } else {
      showToast('Logout failed', 'Please try again.', 'error');
    }
  } catch (error) {
    console.error('Logout error:', error);
    showToast('Error', 'Failed to logout. Please try again.', 'error');
  }
}

function showToast(title, message, type = 'info') {
  const container = document.getElementById('toast-container') || createToastContainer();
  
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  toast.innerHTML = `
    <div class="toast-title">${title}</div>
    <div class="toast-message">${message}</div>
  `;
  
  container.appendChild(toast);
  
  // Auto remove after 4 seconds
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }, 4000);
}

function createToastContainer() {
  const container = document.createElement('div');
  container.id = 'toast-container';
  container.className = 'toast-container';
  document.body.appendChild(container);
  return container;
}

// Utility functions
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

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR'
  }).format(amount);
}

function formatDate(date) {
  return new Intl.DateTimeFormat('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(new Date(date));
}

// Export functions for use in other scripts
window.BookSell = {
  showToast,
  formatCurrency,
  formatDate,
  debounce,
  checkUserSession
};