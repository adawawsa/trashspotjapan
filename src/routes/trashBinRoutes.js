const express = require('express');

const router = express.Router();
const trashBinController = require('../controllers/trashBinController');
const { validateSearchQuery, validateFeedback } = require('../middleware/validation');

// Search trash bins
router.get('/search', validateSearchQuery, trashBinController.searchTrashBins);

// Get trash bin by ID
router.get('/:id', trashBinController.getTrashBinById);

// Submit user feedback
router.post('/feedback', validateFeedback, trashBinController.submitFeedback);

// Get trash bins by area (for map view)
router.get('/area/:areaId', trashBinController.getTrashBinsByArea);

module.exports = router;
