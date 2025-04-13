document.addEventListener('DOMContentLoaded', function() {
  // DOM references
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabContents = document.querySelectorAll('.tab-content');
  const searchInput = document.querySelector('.search-input');
  const statsCards = document.querySelectorAll('.stats-card');
  const activeTabContent = document.getElementById('active-tab');
  const pastTabContent = document.getElementById('past-tab');
  const allTabContent = document.getElementById('all-tab');

  // State
  let orders = [];
  let activeFilter = 'active';

  // Initialize
  fetchOrders();
  setupTabListeners();
  setupSearch();
  setupAnimations();
  setupResizeHandler();

  function setupTabListeners() {
    tabButtons.forEach(button => {
      button.addEventListener('click', function() {
        tabButtons.forEach(btn => btn.classList.remove('active'));
        this.classList.add('active');
        tabContents.forEach(content => content.classList.add('hidden'));
        const tabId = this.getAttribute('data-tab');
        document.getElementById(`${tabId}-tab`).classList.remove('hidden');
        activeFilter = tabId;
        fetchOrders();
      });
    });
  }

  function setupSearch() {
    searchInput.addEventListener('input', function() {
      const searchTerm = this.value.toLowerCase();
      renderOrders(orders.filter(order =>
        order.orderNumber.toLowerCase().includes(searchTerm) ||
        order.items.some(item => item.title.toLowerCase().includes(searchTerm))
      ));
    });
  }

  function setupAnimations() {
    statsCards.forEach((card, index) => {
      card.style.animationDelay = `${index * 0.1}s`;
    });
  }

  function setupResizeHandler() {
    window.addEventListener('resize', () => {
      renderOrders(orders); // Re-render to adjust to new viewport
    });
  }

  async function fetchOrders() {
    try {
      const response = await fetch(`http://localhost:3000/api/buyer-orders?status=${activeFilter}`, {
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) {
        orders = data.orders;
        updateStats();
        renderOrders(orders);
      } else {
        console.error('Fetch orders error:', data.message);
      }
    } catch (error) {
      console.error('Fetch orders error:', error);
    }
  }

  function updateStats() {
    const activeOrders = orders.filter(o => ['pending', 'accepted', 'shipped'].includes(o.status)).length;
    const processingOrders = orders.filter(o => o.status === 'accepted').length;
    const deliveredOrders = orders.filter(o => o.status === 'delivered').length;
    const totalBooks = orders.reduce((sum, o) => sum + o.items.length, 0);
    statsCards[0].querySelector('.stats-value').textContent = activeOrders;
    statsCards[1].querySelector('.stats-value').textContent = processingOrders;
    statsCards[2].querySelector('.stats-value').textContent = deliveredOrders;
    statsCards[3].querySelector('.stats-value').textContent = totalBooks;
  }

  function renderOrders(filteredOrders) {
    const targetContent = activeFilter === 'active' ? activeTabContent : activeFilter === 'past' ? pastTabContent : allTabContent;
    targetContent.innerHTML = '';

    if (filteredOrders.length === 0) {
      targetContent.innerHTML = '<p class="text-center py-4">No orders found.</p>';
      return;
    }

    filteredOrders.forEach(order => {
      const orderCard = createOrderCard(order);
      targetContent.appendChild(orderCard);
    });

    // Re-attach event listeners
    setupOrderInteractions();
  }

  function createOrderCard(order) {
    const div = document.createElement('div');
    div.className = 'order-card';
    div.style.animationDelay = `${orders.indexOf(order) * 0.1}s`;
    const statusClass = {
      pending: 'processing',
      accepted: 'processing',
      shipped: 'shipped',
      delivered: 'delivered',
      rejected: 'cancelled',
      cancelled: 'cancelled'
    }[order.status] || 'processing';

    div.innerHTML = `
      <div class="order-card-header">
        <div>
          <h3>Order #${order.orderNumber}</h3>
          <div class="order-date">
            <span>📅</span>
            <span>${new Date(order.orderDate).toLocaleDateString()}</span>
          </div>
        </div>
        <div class="order-status">
          <span class="status-badge ${statusClass}">${getStatusText(order.status)}</span>
          <button class="ghost-button">View Details</button>
        </div>
      </div>
      <div class="order-card-content">
        <div class="order-items">
          ${order.items.map(item => `
            <div class="order-item">
              <div class="book-thumbnail" style="background-image: url(${item.thumbnail})"></div>
              <div>
                <h4>${item.title}</h4>
                <p>${item.author}</p>
                <p class="book-price">$${item.price.toFixed(2)}</p>
              </div>
            </div>
          `).join('')}
        </div>
        ${order.status === 'shipped' || order.status === 'delivered' ? `
          <div class="shipping-info">
            <h4>Shipping Information</h4>
            <div class="shipping-details">
              <div>
                <span>Tracking Number:</span>
                <span>${order.trackingNumber || 'N/A'}</span>
              </div>
              <div>
                <span>Estimated Delivery:</span>
                <span>${order.estimatedDelivery ? new Date(order.estimatedDelivery).toLocaleDateString() : 'N/A'}</span>
              </div>
            </div>
            <button class="outline-button">Track Package</button>
          </div>
        ` : ''}
      </div>
      <div class="order-card-footer">
        <div>
          <span>Total:</span>
          <span class="order-total">$${order.total.toFixed(2)}</span>
        </div>
        <div>
          ${order.status === 'delivered' ? '<button class="outline-button">Write Review</button>' : ''}
          <button class="outline-button">Help</button>
        </div>
      </div>
    `;
    return div;
  }

  function getStatusText(status) {
    return {
      pending: 'Pending',
      accepted: 'Processing',
      shipped: 'Shipped',
      delivered: 'Delivered',
      rejected: 'Cancelled',
      cancelled: 'Cancelled'
    }[status] || 'Unknown';
  }

  function setupOrderInteractions() {
    document.querySelectorAll('.ghost-button').forEach(button => {
      button.addEventListener('click', () => console.log('View details clicked'));
    });
    document.querySelectorAll('.outline-button').forEach(button => {
      if (button.textContent === 'Track Package') {
        button.addEventListener('click', () => console.log('Track package clicked'));
      } else if (button.textContent === 'Help') {
        button.addEventListener('click', () => console.log('Help clicked'));
      } else if (button.textContent === 'Write Review') {
        button.addEventListener('click', () => console.log('Write review clicked'));
      }
    });
  }
});