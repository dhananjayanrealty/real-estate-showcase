/**
 * Validation utilities for the real estate application
 */

/**
 * Validate property data
 * @param {Object} propertyData - Property data to validate
 * @returns {Object} Validation result { isValid: boolean, errors: array }
 */
const validateProperty = (propertyData) => {
  const errors = [];
  
  // Title validation
  if (!propertyData.title || propertyData.title.trim().length === 0) {
    errors.push('Property title is required');
  } else if (propertyData.title.length > 200) {
    errors.push('Property title must be less than 200 characters');
  }
  
  // Price validation
  if (!propertyData.price) {
    errors.push('Price is required');
  } else {
    const price = parseFloat(propertyData.price);
    if (isNaN(price) || price <= 0) {
      errors.push('Price must be a positive number');
    }
    if (price > 10000000000) { // 10 billion
      errors.push('Price is too high');
    }
  }
  
  // Location validation
  if (!propertyData.location || propertyData.location.trim().length === 0) {
    errors.push('Location is required');
  } else if (propertyData.location.length > 200) {
    errors.push('Location must be less than 200 characters');
  }
  
  // Mobile number validation
  if (!propertyData.mobile_number) {
    errors.push('Mobile number is required');
  } else {
    const mobile = propertyData.mobile_number.replace(/\D/g, '');
    if (!/^[6-9]\d{9}$/.test(mobile)) {
      errors.push('Please enter a valid Indian mobile number');
    }
  }
  
  // Description validation (optional)
  if (propertyData.description && propertyData.description.length > 5000) {
    errors.push('Description must be less than 5000 characters');
  }
  
  // Area validation (optional)
  if (propertyData.sqft) {
    const sqft = propertyData.sqft.trim();
    if (!/^\d+(,\d{3})*$/.test(sqft) && !/^\d+$/.test(sqft)) {
      errors.push('Area must be a valid number (e.g., 1200 or 1,200)');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate login credentials
 * @param {Object} credentials - Login credentials
 * @returns {Object} Validation result { isValid: boolean, errors: array }
 */
const validateLogin = (credentials) => {
  const errors = [];
  
  // Username validation
  if (!credentials.username || credentials.username.trim().length === 0) {
    errors.push('Username is required');
  } else if (credentials.username.length > 50) {
    errors.push('Username must be less than 50 characters');
  }
  
  // Password validation
  if (!credentials.password || credentials.password.length === 0) {
    errors.push('Password is required');
  } else if (credentials.password.length > 100) {
    errors.push('Password is too long');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate file upload
 * @param {Object} file - File object
 * @param {string} type - 'image' or 'video'
 * @returns {Object} Validation result { isValid: boolean, errors: array }
 */
const validateFileUpload = (file, type = 'image') => {
  const errors = [];
  
  if (!file) {
    errors.push('No file provided');
    return { isValid: false, errors };
  }
  
  // Check file size
  const maxSize = type === 'image' ? 10 * 1024 * 1024 : 50 * 1024 * 1024; // 10MB for images, 50MB for videos
  if (file.size > maxSize) {
    const maxSizeMB = maxSize / (1024 * 1024);
    errors.push(`File size must be less than ${maxSizeMB}MB`);
  }
  
  // Check file type
  const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  const allowedVideoTypes = ['video/mp4', 'video/mpeg', 'video/ogg', 'video/webm', 'video/quicktime'];
  
  const allowedTypes = type === 'image' ? allowedImageTypes : allowedVideoTypes;
  
  if (!allowedTypes.includes(file.mimetype)) {
    const allowedExtensions = allowedTypes.map(t => t.split('/')[1]).join(', ');
    errors.push(`${type.charAt(0).toUpperCase() + type.slice(1)} must be one of: ${allowedExtensions}`);
  }
  
  // Check filename
  if (!file.originalname || file.originalname.length === 0) {
    errors.push('Filename is required');
  } else if (file.originalname.length > 255) {
    errors.push('Filename is too long');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate contact form data
 * @param {Object} contactData - Contact form data
 * @returns {Object} Validation result { isValid: boolean, errors: array }
 */
const validateContactForm = (contactData) => {
  const errors = [];
  
  // Name validation
  if (!contactData.name || contactData.name.trim().length === 0) {
    errors.push('Name is required');
  } else if (contactData.name.length > 100) {
    errors.push('Name must be less than 100 characters');
  }
  
  // Phone validation
  if (!contactData.phone) {
    errors.push('Phone number is required');
  } else {
    const mobile = contactData.phone.replace(/\D/g, '');
    if (!/^[6-9]\d{9}$/.test(mobile)) {
      errors.push('Please enter a valid Indian mobile number');
    }
  }
  
  // Message validation
  if (!contactData.message || contactData.message.trim().length === 0) {
    errors.push('Message is required');
  } else if (contactData.message.length > 2000) {
    errors.push('Message must be less than 2000 characters');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate property ID
 * @param {string|number} propertyId - Property ID to validate
 * @returns {Object} Validation result { isValid: boolean, errors: array }
 */
const validatePropertyId = (propertyId) => {
  const errors = [];
  
  if (!propertyId) {
    errors.push('Property ID is required');
  } else {
    const id = parseInt(propertyId);
    if (isNaN(id) || id <= 0) {
      errors.push('Property ID must be a positive number');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate media ID
 * @param {string|number} mediaId - Media ID to validate
 * @returns {Object} Validation result { isValid: boolean, errors: array }
 */
const validateMediaId = (mediaId) => {
  const errors = [];
  
  if (!mediaId) {
    errors.push('Media ID is required');
  } else {
    const id = parseInt(mediaId);
    if (isNaN(id) || id <= 0) {
      errors.push('Media ID must be a positive number');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate pagination parameters
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @returns {Object} Validation result { isValid: boolean, errors: array, page: number, limit: number }
 */
const validatePagination = (page, limit) => {
  const errors = [];
  let validPage = 1;
  let validLimit = 20;
  
  // Validate page
  if (page) {
    const pageNum = parseInt(page);
    if (isNaN(pageNum) || pageNum <= 0) {
      errors.push('Page must be a positive number');
    } else {
      validPage = pageNum;
    }
  }
  
  // Validate limit
  if (limit) {
    const limitNum = parseInt(limit);
    if (isNaN(limitNum) || limitNum <= 0 || limitNum > 100) {
      errors.push('Limit must be between 1 and 100');
    } else {
      validLimit = limitNum;
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    page: validPage,
    limit: validLimit
  };
};

/**
 * Validate search query
 * @param {string} query - Search query
 * @returns {Object} Validation result { isValid: boolean, errors: array }
 */
const validateSearchQuery = (query) => {
  const errors = [];
  
  if (query && query.length > 200) {
    errors.push('Search query is too long');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate price range
 * @param {number} minPrice - Minimum price
 * @param {number} maxPrice - Maximum price
 * @returns {Object} Validation result { isValid: boolean, errors: array }
 */
const validatePriceRange = (minPrice, maxPrice) => {
  const errors = [];
  
  if (minPrice !== undefined) {
    const min = parseFloat(minPrice);
    if (isNaN(min) || min < 0) {
      errors.push('Minimum price must be a positive number');
    }
  }
  
  if (maxPrice !== undefined) {
    const max = parseFloat(maxPrice);
    if (isNaN(max) || max < 0) {
      errors.push('Maximum price must be a positive number');
    }
  }
  
  if (minPrice !== undefined && maxPrice !== undefined) {
    const min = parseFloat(minPrice);
    const max = parseFloat(maxPrice);
    if (min > max) {
      errors.push('Minimum price cannot be greater than maximum price');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate area range
 * @param {number} minArea - Minimum area
 * @param {number} maxArea - Maximum area
 * @returns {Object} Validation result { isValid: boolean, errors: array }
 */
const validateAreaRange = (minArea, maxArea) => {
  const errors = [];
  
  if (minArea !== undefined) {
    const min = parseFloat(minArea);
    if (isNaN(min) || min < 0) {
      errors.push('Minimum area must be a positive number');
    }
  }
  
  if (maxArea !== undefined) {
    const max = parseFloat(maxArea);
    if (isNaN(max) || max < 0) {
      errors.push('Maximum area must be a positive number');
    }
  }
  
  if (minArea !== undefined && maxArea !== undefined) {
    const min = parseFloat(minArea);
    const max = parseFloat(maxArea);
    if (min > max) {
      errors.push('Minimum area cannot be greater than maximum area');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate admin registration data
 * @param {Object} adminData - Admin registration data
 * @returns {Object} Validation result { isValid: boolean, errors: array }
 */
const validateAdminRegistration = (adminData) => {
  const errors = [];
  
  // Username validation
  if (!adminData.username || adminData.username.trim().length === 0) {
    errors.push('Username is required');
  } else if (adminData.username.length < 3) {
    errors.push('Username must be at least 3 characters long');
  } else if (adminData.username.length > 50) {
    errors.push('Username must be less than 50 characters');
  } else if (!/^[a-zA-Z0-9_]+$/.test(adminData.username)) {
    errors.push('Username can only contain letters, numbers, and underscores');
  }
  
  // Password validation
  if (!adminData.password || adminData.password.length === 0) {
    errors.push('Password is required');
  } else if (adminData.password.length < 6) {
    errors.push('Password must be at least 6 characters long');
  } else if (adminData.password.length > 100) {
    errors.push('Password is too long');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

module.exports = {
  validateProperty,
  validateLogin,
  validateFileUpload,
  validateContactForm,
  validatePropertyId,
  validateMediaId,
  validatePagination,
  validateSearchQuery,
  validatePriceRange,
  validateAreaRange,
  validateAdminRegistration
};