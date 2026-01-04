const express = require('express');
const router = express.Router();
const {
  saveContactMessage,
  getAllContactMessages,
  getContactMessageById,
  deleteContactMessage
} = require('../controllers/contactController');

router.post('/', saveContactMessage);
router.get('/', getAllContactMessages);
router.get('/:id', getContactMessageById);
router.delete('/:id', deleteContactMessage);

module.exports = router;