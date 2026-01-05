// ImgBB Configuration
const IMGBB_API_KEY = process.env.IMGBB_API_KEY || 'your-imgbb-api-key';
const IMGBB_UPLOAD_URL = 'https://api.imgbb.com/1/upload';

// Cloudinary Configuration
const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || 'your-cloud-name';
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY || 'your-api-key';
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET || 'your-api-secret';
const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/upload`;

module.exports = {
  IMGBB_API_KEY,
  IMGBB_UPLOAD_URL,
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
  CLOUDINARY_UPLOAD_URL
};