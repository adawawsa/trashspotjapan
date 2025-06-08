const express = require('express');
const router = express.Router();
const areaController = require('../controllers/areaController');

// Get all areas
router.get('/', areaController.getAllAreas);

// Get area by ID
router.get('/:id', areaController.getAreaById);

// Get trash bins in area
router.get('/:id/trash-bins', areaController.getTrashBinsInArea);

module.exports = router;