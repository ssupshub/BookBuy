document.addEventListener('DOMContentLoaded', function() {
  // DOM Elements
  const bookForm = document.getElementById('bookPostForm');
  const manualEntryTab = document.getElementById('manualEntryTab');
  const isbnLookupTab = document.getElementById('isbnLookupTab');
  const isbnLookupSection = document.getElementById('isbnLookupSection');
  const bookClassification = document.getElementById('bookClassification');
  const conditionRating = document.getElementById('conditionRating');
  const ratingDisplay = document.getElementById('ratingDisplay');
  const bookTypeSelect = document.getElementById('bookType');
  const categorySelect = document.getElementById('category');
  const subcategorySelect = document.getElementById('subcategory');
  const freeShippingCheckbox = document.getElementById('free-shipping');
  const shippingPriceContainer = document.getElementById('shippingPriceContainer');
  const shippingPriceInput = document.getElementById('shippingPrice');
  const advertiseCheckbox = document.getElementById('advertise');
  const adCommission = document.getElementById('adCommission');
  const priceInput = document.getElementById('price');
  const earningsDisplay = document.getElementById('earnings');
  const quantitySelect = document.getElementById('quantity');
  const descriptionTextarea = document.getElementById('description');
  const wordCountDisplay = document.getElementById('wordCount');
  const imageUpload = document.getElementById('image-upload');
  const videoUpload = document.getElementById('video-upload');
  const previewContainer = document.getElementById('previewContainer');
  const videoUploadText = document.getElementById('videoUploadText');
  const imagesRequiredText = document.getElementById('imagesRequired');
  const toast = document.getElementById('toast');
  const toastTitle = document.getElementById('toastTitle');
  const toastMessage = document.getElementById('toastMessage');
  const lookupButton = document.getElementById('lookupButton');
  const isbnInput = document.getElementById('isbnInput');
  const bookTitleInput = document.getElementById('bookTitle');
  const authorInput = document.getElementById('author');
  const editionInput = document.getElementById('edition');
  const mrpInput = document.getElementById('mrp');

  // State variables
  let entryMethod = 'manual';
  let images = [];
  let video = null;
  let conditionLabels = [
    'Poor', 'Very Bad', 'Bad', 'Below Average', 'Average',
    'Above Average', 'Good', 'Very Good', 'Excellent', 'Like New'
  ];
  let userId = null;

  // Book data options
  const bookTypes = [
    { value: 'college', label: 'College Book' },
    { value: 'exam', label: 'Exam/Test Preparation Book' },
    { value: 'reading', label: 'Reading Book' },
    { value: 'school', label: 'School Book' }
  ];
  
  const categoryOptions = {
    'college': [
      { value: 'btech', label: 'BTech' },
      { value: 'ba', label: 'BA' }
    ],
    'exam': [
      { value: 'jee', label: 'JEE' },
      { value: 'neet', label: 'NEET' }
    ],
    'reading': [
      { value: 'novel', label: 'Novel' },
      { value: 'children', label: 'Children Book' }
    ],
    'school': [
      { value: 'class12', label: 'Class 12th' },
      { value: 'class11', label: 'Class 11th' }
    ]
  };
  
  const subcategoryOptions = {
    'btech': [
      { value: 'applied_physics', label: 'Applied Physics' },
      { value: 'applied_mathematics', label: 'Applied Mathematics' }
    ],
    'ba': [
      { value: 'political_science', label: 'Political Science' },
      { value: 'history', label: 'History' }
    ],
    'jee': [
      { value: 'physics', label: 'Physics' },
      { value: 'mathematics', label: 'Mathematics' },
      { value: 'chemistry', label: 'Chemistry' }
    ],
    'neet': [
      { value: 'biology', label: 'Biology' },
      { value: 'zoology', label: 'Zoology' }
    ],
    'novel': [
      { value: 'thriller', label: 'Thriller' },
      { value: 'comedy', label: 'Comedy' }
    ],
    'children': [
      { value: 'coloring_book', label: 'Coloring Book' }
    ],
    'class12': [
      { value: 'physics', label: 'Physics' },
      { value: 'english', label: 'English' }
    ],
    'class11': [
      { value: 'accounts', label: 'Accounts' },
      { value: 'psychology', label: 'Psychology' }
    ]
  };
  
  // Event listeners
  manualEntryTab.addEventListener('click', function() {
    setEntryMethod('manual');
  });
  
  isbnLookupTab.addEventListener('click', function() {
    setEntryMethod('isbn');
  });
  
  lookupButton.addEventListener('click', function() {
    handleIsbnLookup();
  });
  
  conditionRating.addEventListener('input', function() {
    updateRatingDisplay();
  });
  
  bookTypeSelect.addEventListener('change', function() {
    populateCategories();
  });
  
  categorySelect.addEventListener('change', function() {
    populateSubcategories();
  });
  
  freeShippingCheckbox.addEventListener('change', function() {
    toggleShippingPrice();
    calculateEarnings();
  });
  
  advertiseCheckbox.addEventListener('change', function() {
    toggleAdCommission();
    calculateEarnings();
  });
  
  priceInput.addEventListener('input', calculateEarnings);
  shippingPriceInput.addEventListener('input', calculateEarnings);
  
  quantitySelect.addEventListener('change', function() {
    if (this.value === 'custom') {
      const customQty = prompt('Enter custom quantity (max 100):');
      if (customQty) {
        const qty = parseInt(customQty);
        if (!isNaN(qty) && qty > 0 && qty <= 100) {
          let customOption = quantitySelect.querySelector('option[data-custom="true"]');
          if (!customOption) {
            customOption = document.createElement('option');
            customOption.setAttribute('data-custom', 'true');
            quantitySelect.appendChild(customOption);
          }
          customOption.value = qty.toString();
          customOption.textContent = qty.toString();
          quantitySelect.value = qty.toString();
        } else {
          showToast('Invalid Quantity', 'Please enter a number between 1 and 100', 'error');
          quantitySelect.value = '1';
        }
      } else {
        quantitySelect.value = '1';
      }
    }
  });
  
  descriptionTextarea.addEventListener('input', function() {
    updateWordCount();
  });
  
  imageUpload.addEventListener('change', function() {
    handleImageUpload(this);
  });
  
  videoUpload.addEventListener('change', function() {
    handleVideoUpload(this);
  });
  
  bookForm.addEventListener('submit', function(e) {
    e.preventDefault();
    handleFormSubmit();
  });

  // Functions
  function setEntryMethod(method) {
    entryMethod = method;
    
    if (method === 'manual') {
      manualEntryTab.classList.add('border-b-2', 'border-bookish-brown-dark', 'text-bookish-brown-dark');
      manualEntryTab.classList.remove('text-bookish-gray-medium');
      isbnLookupTab.classList.remove('border-b-2', 'border-bookish-brown-dark', 'text-bookish-brown-dark');
      isbnLookupTab.classList.add('text-bookish-gray-medium');
      isbnLookupSection.classList.add('hidden');
      bookClassification.classList.remove('hidden');
    } else {
      isbnLookupTab.classList.add('border-b-2', 'border-bookish-brown-dark', 'text-bookish-brown-dark');
      isbnLookupTab.classList.remove('text-bookish-gray-medium');
      manualEntryTab.classList.remove('border-b-2', 'border-bookish-brown-dark', 'text-bookish-brown-dark');
      manualEntryTab.classList.add('text-bookish-gray-medium');
      isbnLookupSection.classList.remove('hidden');
      bookClassification.classList.add('hidden');
    }
  }
  
  function handleIsbnLookup() {
    const isbn = isbnInput.value.trim();
    if (!isbn) {
      showToast('Error', 'Please enter an ISBN number', 'error');
      return;
    }
    setTimeout(() => {
      const mockResponse = {
        title: "Sample Book Title",
        authors: ["John Author"],
        publishedDate: "2020",
        description: "This is a sample book description.",
        industryIdentifiers: [{ type: "ISBN_13", identifier: isbn }],
        pageCount: 250,
        categories: ["Fiction"],
        imageLinks: { thumbnail: "https://placeholder.com/book" },
        retailPrice: { amount: 29.99 },
      };
      bookTitleInput.value = mockResponse.title;
      authorInput.value = mockResponse.authors[0];
      editionInput.value = mockResponse.publishedDate;
      mrpInput.value = mockResponse.retailPrice.amount;
      showToast('Success!', 'Book details fetched successfully', 'success');
    }, 1000);
  }
  
  function updateRatingDisplay() {
    const value = parseInt(conditionRating.value);
    ratingDisplay.textContent = `${value}/10 - ${conditionLabels[value - 1]}`;
  }
  
  function populateCategories() {
    const selectedType = bookTypeSelect.value;
    categorySelect.innerHTML = '<option value="">Select category</option>';
    subcategorySelect.innerHTML = '<option value="">Select subcategory</option>';
    subcategorySelect.disabled = true;
    if (!selectedType) {
      categorySelect.disabled = true;
      return;
    }
    categorySelect.disabled = false;
    const categories = categoryOptions[selectedType] || [];
    categories.forEach(category => {
      const option = document.createElement('option');
      option.value = category.value;
      option.textContent = category.label;
      categorySelect.appendChild(option);
    });
  }
  
  function populateSubcategories() {
    const selectedCategory = categorySelect.value;
    subcategorySelect.innerHTML = '<option value="">Select subcategory</option>';
    if (!selectedCategory) {
      subcategorySelect.disabled = true;
      return;
    }
    subcategorySelect.disabled = false;
    const subcategories = subcategoryOptions[selectedCategory] || [];
    subcategories.forEach(subcategory => {
      const option = document.createElement('option');
      option.value = subcategory.value;
      option.textContent = subcategory.label;
      subcategorySelect.appendChild(option);
    });
  }
  
  function toggleShippingPrice() {
    if (freeShippingCheckbox.checked) {
      shippingPriceContainer.classList.add('hidden');
      shippingPriceInput.removeAttribute('required');
      shippingPriceInput.value = '';
    } else {
      shippingPriceContainer.classList.remove('hidden');
      shippingPriceInput.setAttribute('required', 'required');
    }
  }
  
  function toggleAdCommission() {
    if (advertiseCheckbox.checked) {
      adCommission.classList.remove('hidden');
    } else {
      adCommission.classList.add('hidden');
    }
  }
  
  function calculateEarnings() {
    const priceNum = parseFloat(priceInput.value) || 0;
    const isFreeShipping = freeShippingCheckbox.checked;
    const shippingNum = !isFreeShipping && shippingPriceInput.value 
      ? parseFloat(shippingPriceInput.value) || 0 
      : 0;
    let total = priceNum + shippingNum;
    if (advertiseCheckbox.checked) {
      total *= 0.9;
      adCommission.classList.remove('hidden');
    } else {
      adCommission.classList.add('hidden');
    }
    earningsDisplay.textContent = `₹${total.toFixed(2)}`;
  }
  
  function updateWordCount() {
    const text = descriptionTextarea.value;
    const wordCount = text.split(/\s+/).filter(Boolean).length;
    wordCountDisplay.textContent = `Word count: ${wordCount}/300`;
    if (wordCount > 300) {
      wordCountDisplay.classList.add('text-red-500');
    } else {
      wordCountDisplay.classList.remove('text-red-500');
    }
  }
  
  function handleImageUpload(input) {
    const files = input.files;
    if (!files || !files.length) return;
    const MIN_IMAGES = 4;
    const MAX_IMAGES = 10;
    if (images.length + files.length > MAX_IMAGES) {
      showToast('Too Many Images', `You can upload a maximum of ${MAX_IMAGES} images.`, 'error');
      return;
    }
    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = function(e) {
        if (!e.target?.result) return;
        const imgPreview = document.createElement('div');
        imgPreview.className = 'relative h-32 w-32 rounded-md overflow-hidden border border-bookish-brown-medium group';
        const img = document.createElement('img');
        img.src = e.target.result.toString();
        img.alt = 'Book preview';
        img.className = 'h-full w-full object-cover';
        const removeBtn = document.createElement('button');
        removeBtn.className = 'absolute top-1 right-1 bg-bookish-brown-dark text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity';
        removeBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
        removeBtn.addEventListener('click', function() {
          const index = images.indexOf(e.target.result.toString());
          if (index > -1) {
            images.splice(index, 1);
            imgPreview.remove();
            updateImageRequiredText();
          }
        });
        imgPreview.appendChild(img);
        imgPreview.appendChild(removeBtn);
        previewContainer.appendChild(imgPreview);
        images.push(e.target.result.toString());
        updateImageRequiredText();
      };
      reader.readAsDataURL(file);
    });
    input.value = '';
  }
  
  function handleVideoUpload(input) {
    const file = input.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('video/')) {
      showToast('Invalid File', 'Please upload a video file.', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = function(e) {
      if (!e.target?.result) return;
      const videoPreview = document.createElement('div');
      videoPreview.className = 'relative h-32 w-32 rounded-md overflow-hidden border border-bookish-brown-medium group';
      const videoEl = document.createElement('video');
      videoEl.src = e.target.result.toString();
      videoEl.controls = true;
      videoEl.className = 'h-full w-full object-cover';
      const removeBtn = document.createElement('button');
      removeBtn.className = 'absolute top-1 right-1 bg-bookish-brown-dark text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity';
      removeBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
      removeBtn.addEventListener('click', function() {
        video = null;
        videoPreview.remove();
        videoUploadText.textContent = 'Upload a video (optional)';
        videoUpload.disabled = false;
      });
      videoPreview.appendChild(videoEl);
      videoPreview.appendChild(removeBtn);
      previewContainer.appendChild(videoPreview);
      video = e.target.result.toString();
      videoUploadText.textContent = 'Video uploaded';
      videoUpload.disabled = true;
    };
    reader.readAsDataURL(file);
  }
  
  function updateImageRequiredText() {
    const MIN_IMAGES = 4;
    const MAX_IMAGES = 10;
    if (images.length < MIN_IMAGES) {
      imagesRequiredText.textContent = `${MIN_IMAGES - images.length} more required`;
      imagesRequiredText.classList.add('text-red-500');
    } else {
      imagesRequiredText.textContent = `${Math.max(0, MAX_IMAGES - images.length)} more allowed`;
      imagesRequiredText.classList.remove('text-red-500');
    }
    imageUpload.disabled = images.length >= MAX_IMAGES;
  }
  
  function showToast(title, message, variant = 'error') {
    toastTitle.textContent = title;
    toastMessage.textContent = message;
    if (variant === 'error') {
      toast.classList.add('bg-red-600');
      toast.classList.remove('bg-bookish-brown-dark');
    } else {
      toast.classList.add('bg-bookish-brown-dark');
      toast.classList.remove('bg-red-600');
    }
    toast.classList.add('toast-show');
    setTimeout(() => {
      toast.classList.remove('toast-show');
    }, 3000);
  }
  
  async function checkSession() {
    try {
      const response = await fetch('/api/session');
      const result = await response.json();
      if (result.success) {
        userId = result.userId;
      } else {
        userId = null;
      }
    } catch (error) {
      console.error('Session check error:', error);
      userId = null;
    }
  }

  async function handleFormSubmit() {
    await checkSession();
    if (!userId) {
      showToast('Error', 'Please log in to post a book', 'error');
      return;
    }

    const bookTitle = document.getElementById('bookTitle').value;
    const description = document.getElementById('description').value;
    const price = document.getElementById('price').value;
    const wordCount = description.split(/\s+/).filter(Boolean).length;
    
    if (!bookTitle) {
      showToast('Missing Information', 'Please enter a book title', 'error');
      return;
    }
    if (wordCount < 10) {
      showToast('Description Too Short', 'Book description must be at least 10 words', 'error');
      return;
    }
    if (wordCount > 300) {
      showToast('Description Too Long', 'Book description must be at most 300 words', 'error');
      return;
    }
    if (!price) {
      showToast('Missing Information', 'Please enter a price for your book', 'error');
      return;
    }
    if (!freeShippingCheckbox.checked && !shippingPriceInput.value) {
      showToast('Missing Information', 'Please enter shipping charges or select free shipping', 'error');
      return;
    }
    if (images.length < 4) {
      showToast('Not Enough Images', 'Please upload at least 4 images of your book', 'error');
      return;
    }

    const formData = new FormData();
    formData.append('title', bookTitle);
    formData.append('bookType', bookTypeSelect.value);
    formData.append('category', categorySelect.value);
    formData.append('subcategory', subcategorySelect.value);
    formData.append('mrp', mrpInput.value);
    formData.append('author', authorInput.value);
    formData.append('edition', editionInput.value);
    formData.append('condition', document.getElementById('condition').value);
    formData.append('conditionRating', conditionRating.value);
    formData.append('description', description);
    formData.append('quantity', quantitySelect.value);
    formData.append('price', price);
    formData.append('isFreeShipping', freeShippingCheckbox.checked);
    formData.append('shippingPrice', shippingPriceInput.value || 0);
    formData.append('isAdvertised', advertiseCheckbox.checked);

    const imagePromises = images.map(async (dataUrl, index) => {
      const blob = await fetch(dataUrl).then(res => res.blob());
      formData.append('images', blob, `image-${index}.jpg`);
    });

    if (video) {
      const videoBlob = await fetch(video).then(res => res.blob());
      formData.append('video', videoBlob, 'book-video.mp4');
    }

    try {
      await Promise.all(imagePromises);
      const response = await fetch('/api/books/post', {
        method: 'POST',
        body: formData,
        credentials: 'include' // Include cookies for session
      });

      const result = await response.json();

      if (result.success) {
        showToast('Book Posted!', 
          `Your book has been successfully listed for sale on ${new Date(result.createdAt).toLocaleDateString()}.`,
          'success'
        );
        console.log('Posted by user:', result.userId);
        console.log('Posted on:', result.createdAt);
        bookForm.reset();
        images = [];
        video = null;
        previewContainer.innerHTML = '';
        initForm();
      } else {
        showToast('Error', result.message || 'Failed to post book', 'error');
      }
    } catch (error) {
      console.error('Form submission error:', error);
      showToast('Error', 'An error occurred while posting your book', 'error');
    }
  }
  
  function initForm() {
    updateRatingDisplay();
    toggleShippingPrice();
    toggleAdCommission();
    calculateEarnings();
    updateWordCount();
    updateImageRequiredText();
    checkSession(); // Check session on page load
  }
  
  initForm();
});