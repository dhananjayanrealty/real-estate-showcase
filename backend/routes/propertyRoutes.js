const express = require('express');
const router = express.Router();

// Import controllers
const propertyController = require('../controllers/propertyController');
const { authenticateToken } = require('../middleware/auth');

// Public routes
router.get('/', propertyController.getAllProperties);
router.get('/:id', propertyController.getPropertyById);
router.get('/:id/media', authenticateToken, propertyController.getPropertyMedia);

// Protected routes
router.post('/', authenticateToken, propertyController.createProperty);
router.put('/:id', authenticateToken, propertyController.updateProperty);
router.delete('/:id', authenticateToken, propertyController.deleteProperty);

module.exports = router;