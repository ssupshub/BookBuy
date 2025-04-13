// Global state
let currentStep = 1;
const shippingCost = 0; // Will be set dynamically from book data
let formData = {
  firstName: "",
  lastName: "",
  address: "",
  apartment: "",
  city: "",
  state: "",
  zipCode: "",
  phone: "",
};
let paymentMethod = "upi";
let orderItems = [];

// DOM elements
const addressStep = document.getElementById("address-step");
const paymentStep = document.getElementById("payment-step");
const backButton = document.getElementById("back-button");
const emptyDiv = document.getElementById("empty-div");
const nextButton = document.getElementById("next-button");
const placeOrderButton = document.getElementById("place-order-button");
const toggleSummaryButton = document.getElementById("toggle-summary");
const orderSummaryContent = document.getElementById("order-summary-content");
const chevronDown = document.querySelector(".chevron-down");
const chevronUp = document.querySelector(".chevron-up");
const orderItemsContainer = document.getElementById("order-items");
const subtotalElement = document.getElementById("subtotal");
const shippingElement = document.getElementById("shipping");
const totalElement = document.getElementById("total");

// Initialize the page
document.addEventListener("DOMContentLoaded", () => {
  // Load checkout data from sessionStorage
  const checkoutData = JSON.parse(sessionStorage.getItem('checkoutData'));
  if (!checkoutData) {
    showToast("Error", "No item selected for checkout.");
    return;
  }

  // Set order items dynamically
  orderItems = [{
    id: checkoutData.bookId,
    name: checkoutData.bookName,
    quantity: checkoutData.quantity,
    price: checkoutData.sellingPrice,
    image: checkoutData.image
  }];

  // Set shipping cost
  shippingCost = checkoutData.shippingCharges;

  // Render order items
  renderOrderItems();

  // Calculate and display totals
  updateTotals();

  // Set up event listeners
  setupEventListeners();
});

// Event listeners setup
function setupEventListeners() {
  // Toggle order summary on mobile
  if (toggleSummaryButton) {
    toggleSummaryButton.addEventListener("click", toggleOrderSummary);
  }

  // Navigation buttons
  nextButton.addEventListener("click", goToNextStep);
  backButton.addEventListener("click", goToPreviousStep);
  placeOrderButton.addEventListener("click", handlePlaceOrder);

  // Form inputs
  const formInputs = document.querySelectorAll("input[type='text'], input[type='tel']");
  formInputs.forEach(input => {
    input.addEventListener("change", updateFormData);
  });

  // UPI options
  const upiOptions = document.querySelectorAll(".upi-option");
  upiOptions.forEach(option => {
    option.addEventListener("click", () => {
      upiOptions.forEach(opt => opt.classList.remove("border-gold"));
      option.classList.add("border-gold");
      showToast(`Selected ${option.querySelector("span").textContent}`);
    });
  });
}

// Toggle order summary visibility on mobile
function toggleOrderSummary() {
  orderSummaryContent.classList.toggle("hidden");
  orderSummaryContent.classList.toggle("block");
  chevronDown.classList.toggle("hidden");
  chevronUp.classList.toggle("hidden");
}

// Render order items in summary
function renderOrderItems() {
  orderItemsContainer.innerHTML = "";
  orderItems.forEach(item => {
    const itemElement = document.createElement("div");
    itemElement.className = "flex gap-3";
    itemElement.innerHTML = `
      <div class="w-16 h-16 rounded-md overflow-hidden">
        <img 
          src="${item.image}" 
          alt="${item.name}" 
          class="w-full h-full object-cover"
        />
      </div>
      <div class="flex-1">
        <p class="font-medium text-gray-700">${item.name}</p>
        <p class="text-sm text-gray-500">Quantity: ${item.quantity}</p>
      </div>
      <div class="text-right">
        <p class="font-medium">₹${(item.price * item.quantity).toFixed(2)}</p>
      </div>
    `;
    orderItemsContainer.appendChild(itemElement);
  });
}

// Calculate and update totals
function updateTotals() {
  const subtotal = orderItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  const total = subtotal + shippingCost;

  subtotalElement.textContent = `₹${subtotal.toFixed(2)}`;
  shippingElement.textContent = `₹${shippingCost.toFixed(2)}`;
  totalElement.textContent = `₹${total.toFixed(2)}`;
}

// Form data update
function updateFormData(e) {
  formData[e.target.id] = e.target.value;
}

// Navigation between steps
function goToNextStep() {
  if (currentStep === 1) {
    if (validateShippingForm()) {
      currentStep = 2;
      addressStep.classList.add("hidden");
      paymentStep.classList.remove("hidden");
      backButton.classList.remove("hidden");
      emptyDiv.classList.add("hidden");
      nextButton.classList.add("hidden");
    }
  }
}

function goToPreviousStep() {
  if (currentStep === 2) {
    currentStep = 1;
    paymentStep.classList.add("hidden");
    addressStep.classList.remove("hidden");
    backButton.classList.add("hidden");
    emptyDiv.classList.remove("hidden");
    nextButton.classList.remove("hidden");
  }
}

// Shipping form validation
function validateShippingForm() {
  const requiredFields = ["firstName", "lastName", "address", "city", "state", "zipCode", "phone"];
  let isValid = true;

  requiredFields.forEach(field => {
    const input = document.getElementById(field);
    if (!input.value.trim()) {
      isValid = false;
      input.classList.add("border-red-500");
      input.addEventListener("focus", function onFocus() {
        input.classList.remove("border-red-500");
        input.removeEventListener("focus", onFocus);
      }, { once: true });
    }
  });

  if (!isValid) {
    showToast("Please fill in all required fields", "error");
  }

  return isValid;
}

// Handle placing order
async function handlePlaceOrder() {
    if (currentStep === 1) {
      if (validateShippingForm()) {
        goToNextStep();
      }
    } else {
      const checkoutData = JSON.parse(sessionStorage.getItem('checkoutData'));
      if (!checkoutData) {
        showToast("Error", "Checkout data not found.");
        return;
      }
  
      const shippingAddress = `${formData.firstName} ${formData.lastName}, ${formData.address}${
        formData.apartment ? ", " + formData.apartment : ""
      }, ${formData.city}, ${formData.state} ${formData.zipCode}, Phone: ${formData.phone}`;
  
      try {
        // Create order
        const orderResponse = await fetch('http://localhost:3000/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            bookId: checkoutData.bookId,
            quantity: checkoutData.quantity,
            shippingAddress
          })
        });
  
        const orderData = await orderResponse.json();
        if (!orderData.success) {
          showToast("Error", orderData.message || "Failed to place order.");
          return;
        }
  
        // Simulate payment confirmation
        const confirmResponse = await fetch(`http://localhost:3000/api/orders/${orderData.orderId}/confirm-payment`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include'
        });
  
        const confirmData = await confirmResponse.json();
        if (confirmData.success) {
          showToast("Order Placed", "Your order has been placed successfully!");
          sessionStorage.removeItem('checkoutData');
          setTimeout(() => {
            window.location.href = '/myorders.html';
          }, 1500);
        } else {
          showToast("Error", confirmData.message || "Failed to confirm payment.");
        }
      } catch (error) {
        console.error('Place order error:', error);
        showToast("Error", "Failed to place order.");
      }
    }
  }

// Toast notification system
function showToast(title, description = "") {
  const toastContainer = document.getElementById("toast-container");
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.innerHTML = `
    <div class="grid gap-1">
      <h4 class="text-sm font-semibold">${title}</h4>
      ${description ? `<p class="text-sm opacity-90">${description}</p>` : ""}
    </div>
  `;
  toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => {
      toastContainer.removeChild(toast);
    }, 300);
  }, 5000);
}