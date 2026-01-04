const multer = require('multer');
const path = require('path');

// Configure multer for memory storage
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  console.log('File filter checking:', file.mimetype, file.originalname);
  
  // Check file type
  if (file.mimetype.startsWith('image/')) {
    // Allow only specific image types
    const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedImageTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported image type: ${file.mimetype}. Please use JPEG, PNG, GIF, or WebP.`), false);
    }
  } else if (file.mimetype.startsWith('video/')) {
    // Allow only specific video types
    const allowedVideoTypes = ['video/mp4', 'video/mpeg', 'video/ogg', 'video/webm', 'video/quicktime'];
    if (allowedVideoTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported video type: ${file.mimetype}. Please use MP4, MPEG, OGG, or WebM.`), false);
    }
  } else {
    cb(new Error('Only image and video files are allowed'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB max file size (Cloudinary free tier limit)
  }
});

// Error handling middleware for multer
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        error: 'File too large', 
        message: 'Maximum file size is 100MB' 
      });
    }
    return res.status(400).json({ 
      error: 'Upload error', 
      message: err.message 
    });
  } else if (err) {
    return res.status(400).json({ 
      error: 'File validation error', 
      message: err.message 
    });
  }
  next();
};

module.exports = {
  upload,
  handleUploadError
};