/**
 * Utility functions for the real estate application
 */

/**
 * Format currency in Indian Rupees
 * @param {number} amount - The amount to format
 * @returns {string} Formatted currency string
 */
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

/**
 * Truncate text to a specific length
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @param {string} suffix - Suffix to add (default: '...')
 * @returns {string} Truncated text
 */
const truncateText = (text, maxLength = 100, suffix = '...') => {
  if (!text || text.length <= maxLength) return text || '';
  return text.substring(0, maxLength) + suffix;
};

/**
 * Validate email address
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid email
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate Indian mobile number
 * @param {string} mobile - Mobile number to validate
 * @returns {boolean} True if valid Indian mobile number
 */
const isValidIndianMobile = (mobile) => {
  const mobileRegex = /^[6-9]\d{9}$/;
  return mobileRegex.test(mobile.replace(/\D/g, ''));
};

/**
 * Sanitize user input to prevent XSS
 * @param {string} input - User input
 * @returns {string} Sanitized input
 */
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

/**
 * Generate a random string of specified length
 * @param {number} length - Length of random string
 * @returns {string} Random string
 */
const generateRandomString = (length = 8) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * Calculate file size in human readable format
 * @param {number} bytes - File size in bytes
 * @returns {string} Human readable file size
 */
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Extract file extension from filename
 * @param {string} filename - Filename
 * @returns {string} File extension
 */
const getFileExtension = (filename) => {
  return filename.split('.').pop().toLowerCase();
};

/**
 * Check if file is an image
 * @param {string} mimetype - File mimetype
 * @returns {boolean} True if image
 */
const isImageFile = (mimetype) => {
  return mimetype.startsWith('image/');
};

/**
 * Check if file is a video
 * @param {string} mimetype - File mimetype
 * @returns {boolean} True if video
 */
const isVideoFile = (mimetype) => {
  return mimetype.startsWith('video/');
};

/**
 * Parse query parameters for property filtering
 * @param {Object} query - Express request query object
 * @returns {Object} Parsed filter parameters
 */
const parsePropertyFilters = (query) => {
  const filters = {};
  
  // Location filter
  if (query.location) {
    filters.location = query.location.trim();
  }
  
  // Price range filters
  if (query.minPrice) {
    const minPrice = parseFloat(query.minPrice);
    if (!isNaN(minPrice) && minPrice >= 0) {
      filters.minPrice = minPrice;
    }
  }
  
  if (query.maxPrice) {
    const maxPrice = parseFloat(query.maxPrice);
    if (!isNaN(maxPrice) && maxPrice >= 0) {
      filters.maxPrice = maxPrice;
    }
  }
  
  // Area filters
  if (query.minArea) {
    const minArea = parseFloat(query.minArea);
    if (!isNaN(minArea) && minArea >= 0) {
      filters.minArea = minArea;
    }
  }
  
  if (query.maxArea) {
    const maxArea = parseFloat(query.maxArea);
    if (!isNaN(maxArea) && maxArea >= 0) {
      filters.maxArea = maxArea;
    }
  }
  
  // Sort options
  if (query.sort) {
    const validSorts = ['price_asc', 'price_desc', 'date_asc', 'date_desc'];
    if (validSorts.includes(query.sort)) {
      filters.sort = query.sort;
    }
  }
  
  // Pagination
  if (query.page) {
    const page = parseInt(query.page);
    if (!isNaN(page) && page > 0) {
      filters.page = page;
    }
  }
  
  if (query.limit) {
    const limit = parseInt(query.limit);
    if (!isNaN(limit) && limit > 0 && limit <= 100) {
      filters.limit = limit;
    }
  }
  
  // Default pagination
  filters.page = filters.page || 1;
  filters.limit = filters.limit || 20;
  filters.offset = (filters.page - 1) * filters.limit;
  
  return filters;
};

/**
 * Build SQL WHERE clause from filters
 * @param {Object} filters - Filter object
 * @returns {Object} SQL conditions and parameters
 */
const buildPropertyWhereClause = (filters) => {
  const conditions = [];
  const params = [];
  
  if (filters.location) {
    conditions.push('location LIKE ?');
    params.push(`%${filters.location}%`);
  }
  
  if (filters.minPrice !== undefined) {
    conditions.push('price >= ?');
    params.push(filters.minPrice);
  }
  
  if (filters.maxPrice !== undefined) {
    conditions.push('price <= ?');
    params.push(filters.maxPrice);
  }
  
  if (filters.minArea !== undefined) {
    conditions.push('CAST(REPLACE(sqft, ",", "") AS INTEGER) >= ?');
    params.push(filters.minArea);
  }
  
  if (filters.maxArea !== undefined) {
    conditions.push('CAST(REPLACE(sqft, ",", "") AS INTEGER) <= ?');
    params.push(filters.maxArea);
  }
  
  const whereClause = conditions.length > 0 
    ? 'WHERE ' + conditions.join(' AND ')
    : '';
    
  return {
    whereClause,
    params
  };
};

/**
 * Build SQL ORDER BY clause
 * @param {string} sort - Sort option
 * @returns {string} ORDER BY clause
 */
const buildOrderByClause = (sort) => {
  switch(sort) {
    case 'price_asc':
      return 'ORDER BY price ASC';
    case 'price_desc':
      return 'ORDER BY price DESC';
    case 'date_asc':
      return 'ORDER BY created_at ASC';
    case 'date_desc':
    default:
      return 'ORDER BY created_at DESC';
  }
};

/**
 * Format property response data
 * @param {Object} property - Property data from database
 * @returns {Object} Formatted property data
 */
const formatPropertyResponse = (property) => {
  return {
    id: property.id,
    title: property.title,
    description: property.description,
    price: parseFloat(property.price),
    location: property.location,
    sqft: property.sqft,
    mobile_number: property.mobile_number,
    created_at: property.created_at,
    updated_at: property.updated_at,
    photos: property.photos ? property.photos.split(',').filter(url => url) : [],
    videos: property.videos ? property.videos.split(',').filter(url => url) : []
  };
};

/**
 * Log API requests
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {number} startTime - Request start time
 */
const logRequest = (req, res, startTime) => {
  const duration = Date.now() - startTime;
  const logMessage = `${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`;
  
  if (res.statusCode >= 400) {
    console.error(logMessage);
  } else {
    console.log(logMessage);
  }
};

module.exports = {
  formatCurrency,
  truncateText,
  isValidEmail,
  isValidIndianMobile,
  sanitizeInput,
  generateRandomString,
  formatFileSize,
  getFileExtension,
  isImageFile,
  isVideoFile,
  parsePropertyFilters,
  buildPropertyWhereClause,
  buildOrderByClause,
  formatPropertyResponse,
  logRequest
};