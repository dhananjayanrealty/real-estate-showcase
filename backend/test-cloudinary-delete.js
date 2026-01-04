require('dotenv').config();
const CloudinaryDelete = require('./utils/cloudinaryDelete');

async function test() {
  const cloudinaryDelete = new CloudinaryDelete();
  
  // Test with a real video URL from your Cloudinary
  const testUrl = 'https://res.cloudinary.com/dx6rbdyfj/video/upload/v1766423662/real-estate-videos/qdbzjdhmtwdcsvglnvw8.mov';
  
  console.log('Testing Cloudinary delete...');
  console.log('URL:', testUrl);
  
  const publicId = cloudinaryDelete.extractPublicId(testUrl);
  console.log('Extracted public_id:', publicId);
  
  if (publicId) {
    const result = await cloudinaryDelete.deleteResource(publicId, 'video');
    console.log('Delete result:', result);
  }
}

test().catch(console.error);