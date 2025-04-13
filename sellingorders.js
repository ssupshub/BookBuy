document.addEventListener('DOMContentLoaded', () => {
  lucide.createIcons();
  initApp();
});

// App state
let orders = [];
let currentFilter = 'all';
let activeTab = 'all';

// DOM references
const mobileMenuButton = document.getElementById('mobile-menu-button');
const mobileNav = document.getElementById('mobile-nav');
const filterSelect = document.getElementById('filter-select');
const ordersContainer = document.getElementById('orders-container');
const emptyState = document.getElementById('empty-state');
const emptyTitle = document.getElementById('empty-title');
const emptyDescription = document.getElementById('empty-description');
const pendingCountEl = document.getElementById('pending-count');
const acceptedCountEl = document.getElementById('accepted-count');
const rejectedCountEl = document.getElementById('rejected-count');
const tabs = document.querySelectorAll('.tab');

function initApp() {
  mobileMenuButton.addEventListener('click', toggleMobileMenu);
  filterSelect.addEventListener('change', handleFilterChange);
  tabs.forEach(tab => {
    tab.addEventListener('click', () => setActiveTab(tab.dataset.tab));
  });
  fetchOrders();
  setInterval(updateCountdowns, 1000);
}

function toggleMobileMenu() {
  const isOpen = mobileNav.classList.contains('hidden');
  mobileNav.classList.toggle('hidden', !isOpen);
  mobileMenuButton.innerHTML = isOpen
    ? '<span class="lucide-icon"><i data-lucide="x"></i></span>'
    : '<span class="lucide-icon"><i data-lucide="menu"></i></span>';
  lucide.createIcons();
}

function handleFilterChange(e) {
  currentFilter = e.target.value;
  renderOrders();
}

function setActiveTab(tabName) {
  activeTab = tabName;
  tabs.forEach(tab => tab.classList.toggle('active', tab.dataset.tab === tabName));
  filterSelect.value = tabName;
  currentFilter = tabName;
  renderOrders();
}

async function fetchOrders() {
  try {
    const response = await fetch(`http://localhost:3000/api/seller-orders?status=${currentFilter}`, {
      credentials: 'include'
    });
    const data = await response.json();
    if (data.success) {
      orders = data.orders;
      updateOrderCounts();
      renderOrders();
    } else {
      showToast('Error', data.message || 'Failed to fetch orders.');
    }
  } catch (error) {
    console.error('Fetch orders error:', error);
    showToast('Error', 'Failed to fetch orders.');
  }
}

function updateOrderCounts() {
  const pendingOrders = orders.filter(order => order.status === 'pending');
  const acceptedOrders = orders.filter(order => order.status === 'accepted');
  const rejectedOrders = orders.filter(order => ['rejected', 'cancelled'].includes(order.status));
  pendingCountEl.textContent = pendingOrders.length;
  acceptedCountEl.textContent = acceptedOrders.length;
  rejectedCountEl.textContent = rejectedOrders.length;
}

function getFilteredOrders() {
  switch (currentFilter) {
    case 'pending': return orders.filter(order => order.status === 'pending');
    case 'accepted': return orders.filter(order => order.status === 'accepted');
    case 'rejected': return orders.filter(order => ['rejected', 'cancelled'].includes(order.status));
    default: return orders;
  }
}

function renderOrders() {
  const filteredOrders = getFilteredOrders();
  ordersContainer.innerHTML = '';
  if (filteredOrders.length === 0) {
    showEmptyState();
    return;
  }
  emptyState.classList.add('hidden');
  filteredOrders.forEach(order => {
    const orderElement = createOrderElement(order);
    ordersContainer.appendChild(orderElement);
  });
  lucide.createIcons();
}

function showEmptyState() {
  emptyState.classList.remove('hidden');
  switch (currentFilter) {
    case 'pending':
      emptyTitle.textContent = 'No Pending Orders';
      emptyDescription.textContent = 'You don\'t have any pending orders at the moment.';
      break;
    case 'accepted':
      emptyTitle.textContent = 'No Accepted Orders';
      emptyDescription.textContent = 'You haven\'t accepted any orders yet.';
      break;
    case 'rejected':
      emptyTitle.textContent = 'No Rejected Orders';
      emptyDescription.textContent = 'You don\'t have any rejected orders.';
      break;
    default:
      emptyTitle.textContent = 'No Orders Found';
      emptyDescription.textContent = 'You don\'t have any orders at the moment.';
  }
}

function createOrderElement(order) {
  const template = document.getElementById('order-card-template');
  const orderEl = template.content.cloneNode(true).firstElementChild;

  orderEl.querySelector('.order-id').textContent = `Order #${order.id.slice(-6)}`;
  const statusEl = orderEl.querySelector('.order-status');
  statusEl.textContent = getStatusText(order.status);
  statusEl.className = `order-status badge status-badge-${order.status}`;
  orderEl.querySelector('.order-date').textContent = `Ordered on ${new Date(order.orderDate).toLocaleDateString()}`;
  orderEl.querySelector('.book-title').textContent = order.bookTitle;
  const thumbnailEl = orderEl.querySelector('.book-thumbnail');
  thumbnailEl.innerHTML = `<img src="${order.bookCover}" alt="${order.bookTitle}" class="book-cover">`;
  orderEl.querySelector('.buyer-name').textContent = order.buyerName;
  orderEl.querySelector('.buyer-address').textContent = order.buyerAddress;
  orderEl.querySelector('.order-quantity').textContent = order.quantity;
  orderEl.querySelector('.order-price').textContent = formatCurrency(order.price);

  const pendingActions = orderEl.querySelector('.pending-actions');
  const acceptedAction = orderEl.querySelector('.accepted-action');
  if (order.status === 'pending') {
    pendingActions.classList.remove('hidden');
    const countdownContainer = orderEl.querySelector('.countdown-container');
    const countdownTimer = orderEl.querySelector('.countdown-timer');
    countdownContainer.classList.remove('hidden');
    const acceptButton = orderEl.querySelector('.btn-accept');
    const rejectButton = orderEl.querySelector('.btn-reject');
    acceptButton.setAttribute('data-order-id', order.id);
    rejectButton.setAttribute('data-order-id', order.id);
    acceptButton.addEventListener('click', handleAcceptOrder);
    rejectButton.addEventListener('click', handleRejectOrder);
    const timeLeft = calculateTimeLeft(order);
    updateCountdownDisplay(countdownTimer, timeLeft);
    countdownTimer.setAttribute('data-expires-at', order.expiresAt);
    countdownTimer.setAttribute('data-order-id', order.id);
  } else if (order.status === 'accepted') {
    acceptedAction.classList.remove('hidden');
    const viewButton = orderEl.querySelector('.btn-view');
    viewButton.setAttribute('data-order-id', order.id);
    viewButton.addEventListener('click', handleViewOrder);
  }

  return orderEl;
}

function getStatusText(status) {
  switch (status) {
    case 'accepted': return 'Accepted';
    case 'rejected': return 'Rejected';
    case 'cancelled': return 'Cancelled';
    default: return 'Pending';
  }
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

function calculateTimeLeft(order) {
  const now = new Date();
  const expiryDate = new Date(order.expiresAt);
  const difference = expiryDate.getTime() - now.getTime();
  if (difference <= 0) {
    return { hours: 0, minutes: 0, seconds: 0, total: 0 };
  }
  return {
    hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((difference % (1000 * 60)) / 1000),
    total: difference
  };
}

function updateCountdowns() {
  const countdownElements = document.querySelectorAll('.countdown-timer[data-expires-at]');
  countdownElements.forEach(async el => {
    const expiresAt = el.getAttribute('data-expires-at');
    const orderId = el.getAttribute('data-order-id');
    const order = orders.find(o => o.id === orderId);
    if (!order || order.status !== 'pending') return;
    const timeLeft = calculateTimeLeft({ expiresAt });
    updateCountdownDisplay(el, timeLeft);
    if (timeLeft.total <= 0) {
      try {
        await fetch(`http://localhost:3000/api/orders/${orderId}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ status: 'rejected' })
        });
        fetchOrders();
      } catch (error) {
        console.error('Auto-expire error:', error);
      }
    }
  });
}

function updateCountdownDisplay(element, timeLeft) {
  if (timeLeft.total <= 0) {
    element.textContent = 'Expired';
    element.classList.remove('urgent');
    return;
  }
  element.textContent = `${timeLeft.hours.toString().padStart(2, '0')}:${timeLeft.minutes.toString().padStart(2, '0')}:${timeLeft.seconds.toString().padStart(2, '0')}`;
  element.classList.toggle('urgent', timeLeft.total <= 12 * 60 * 60 * 1000);
}

async function handleAcceptOrder(event) {
  const orderId = event.currentTarget.getAttribute('data-order-id');
  try {
    const response = await fetch(`http://localhost:3000/api/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ status: 'accepted' })
    });
    const data = await response.json();
    if (data.success) {
      showToast('Order accepted', `Order #${orderId.slice(-6)} has been accepted.`);
      fetchOrders();
    } else {
      showToast('Error', data.message || 'Failed to accept order.');
    }
  } catch (error) {
    console.error('Accept order error:', error);
    showToast('Error', 'Failed to accept order.');
  }
}

async function handleRejectOrder(event) {
  const orderId = event.currentTarget.getAttribute('data-order-id');
  try {
    const response = await fetch(`http://localhost:3000/api/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ status: 'rejected' })
    });
    const data = await response.json();
    if (data.success) {
      showToast('Order rejected', `Order #${orderId.slice(-6)} has been rejected.`);
      fetchOrders();
    } else {
      showToast('Error', data.message || 'Failed to reject order.');
    }
  } catch (error) {
    console.error('Reject order error:', error);
    showToast('Error', 'Failed to reject order.');
  }
}

function handleViewOrder(event) {
  const orderId = event.currentTarget.getAttribute('data-order-id');
  // Navigate to delivery-slip.html with orderId as query parameter
  window.location.href = `/delivery-slip.html?orderId=${orderId}`;
}

function showToast(title, message) {
  const toast = document.createElement('div');
  toast.className = `toast toast-info`;
  toast.textContent = message;
  Object.assign(toast.style, {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    padding: '12px 20px',
    borderRadius: '4px',
    color: 'white',
    fontSize: '14px',
    zIndex: '1000',
    opacity: '0',
    transition: 'opacity 0.3s ease',
    boxShadow: '0 3px 6px rgba(0,0,0,0.16)',
    backgroundColor: '#3B82F6'
  });
  document.body.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '1'; }, 10);
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => { document.body.removeChild(toast); }, 300);
  }, 3000);
}