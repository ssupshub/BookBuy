// Handle DOM content loaded
document.addEventListener('DOMContentLoaded', function() {
  // Set current year in footer
  document.getElementById('currentYear').textContent = new Date().getFullYear();

  // Mobile menu toggle
  const mobileMenuButton = document.getElementById('mobileMenuButton');
  const mobileMenu = document.getElementById('mobileMenu');

  if (mobileMenuButton && mobileMenu) {
    mobileMenuButton.addEventListener('click', () => {
      if (mobileMenu.classList.contains('hidden')) {
        mobileMenu.classList.remove('hidden');
      } else {
        mobileMenu.classList.add('hidden');
      }
    });
  }

  // Dropdown toggle
  const accountDropdownButton = document.getElementById('accountDropdownButton');
  const dropdownContent = document.getElementById('dropdownContent');

  if (accountDropdownButton && dropdownContent) {
    accountDropdownButton.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdownContent.classList.toggle('hidden');
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', () => {
      if (!dropdownContent.classList.contains('hidden')) {
        dropdownContent.classList.add('hidden');
      }
    });

    // Prevent dropdown from closing when clicking inside it
    dropdownContent.addEventListener('click', (e) => {
      e.stopPropagation();
    });
  }

  // Scroll reveal animation
  const revealElements = document.querySelectorAll('.reveal');

  function revealOnScroll() {
    const windowHeight = window.innerHeight;
    const revealPoint = 150;

    revealElements.forEach(element => {
      const elementTop = element.getBoundingClientRect().top;
      
      if (elementTop < windowHeight - revealPoint) {
        element.classList.add('active');
      } else {
        element.classList.remove('active');
      }
    });
  }

  window.addEventListener('scroll', revealOnScroll);
  // Initial check
  revealOnScroll();

  // Animated book opening based on scroll
  const animatedBook = document.getElementById('animatedBook');
  
  function handleBookAnimation() {
    if (animatedBook) {
      const scrollPosition = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      
      // Calculate scroll percentage (0-100)
      const scrollPercentage = (scrollPosition / (documentHeight - windowHeight)) * 100;
      
      // Book animation logic:
      // - At top of page (0-10%) -> closed book
      // - Middle of page (10-85%) -> book opens gradually
      // - Bottom of page (85-100%) -> book closes gradually
      
      if (scrollPercentage < 10) {
        // Closed at top
        animatedBook.querySelector('.book-cover').style.transform = `rotateY(0deg)`;
      } else if (scrollPercentage > 85) {
        // Gradually close from 180 degrees to 0
        const closePercentage = (scrollPercentage - 85) / 15; // 0 to 1
        const degrees = 180 - (closePercentage * 180);
        animatedBook.querySelector('.book-cover').style.transform = `rotateY(${degrees}deg)`;
      } else {
        // Gradually open from 0 to 180 degrees
        const openPercentage = (scrollPercentage - 10) / 75; // 0 to 1
        const degrees = openPercentage * 180;
        animatedBook.querySelector('.book-cover').style.transform = `rotateY(${degrees}deg)`;
      }
    }
  }

  window.addEventListener('scroll', handleBookAnimation);
  // Initial check
  handleBookAnimation();
});