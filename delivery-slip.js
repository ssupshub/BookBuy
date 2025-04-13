// DOM elements
const deliveryPartnerSelect = document.getElementById('delivery-partner');
const deliveryNumberInput = document.getElementById('delivery-number');
const dropzone = document.getElementById('dropzone');
const slipUpload = document.getElementById('slip-upload');
const dropzonePlaceholder = document.getElementById('dropzone-placeholder');
const previewContainer = document.getElementById('preview-container');
const previewImage = document.getElementById('preview-image');
const removeImageBtn = document.getElementById('remove-image');
const submitButton = document.getElementById('submit-button');
const toast = document.getElementById('toast');
const toastClose = document.querySelector('.toast-close');
const orderNumberEl = document.querySelector('.order-number');
const bookImageEl = document.querySelector('.book-image');
const bookTitleEl = document.querySelector('#book-details h3');
const bookAuthorEl = document.querySelector('.book-author');
const isbnEl = document.querySelector('.book-details-table tr:nth-child(1) .detail-value');
const publisherEl = document.querySelector('.book-details-table tr:nth-child(2) .detail-value');
const conditionEl = document.querySelector('.book-details-table tr:nth-child(3) .detail-value');
const quantityEl = document.querySelector('.book-details-table tr:nth-child(4) .detail-value');
const priceEl = document.querySelector('.book-details-table tr:nth-child(5) .detail-value');
const buyerNameEl = document.querySelector('#buyer-details h3');
const addressEl = document.querySelector('.address');
const cityStateEl = document.querySelector('.city-state');
const contactEl = document.querySelector('.contact-value');

// State variables
let isSubmitting = false;
let selectedFile = null;
let partner = '';
let deliveryNumber = '';
let orderId = '';

// Initialize on page load
document.addEventListener('DOMContentLoaded', initialize);

async function initialize() {
  // Get orderId from URL
  const urlParams = new URLSearchParams(window.location.search);
  orderId = urlParams.get('orderId');

  if (!orderId) {
    showToast('Error', 'No order ID provided.');
    return;
  }

  // Fetch order details
  try {
    const response = await fetch(`http://localhost:3000/api/orders/${orderId}`, {
      credentials: 'include',
    });
    const data = await response.json();
    if (data.success) {
      populateOrderDetails(data.order);
    } else {
      showToast('Error', data.message || 'Failed to fetch order details.');
    }
  } catch (error) {
    console.error('Fetch order error:', error);
    showToast('Error', 'Failed to fetch order details.');
  }
}

function populateOrderDetails(order) {
  // Populate order number
  orderNumberEl.textContent = `Order #${order.id.slice(-6)}`;

  // Populate book details
  bookImageEl.src = order.bookId.imagePaths[0] || 'https://via.placeholder.com/150';
  bookTitleEl.textContent = order.bookId.title;
  bookAuthorEl.textContent = `by ${order.bookId.author}`;
  isbnEl.textContent = order.bookId.isbn || 'N/A'; // Add isbn to Book schema if needed
  publisherEl.textContent = order.bookId.publisher || 'Unknown';
  conditionEl.textContent = order.bookId.condition;
  quantityEl.textContent = order.quantity;
  priceEl.textContent = formatCurrency(order.totalPrice / order.quantity);

  // Populate buyer details
  buyerNameEl.textContent = order.buyerId.name;
  const addressParts = order.shippingAddress.split('\n');
  addressEl.textContent = addressParts[0] || '';
  cityStateEl.textContent = addressParts[1] || '';
  contactEl.textContent = order.buyerId.phone || '+91 98765 43210';
}

// Event listeners
deliveryPartnerSelect.addEventListener('change', function(e) {
  partner = e.target.value;
});

deliveryNumberInput.addEventListener('input', function(e) {
  deliveryNumber = e.target.value;
});

// File upload handling
slipUpload.addEventListener('change', handleFileSelect);

function handleFileSelect(e) {
  const file = e.target.files[0];
  if (file && file.type.startsWith('image/')) {
    selectedFile = file;
    displayPreview(file);
  }
}

// Drag and drop functionality
dropzone.addEventListener('dragover', function(e) {
  e.preventDefault();
  dropzone.classList.add('dragover');
});

dropzone.addEventListener('dragleave', function() {
  dropzone.classList.remove('dragover');
});

dropzone.addEventListener('drop', function(e) {
  e.preventDefault();
  dropzone.classList.remove('dragover');
  
  const file = e.dataTransfer.files[0];
  if (file && file.type.startsWith('image/')) {
    selectedFile = file;
    displayPreview(file);
  }
});

// Display image preview
function displayPreview(file) {
  const reader = new FileReader();
  reader.onload = function(e) {
    previewImage.src = e.target.result;
    dropzonePlaceholder.classList.add('hidden');
    previewContainer.classList.remove('hidden');
  };
  reader.readAsDataURL(file);
}

// Remove image
removeImageBtn.addEventListener('click', function() {
  selectedFile = null;
  previewImage.src = '';
  dropzonePlaceholder.classList.remove('hidden');
  previewContainer.classList.add('hidden');
  slipUpload.value = '';
});

// Form submission
submitButton.addEventListener('click', handleSubmit);

async function handleSubmit() {
  if (isSubmitting) return;
  
  if (!partner || !deliveryNumber || !selectedFile) {
    showToast('Error', 'Please fill all fields and upload a delivery slip.');
    return;
  }

  isSubmitting = true;
  submitButton.disabled = true;
  submitButton.innerHTML = 'Processing...';

  // Prepare form data
  const formData = new FormData();
  formData.append('deliveryPartner', partner);
  formData.append('trackingNumber', deliveryNumber);
  formData.append('slipImage', selectedFile);

  try {
    const response = await fetch(`http://localhost:3000/api/orders/${orderId}/delivery`, {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });
    const data = await response.json();
    if (data.success) {
      showToast('Success', 'Delivery slip submitted successfully!');
      setTimeout(() => {
        window.location.href = '/sellingorders.html'; // Redirect back to orders
      }, 2000);
    } else {
      showToast('Error', data.message || 'Failed to submit delivery slip.');
      isSubmitting = false;
      submitButton.disabled = false;
      submitButton.innerHTML = '<i class="fas fa-paper-plane"></i> Submit Delivery Details';
    }
  } catch (error) {
    console.error('Submit delivery slip error:', error);
    showToast('Error', 'Failed to submit delivery slip.');
    isSubmitting = false;
    submitButton.disabled = false;
    submitButton.innerHTML = '<i class="fas fa-paper-plane"></i> Submit Delivery Details';
  }
}

// Toast functionality
function showToast(title, message) {
  toast.querySelector('.toast-title').textContent = title;
  toast.querySelector('.toast-description').textContent = message;
  toast.classList.remove('hidden');
  
  // Auto hide after 5 seconds
  setTimeout(() => {
    hideToast();
  }, 5000);
}

function hideToast() {
  toast.classList.add('hidden');
}

toastClose.addEventListener('click', hideToast);

// Back to orders button
const backButton = document.querySelector('.back-button');
backButton.addEventListener('click', function() {
  window.location.href = '/sellingorders.html';
});

// Utility function
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
}