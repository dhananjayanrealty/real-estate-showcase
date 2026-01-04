const { query, run, get } = require('../database/db');
const nodemailer = require('nodemailer');

// Save contact message and send email TO admin
const saveContactMessage = async (req, res) => {
  try {
    const { name, phone, email, message } = req.body;
    
    console.log('Contact form submitted:', { name, phone, email, message });
    
    if (!name || !phone || !message) {
      return res.status(400).json({ error: 'Name, phone and message are required' });
    }
    
    // Save to database
    const result = await run(
      'INSERT INTO contact_messages (name, phone, email, message) VALUES (?, ?, ?, ?)',
      [name, phone, email || null, message]
    );
    
    console.log('Message saved to database with ID:', result.id);
    
    // Send email TO admin if configured
    let emailSent = false;
    let emailError = null;
    
    if (process.env.ADMIN_EMAIL) {
      try {
        await sendEmailToAdmin(name, phone, email, message);
        emailSent = true;
        console.log(`✅ Email sent TO admin: ${process.env.ADMIN_EMAIL}`);
      } catch (error) {
        emailError = error.message;
        console.error('❌ Failed to send email to admin:', error);
      }
    } else {
      console.log('⚠️ ADMIN_EMAIL not configured, skipping email');
    }
    
    res.json({
      success: true,
      message: 'Thank you for your message! We will contact you soon.',
      emailSent: emailSent,
      emailError: emailError,
      messageId: result.id
    });
    
  } catch (error) {
    console.error('Error saving contact message:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to save message. Please try again later.' 
    });
  }
};

// Get all contact messages (admin only)
const getAllContactMessages = async (req, res) => {
  try {
    const messages = await query(
      'SELECT * FROM contact_messages ORDER BY created_at DESC'
    );
    
    res.json(messages);
    
  } catch (error) {
    console.error('Error getting contact messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
};

// Get single contact message
const getContactMessageById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const message = await get('SELECT * FROM contact_messages WHERE id = ?', [id]);
    
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }
    
    res.json(message);
    
  } catch (error) {
    console.error('Error getting contact message:', error);
    res.status(500).json({ error: 'Failed to fetch message' });
  }
};

// Delete contact message
const deleteContactMessage = async (req, res) => {
  try {
    const { id } = req.params;
    
    await run('DELETE FROM contact_messages WHERE id = ?', [id]);
    
    res.json({ message: 'Message deleted successfully' });
    
  } catch (error) {
    console.error('Error deleting contact message:', error);
    res.status(500).json({ error: 'Failed to delete message' });
  }
};

// Send email TO admin with user's message
const sendEmailToAdmin = async (name, phone, email, message) => {
  if (!process.env.ADMIN_EMAIL) {
    throw new Error('ADMIN_EMAIL not configured');
  }
  
  // Configure email service
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
  
  // Email content for admin
  const mailOptions = {
    from: process.env.SMTP_FROM || `"Dhananjayan Realty Website" <${process.env.SMTP_USER}>`,
    to: process.env.ADMIN_EMAIL, // Send TO admin
    subject: `📧 New Contact Message: ${name} - Dhananjayan Realty Website`,
    // If visitor provided an email, set Reply-To so admin can reply directly
    replyTo: email || process.env.SMTP_FROM || process.env.SMTP_USER,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2c3e50; color: white; padding: 20px; text-align: center; }
          .content { background: #f9f9f9; padding: 20px; border-radius: 5px; }
          .field { margin-bottom: 15px; }
          .field-label { font-weight: bold; color: #2c3e50; }
          .message-box { background: white; padding: 15px; border-left: 4px solid #3498db; margin: 15px 0; }
          .footer { text-align: center; margin-top: 20px; color: #7f8c8d; font-size: 12px; }
          .action-btn { display: inline-block; background: #3498db; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📬 New Contact Message</h1>
            <p>Dhananjayan Realty Website</p>
          </div>
          
          <div class="content">
            <p>A visitor has submitted a contact form on your website.</p>
            
            <div class="field">
              <div class="field-label">👤 Name:</div>
              <div>${name}</div>
            </div>
            
            <div class="field">
              <div class="field-label">📞 Phone:</div>
              <div><a href="tel:${phone}">${phone}</a></div>
            </div>
            
            <div class="field">
              <div class="field-label">📧 Email:</div>
              <div>${email ? `<a href="mailto:${email}">${email}</a>` : 'Not provided'}</div>
            </div>
            
            <div class="field">
              <div class="field-label">💬 Message:</div>
              <div class="message-box">${message.replace(/\n/g, '<br>')}</div>
            </div>
            
            <div class="field">
              <div class="field-label">⏰ Received:</div>
              <div>${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} (IST)</div>
            </div>
            
            <hr>
            
            <p><strong>Quick Actions:</strong></p>
            <p>
              <a href="tel:${phone}" class="action-btn">📞 Call Back</a>
              ${email ? `<a href="mailto:${email}" class="action-btn" style="background: #27ae60; margin-left: 10px;">📧 Reply via Email</a>` : ''}
            </p>
            
            <p style="margin-top: 20px;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin-login.html" 
                 style="color: #3498db; text-decoration: none;">
                🔐 View all messages in Admin Panel
              </a>
            </p>
          </div>
          
          <div class="footer">
            <p>This email was sent automatically from your Dhananjayan Realty website.</p>
            <p>© ${new Date().getFullYear()} Dhananjayan Realty. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
New Contact Message - Dhananjayan Realty Website

Name: ${name}
Phone: ${phone}
Email: ${email || 'Not provided'}
Message: ${message}

Received: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} (IST)

---
This message was submitted via your website contact form.
    `
  };
  
  // Send email
  const info = await transporter.sendMail(mailOptions);
  console.log('Email sent to admin:', info.messageId);
  
  return info;
};

module.exports = {
  saveContactMessage,
  getAllContactMessages,
  getContactMessageById,
  deleteContactMessage
};