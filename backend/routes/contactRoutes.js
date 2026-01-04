const express = require('express');
const router = express.Router();
const {
  saveContactMessage,
  getAllContactMessages,
  getContactMessageById,
  deleteContactMessage
} = require('../controllers/contactController');

// Your frontend uses /item/:id, so update routes to match:
router.post('/', saveContactMessage);                    
router.get('/', getAllContactMessages);                  
router.get('/:id', getContactMessageById);          
router.delete('/:id', deleteContactMessage);        

module.exports = router;