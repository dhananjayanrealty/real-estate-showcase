const axios = require('axios');
const FormData = require('form-data');
const crypto = require('crypto');

class CloudinaryDelete {
  constructor() {
    this.cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    this.apiKey = process.env.CLOUDINARY_API_KEY;
    this.apiSecret = process.env.CLOUDINARY_API_SECRET;
  }

  // Extract public_id from Cloudinary URL
  extractPublicId(url) {
    try {
      if (!url || !url.includes('cloudinary.com')) {
        return null;
      }

      console.log('Extracting public_id from:', url);
      
      // Remove the Cloudinary domain and path prefixes
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      
      // Find the "upload" segment
      const segments = pathname.split('/');
      const uploadIndex = segments.indexOf('upload');
      
      if (uploadIndex === -1) {
        console.log('No "upload" segment found in URL');
        return null;
      }
      
      // Get everything after the version (v1234567)
      // Format: /upload/v1234567/[folder/]filename
      let publicIdParts = segments.slice(uploadIndex + 2);
      
      if (publicIdParts.length === 0) {
        console.log('No public_id found after upload segment');
        return null;
      }
      
      // Remove file extension
      const lastPart = publicIdParts[publicIdParts.length - 1];
      if (lastPart.includes('.')) {
        publicIdParts[publicIdParts.length - 1] = lastPart.split('.')[0];
      }
      
      const publicId = publicIdParts.join('/');
      console.log('Extracted public_id:', publicId);
      return publicId;
      
    } catch (error) {
      console.error('Error extracting public_id:', error.message);
      return null;
    }
  }

  // Delete resource from Cloudinary
  async deleteResource(publicId, resourceType = 'video') {
    try {
      if (!publicId) {
        console.log('No public_id provided');
        return { success: false, error: 'No public_id' };
      }

      if (!this.cloudName || !this.apiKey || !this.apiSecret) {
        console.error('Cloudinary credentials not configured');
        return { success: false, error: 'Cloudinary not configured' };
      }

      console.log(`Deleting ${resourceType} from Cloudinary: ${publicId}`);
      
      // Generate signature
      const timestamp = Math.floor(Date.now() / 1000);
      const signatureString = `public_id=${publicId}&timestamp=${timestamp}${this.apiSecret}`;
      const signature = crypto.createHash('sha1').update(signatureString).digest('hex');
      
      // Prepare form data
      const formData = new FormData();
      formData.append('public_id', publicId);
      formData.append('api_key', this.apiKey);
      formData.append('timestamp', timestamp);
      formData.append('signature', signature);
      
      // Make API call
      const response = await axios.post(
        `https://api.cloudinary.com/v1_1/${this.cloudName}/${resourceType}/destroy`,
        formData,
        {
          headers: formData.getHeaders(),
          timeout: 10000
        }
      );
      
      console.log('Cloudinary delete response:', response.data);
      
      if (response.data.result === 'ok') {
        console.log(`✅ Successfully deleted from Cloudinary: ${publicId}`);
        return { success: true, data: response.data };
      } else {
        console.log(`⚠️ Cloudinary returned: ${response.data.result}`);
        return { success: false, error: response.data.result };
      }
      
    } catch (error) {
      console.error('Cloudinary delete error:', error.message);
      
      if (error.response) {
        console.error('Cloudinary response error:', error.response.data);
        return { 
          success: false, 
          error: error.response.data.error?.message || 'Cloudinary API error' 
        };
      }
      
      return { success: false, error: error.message };
    }
  }

  // Delete multiple resources
  async deleteMultiple(resources) {
    const results = [];
    
    for (const resource of resources) {
      const result = await this.deleteResource(resource.publicId, resource.resourceType);
      results.push({
        publicId: resource.publicId,
        ...result
      });
    }
    
    return results;
  }
}

module.exports = CloudinaryDelete;