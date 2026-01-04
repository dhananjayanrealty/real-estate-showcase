const express = require('express');
const router = express.Router();
const {
  saveContactMessage,
  getAllContactMessages,
  getContactMessageById,
  deleteContactMessage
} = require('../controllers/contactController');
const { authenticateToken } = require('../middleware/auth');

// Public route (for contact form)
router.post('/', saveContactMessage);

// Protected routes (admin only)
router.get('/', authenticateToken, getAllContactMessages);
// Alternative explicit routes to avoid any potential route param conflicts
router.get('/item/:id', authenticateToken, getContactMessageById);
router.delete('/item/:id', authenticateToken, deleteContactMessage);
router.get('/:id', authenticateToken, getContactMessageById);
router.delete('/:id', authenticateToken, deleteContactMessage);
// Add to backend/routes/contactRoutes.js or create a new test route
router.get('/test-email', authenticateToken, async (req, res) => {
  try {
    const testEmail = process.env.ADMIN_EMAIL;
    
    if (!testEmail) {
      return res.json({ 
        success: false, 
        message: 'ADMIN_EMAIL not configured in .env' 
      });
    }
    
    // Test email sending
    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
    
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: testEmail,
      subject: '✅ Email Test - Dhananjayan Realty Website',
      text: 'This is a test email from your Dhananjayan Realty website. Email configuration is working correctly!'
    });
    
    res.json({ 
      success: true, 
      message: `Test email sent successfully to ${testEmail}` 
    });
    
  } catch (error) {
    res.json({ 
      success: false, 
      message: `Email test failed: ${error.message}` 
    });
  }
});
module.exports = router;