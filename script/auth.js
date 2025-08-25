document.addEventListener('DOMContentLoaded', function() {
  lucide.createIcons();
  
  // DOM elements
  const tabBtns = document.querySelectorAll('.tab-btn');
  const authForms = document.querySelectorAll('.auth-form');
  const passwordToggles = document.querySelectorAll('.password-toggle');
  const loginForm = document.getElementById('login-form');
  const signupForm = document.getElementById('signup-form');
  const forgotForm = document.getElementById('forgot-form');
  const resetPasswordBtn = document.getElementById('reset-password-btn');
  const resetCodeSection = document.getElementById('reset-code-section');
  const signupPassword = document.getElementById('signup-password');
  const strengthFill = document.querySelector('.strength-fill');
  const strengthText = document.querySelector('.strength-text');
  
  // Tab switching
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.dataset.tab;
      
      // Update active tab
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      // Update active form
      authForms.forEach(form => form.classList.remove('active'));
      document.getElementById(`${targetTab}-form`).classList.add('active');
    });
  });
  
  // Password visibility toggle
  passwordToggles.forEach(toggle => {
    toggle.addEventListener('click', () => {
      const input = toggle.parentElement.querySelector('input');
      const icon = toggle.querySelector('i');
      
      if (input.type === 'password') {
        input.type = 'text';
        icon.setAttribute('data-lucide', 'eye-off');
      } else {
        input.type = 'password';
        icon.setAttribute('data-lucide', 'eye');
      }
      lucide.createIcons();
    });
  });
  
  // Password strength checker
  if (signupPassword) {
    signupPassword.addEventListener('input', checkPasswordStrength);
  }
  
  // Form submissions
  loginForm.addEventListener('submit', handleLogin);
  signupForm.addEventListener('submit', handleSignup);
  forgotForm.addEventListener('submit', handleForgotPassword);
  
  if (resetPasswordBtn) {
    resetPasswordBtn.addEventListener('click', handleResetPassword);
  }
});

function checkPasswordStrength(e) {
  const password = e.target.value;
  const strengthFill = document.querySelector('.strength-fill');
  const strengthText = document.querySelector('.strength-text');
  
  let strength = 0;
  let strengthLabel = 'Very Weak';
  
  if (password.length >= 8) strength++;
  if (/[a-z]/.test(password)) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[^A-Za-z0-9]/.test(password)) strength++;
  
  strengthFill.className = 'strength-fill';
  
  switch (strength) {
    case 0:
    case 1:
      strengthFill.classList.add('weak');
      strengthLabel = 'Weak';
      break;
    case 2:
      strengthFill.classList.add('fair');
      strengthLabel = 'Fair';
      break;
    case 3:
      strengthFill.classList.add('good');
      strengthLabel = 'Good';
      break;
    case 4:
    case 5:
      strengthFill.classList.add('strong');
      strengthLabel = 'Strong';
      break;
  }
  
  strengthText.textContent = strengthLabel;
}

async function handleLogin(e) {
  e.preventDefault();
  const submitBtn = e.target.querySelector('.auth-submit');
  const btnText = submitBtn.querySelector('.btn-text');
  const btnSpinner = submitBtn.querySelector('.btn-spinner');
  
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  
  if (!email || !password) {
    showToast('Error', 'Please fill in all fields', 'error');
    return;
  }
  
  // Show loading state
  btnText.classList.add('hidden');
  btnSpinner.classList.remove('hidden');
  submitBtn.disabled = true;
  
  try {
    const response = await fetch('http://localhost:3000/login-signup/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ phone_email: email, password })
    });
    
    const data = await response.json();
    
    if (data.success) {
      showToast('Success', 'Login successful! Redirecting...', 'success');
      setTimeout(() => {
        window.location.href = '/';
      }, 1500);
    } else {
      showToast('Login Failed', data.message || 'Invalid credentials', 'error');
    }
  } catch (error) {
    console.error('Login error:', error);
    showToast('Error', 'Something went wrong. Please try again.', 'error');
  } finally {
    // Reset button state
    btnText.classList.remove('hidden');
    btnSpinner.classList.add('hidden');
    submitBtn.disabled = false;
  }
}

async function handleSignup(e) {
  e.preventDefault();
  const submitBtn = e.target.querySelector('.auth-submit');
  const btnText = submitBtn.querySelector('.btn-text');
  const btnSpinner = submitBtn.querySelector('.btn-spinner');
  
  const name = document.getElementById('signup-name').value;
  const email = document.getElementById('signup-email').value;
  const password = document.getElementById('signup-password').value;
  
  if (!name || !email || !password) {
    showToast('Error', 'Please fill in all fields', 'error');
    return;
  }
  
  if (password.length < 8) {
    showToast('Error', 'Password must be at least 8 characters long', 'error');
    return;
  }
  
  // Show loading state
  btnText.classList.add('hidden');
  btnSpinner.classList.remove('hidden');
  submitBtn.disabled = true;
  
  try {
    const response = await fetch('http://localhost:3000/login-signup/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ name, phone_email: email, password })
    });
    
    const data = await response.json();
    
    if (data.success) {
      showToast('Success', 'Account created successfully! Redirecting...', 'success');
      setTimeout(() => {
        window.location.href = '/';
      }, 1500);
    } else {
      showToast('Signup Failed', data.message || 'Email already exists', 'error');
    }
  } catch (error) {
    console.error('Signup error:', error);
    showToast('Error', 'Something went wrong. Please try again.', 'error');
  } finally {
    // Reset button state
    btnText.classList.remove('hidden');
    btnSpinner.classList.add('hidden');
    submitBtn.disabled = false;
  }
}

async function handleForgotPassword(e) {
  e.preventDefault();
  const submitBtn = e.target.querySelector('.auth-submit');
  const btnText = submitBtn.querySelector('.btn-text');
  const btnSpinner = submitBtn.querySelector('.btn-spinner');
  
  const email = document.getElementById('forgot-email').value;
  
  if (!email) {
    showToast('Error', 'Please enter your email or phone', 'error');
    return;
  }
  
  // Show loading state
  btnText.classList.add('hidden');
  btnSpinner.classList.remove('hidden');
  submitBtn.disabled = true;
  
  try {
    const response = await fetch('http://localhost:3000/login-signup/forgotPassword', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone_email: email })
    });
    
    if (response.ok) {
      showToast('Success', 'Reset code sent! Check your email.', 'success');
      document.getElementById('reset-code-section').classList.remove('hidden');
      submitBtn.style.display = 'none';
    } else {
      const errorText = await response.text();
      showToast('Error', errorText || 'Email not found', 'error');
    }
  } catch (error) {
    console.error('Forgot password error:', error);
    showToast('Error', 'Something went wrong. Please try again.', 'error');
  } finally {
    // Reset button state
    btnText.classList.remove('hidden');
    btnSpinner.classList.add('hidden');
    submitBtn.disabled = false;
  }
}

async function handleResetPassword() {
  const email = document.getElementById('forgot-email').value;
  const resetCode = document.getElementById('reset-code').value;
  const newPassword = document.getElementById('new-password').value;
  
  if (!resetCode || !newPassword) {
    showToast('Error', 'Please fill in all fields', 'error');
    return;
  }
  
  if (newPassword.length < 8) {
    showToast('Error', 'Password must be at least 8 characters long', 'error');
    return;
  }
  
  const submitBtn = document.getElementById('reset-password-btn');
  const btnText = submitBtn.querySelector('.btn-text');
  const btnSpinner = submitBtn.querySelector('.btn-spinner');
  
  // Show loading state
  btnText.classList.add('hidden');
  btnSpinner.classList.remove('hidden');
  submitBtn.disabled = true;
  
  try {
    const response = await fetch('http://localhost:3000/login-signup/resetPassword', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone_email: email, resetCode, newPassword })
    });
    
    if (response.ok) {
      showToast('Success', 'Password reset successfully! Redirecting to login...', 'success');
      setTimeout(() => {
        // Switch to login tab
        document.querySelector('.tab-btn[data-tab="login"]').click();
        document.getElementById('reset-code-section').classList.add('hidden');
        document.querySelector('#forgot-form .auth-submit').style.display = 'block';
      }, 1500);
    } else {
      const errorText = await response.text();
      showToast('Error', errorText || 'Invalid or expired reset code', 'error');
    }
  } catch (error) {
    console.error('Reset password error:', error);
    showToast('Error', 'Something went wrong. Please try again.', 'error');
  } finally {
    // Reset button state
    btnText.classList.remove('hidden');
    btnSpinner.classList.add('hidden');
    submitBtn.disabled = false;
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