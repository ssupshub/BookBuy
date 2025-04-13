document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM fully loaded'); // Debug: Confirm script runs

  // Navigation functionality
  const mobileMenuToggle = document.querySelector('.navbar-toggle');
  const mobileMenuClose = document.querySelector('.mobile-menu-close');
  const mobileMenu = document.querySelector('.mobile-menu');

  if (mobileMenuToggle) {
    mobileMenuToggle.addEventListener('click', () => {
      mobileMenu.classList.add('active');
    });
  }

  if (mobileMenuClose) {
    mobileMenuClose.addEventListener('click', () => {
      mobileMenu.classList.remove('active');
    });
  }

  const dropdownToggle = document.querySelector('.dropdown-toggle');
  const dropdownMenu = document.querySelector('.dropdown-menu');

  if (dropdownToggle) {
    dropdownToggle.addEventListener('click', (e) => {
      e.preventDefault();
      dropdownMenu.classList.toggle('show');
    });
  }

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.dropdown') && dropdownMenu) {
      dropdownMenu.classList.remove('show');
    }
  });

  // DOM elements
  const profileCardView = document.getElementById('profileCardView');
  const editProfileView = document.getElementById('editProfileView');
  const passwordView = document.getElementById('passwordView');

  const profileName = document.getElementById('profileName');
  const profileEmail = document.getElementById('profileEmail');
  const profilePhone = document.getElementById('profilePhone');
  const profileAddress = document.getElementById('profileAddress');
  const verificationStatus = document.getElementById('verificationStatus');
  const aadharVerification = document.getElementById('aadharVerification');

  const nameInput = document.getElementById('name');
  const emailInput = document.getElementById('email');
  const phoneInput = document.getElementById('phone');
  const addressInput = document.getElementById('address');

  const editProfileBtn = document.getElementById('editProfileBtn');
  const saveProfileBtn = document.getElementById('saveProfileBtn');
  const cancelEditBtn = document.getElementById('cancelEditBtn');
  const changePasswordBtn = document.getElementById('changePasswordBtn');
  const updatePasswordBtn = document.getElementById('updatePasswordBtn');
  const cancelPasswordBtn = document.getElementById('cancelPasswordBtn');
  const verifyBtn = document.getElementById('verifyBtn');

  // Debug: Check if elements are found
  console.log('editProfileBtn:', editProfileBtn);
  console.log('editProfileView:', editProfileView);
  console.log('profileCardView:', profileCardView);

  // Password toggle functionality
  const togglePasswordButtons = document.querySelectorAll('.toggle-password');
  togglePasswordButtons.forEach(button => {
    button.addEventListener('click', () => {
      const inputId = button.getAttribute('data-for');
      const input = document.getElementById(inputId);
      const icon = button.querySelector('i');
      if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
      } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
      }
    });
  });

  // Fetch profile data from backend
  async function fetchProfileData() {
    try {
      const response = await fetch('/profile', {
        method: 'GET',
        credentials: 'include',
      });
      const data = await response.json();
      console.log('Profile data fetched:', data); // Debug: Log response
      if (!data.success) {
        if (response.status === 401) {
          showToast('Please log in to view your profile', 'error');
          setTimeout(() => { window.location.href = '/login'; }, 2000);
        }
        throw new Error(data.message || 'Failed to fetch profile data');
      }
      return {
        name: data.name || '',
        email: data.email || '',
        phone: data.phone || '',
        address: data.address || '',
        aadharVerified: data.aadharVerified || false
      };
    } catch (error) {
      console.error('Error fetching profile:', error);
      showToast(error.message || 'Failed to load profile data', 'error');
      return {
        name: '',
        email: '',
        phone: '',
        address: '',
        aadharVerified: false
      };
    }
  }

  // Update profile view with fetched data
  async function updateProfileView() {
    const profileData = await fetchProfileData();
    profileName.textContent = profileData.name || 'Not Set';
    profileEmail.textContent = profileData.email || 'Not Set';
    profilePhone.textContent = profileData.phone || 'Not Set';
    profileAddress.textContent = profileData.address || 'Not Set';

    if (profileData.aadharVerified) {
      verificationStatus.textContent = 'Verified';
      verificationStatus.style.color = '#10b981';
      const verificationIcon = aadharVerification.querySelector('.profile-icon');
      verificationIcon.style.backgroundColor = 'rgba(16, 185, 129, 0.1)';
      verificationIcon.innerHTML = '<i class="fas fa-shield-alt" style="color: #10b981;"></i>';
      verifyBtn.style.display = 'none';
    } else {
      verificationStatus.textContent = 'Not Verified';
      verifyBtn.style.display = 'inline-flex';
    }
  }

  // Populate edit form with current data
  async function populateEditForm() {
    const profileData = await fetchProfileData();
    console.log('Populating form with:', profileData); // Debug: Log form data
    nameInput.value = profileData.name;
    emailInput.value = profileData.email;
    phoneInput.value = profileData.phone;
    addressInput.value = profileData.address;
  }

  // Switch between views
  function showView(viewToShow) {
    console.log('Switching to view:', viewToShow.id); // Debug: Log view switch
    profileCardView.classList.add('hidden');
    editProfileView.classList.add('hidden');
    passwordView.classList.add('hidden');
    viewToShow.classList.remove('hidden');
  }

  // Event Listeners
  if (editProfileBtn) {
    editProfileBtn.addEventListener('click', async () => {
      console.log('Edit Profile button clicked'); // Debug: Confirm click
      await populateEditForm();
      showView(editProfileView);
    });
  } else {
    console.error('editProfileBtn not found in DOM');
  }

  if (saveProfileBtn) {
    saveProfileBtn.addEventListener('click', async () => {
      console.log('Save Profile button clicked'); // Debug: Confirm click
      if (!nameInput.value.trim()) {
        showToast('Name is required', 'error');
        return;
      }

      if (!emailInput.value.trim() && !phoneInput.value.trim()) {
        showToast('Either email or phone number is required', 'error');
        return;
      }

      if (emailInput.value.trim()) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(emailInput.value.trim())) {
          showToast('Please enter a valid email address', 'error');
          return;
        }
      }

      if (phoneInput.value.trim()) {
        const phoneRegex = /^\d{10}$/;
        if (!phoneRegex.test(phoneInput.value.trim())) {
          showToast('Please enter a valid 10-digit phone number', 'error');
          return;
        }
      }

      const updatedProfile = {
        name: nameInput.value.trim(),
        email: emailInput.value.trim(),
        phone: phoneInput.value.trim(),
        address: addressInput.value.trim()
      };

      try {
        const response = await fetch('/profile/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedProfile),
          credentials: 'include',
        });

        const data = await response.json();
        console.log('Update response:', data); // Debug: Log update response
        if (!data.success) {
          throw new Error(data.message || 'Failed to update profile');
        }

        await updateProfileView();
        showToast('Profile updated successfully', 'success');
        showView(profileCardView);
      } catch (error) {
        console.error('Error updating profile:', error);
        showToast(error.message || 'Failed to update profile', 'error');
      }
    });
  }

  if (cancelEditBtn) {
    cancelEditBtn.addEventListener('click', () => {
      console.log('Cancel Edit button clicked'); // Debug: Confirm click
      showView(profileCardView);
    });
  }

  if (changePasswordBtn) {
    changePasswordBtn.addEventListener('click', () => {
      console.log('Change Password button clicked'); // Debug: Confirm click
      showView(passwordView);
    });
  }

  if (updatePasswordBtn) {
    updatePasswordBtn.addEventListener('click', async () => {
      console.log('Update Password button clicked'); // Debug: Confirm click
      const currentPassword = document.getElementById('currentPassword').value;
      const newPassword = document.getElementById('newPassword').value;
      const confirmPassword = document.getElementById('confirmPassword').value;

      if (!currentPassword || !newPassword || !confirmPassword) {
        showToast('Please fill in all fields', 'error');
        return;
      }

      if (newPassword.length < 8) {
        showToast('New password must be at least 8 characters long', 'error');
        return;
      }

      if (newPassword !== confirmPassword) {
        showToast("New passwords don't match", 'error');
        return;
      }

      try {
        const response = await fetch('/profile/change-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ currentPassword, newPassword }),
          credentials: 'include',
        });

        const data = await response.json();
        console.log('Password change response:', data); // Debug: Log response
        if (!data.success) {
          throw new Error(data.message || 'Failed to change password');
        }

        showToast('Password changed successfully', 'success');
        showView(profileCardView);
        document.getElementById('passwordForm').reset();
      } catch (error) {
        console.error('Error changing password:', error);
        showToast(error.message || 'Failed to change password', 'error');
      }
    });
  }

  if (cancelPasswordBtn) {
    cancelPasswordBtn.addEventListener('click', () => {
      console.log('Cancel Password button clicked'); // Debug: Confirm click
      showView(profileCardView);
      document.getElementById('passwordForm').reset();
    });
  }

  if (verifyBtn) {
    verifyBtn.addEventListener('click', () => {
      console.log('Verify button clicked'); // Debug: Confirm click
      showToast('Aadhar verification not implemented yet. Contact support.', 'info');
    });
  }

  // Toast notification function
  function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.classList.add('toast', `toast-${type}`);

    let icon;
    switch (type) {
      case 'success':
        icon = '<i class="fas fa-check-circle"></i>';
        break;
      case 'error':
        icon = '<i class="fas fa-exclamation-circle"></i>';
        break;
      default:
        icon = '<i class="fas fa-info-circle"></i>';
    }

    toast.innerHTML = `${icon} ${message}`;
    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  // Initialize the page
  updateProfileView();
});