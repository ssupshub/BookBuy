document.addEventListener('DOMContentLoaded', function () {
  // Initialize Feather icons
  feather.replace();

  // Set current year in copyright
  document.getElementById('current-year').textContent = new Date().getFullYear();

  // Tab switching functionality
  const tabTriggers = document.querySelectorAll('.tab-trigger');
  const tabContents = document.querySelectorAll('.tab-content');

  tabTriggers.forEach((trigger) => {
    trigger.addEventListener('click', () => {
      tabTriggers.forEach((t) => t.classList.remove('active'));
      tabContents.forEach((c) => c.classList.remove('active'));

      trigger.classList.add('active');
      const tabId = trigger.dataset.tab;
      document.getElementById(`${tabId}-tab`).classList.add('active');
    });
  });

  // Password visibility toggle
  const togglePasswordButtons = document.querySelectorAll('.toggle-password');

  togglePasswordButtons.forEach((button) => {
    button.addEventListener('click', function () {
      const passwordInput = this.parentElement.querySelector('input');
      const showIcon = this.querySelector('.password-show');
      const hideIcon = this.querySelector('.password-hide');

      if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        showIcon.classList.add('hidden');
        hideIcon.classList.remove('hidden');
      } else {
        passwordInput.type = 'password';
        showIcon.classList.remove('hidden');
        hideIcon.classList.add('hidden');
      }
    });
  });

  // Form submission handlers
  const loginForm = document.getElementById('login-form');
  const signupForm = document.getElementById('signup-form');
  const forgotForm = document.getElementById('forgot-form');

  // Login Form Submission
  loginForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    try {
      const response = await fetch('/login-signup/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone_email: email, password }),
      });

      const data = await response.json();

      if (data.success) {
        showToast('Login Successful', 'Welcome back! Redirecting to homepage...');
        setTimeout(() => {
          window.location.href = '/'; // Redirect to homepage
        }, 2000);
      } else {
        showToast('Login Failed', data.message || 'Invalid email or password.');
      }
    } catch (error) {
      console.error('Error during login:', error);
      showToast('Error', 'Something went wrong. Please try again.');
    }
  });

  // Sign Up Form Submission
  signupForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    const name = document.getElementById('signup-name').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
  
    try {
      const response = await fetch('/login-signup/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone_email: email, password }),
      });
  
      const data = await response.json();
      if (response.ok) {
        showToast('Sign Up Successful', 'Account created! Redirecting to homepage...');
        setTimeout(() => { window.location.href = '/'; }, 2000);
      } else {
        showToast('Sign Up Failed', data.message || 'Email is already registered.');
      }
    } catch (error) {
      console.error('Error during signup:', error);
      showToast('Error', 'Something went wrong. Please try again.');
    }
  });

  // Forgot Password Form Submission
  forgotForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    const email = document.getElementById('reset-email').value;

    try {
      const response = await fetch('/login-signup/forgotPassword', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone_email: email }),
      });

      const text = await response.text();

      if (response.ok) {
        showToast('Reset Code Sent', 'Check your email for the reset code.');
        // Optionally, switch to a reset password form (not implemented in HTML yet)
      } else {
        showToast('Error', text || 'Email not registered.');
      }
    } catch (error) {
      console.error('Error during forgot password:', error);
      showToast('Error', 'Something went wrong. Please try again.');
    }
  });

  // Toast notification function
  function showToast(title, message) {
    const toastContainer = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';

    toast.innerHTML = `
      <div class="toast-title">${title}</div>
      <div class="toast-message">${message}</div>
    `;

    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      toast.style.transition = 'all 0.3s ease';

      setTimeout(() => {
        toastContainer.removeChild(toast);
      }, 300);
    }, 3000);
  }
});

const resetForm = document.getElementById('reset-form');
resetForm.addEventListener('submit', async function (e) {
  e.preventDefault();
  const email = document.getElementById('reset-email').value;
  const resetCode = document.getElementById('reset-code').value;
  const newPassword = document.getElementById('new-password').value;

  try {
    const response = await fetch('/login-signup/resetPassword', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone_email: email, resetCode, newPassword }),
    });

    const text = await response.text();

    if (response.ok) {
      showToast('Password Reset', 'Password updated successfully! Redirecting to login...');
      setTimeout(() => {
        document.querySelector('.tab-trigger[data-tab="login"]').click();
      }, 2000);
    } else {
      showToast('Error', text || 'Invalid or expired reset code.');
    }
  } catch (error) {
    console.error('Error during password reset:', error);
    showToast('Error', 'Something went wrong. Please try again.');
  }
});