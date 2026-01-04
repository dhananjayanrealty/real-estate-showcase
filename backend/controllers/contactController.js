const { query, run, get } = require('../database/db');

// Save contact message (NO EMAIL AT ALL)
const saveContactMessage = async (req, res) => {
  try {
    const { name, phone, email, message } = req.body;
    
    console.log('📨 Contact form submitted:', { name, phone, email, message });
    
    // Validation
    if (!name || !phone || !message) {
      return res.status(400).json({ 
        success: false,
        error: 'Name, phone and message are required' 
      });
    }
    
    // Save to database
    const result = await run(
      'INSERT INTO contact_messages (name, phone, email, message) VALUES (?, ?, ?, ?)',
      [name, phone, email || null, message]
    );
    
    console.log('✅ Message saved to database. ID:', result.id);
    
    // Return success IMMEDIATELY (NO EMAIL CODE AT ALL)
    return res.json({
      success: true,
      message: 'Thank you for your message! We will contact you soon.',
      messageId: result.id
    });
    
  } catch (error) {
    console.error('❌ Error saving contact message:', error);
    return res.status(500).json({ 
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

module.exports = {
  saveContactMessage,
  getAllContactMessages,
  getContactMessageById,
  deleteContactMessage
};