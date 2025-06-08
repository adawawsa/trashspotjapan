const areaService = require('../services/areaService');
const trashBinService = require('../services/trashBinService');

// Get all areas
const getAllAreas = async (req, res, next) => {
  try {
    const areas = await areaService.getAllAreas();

    res.json({
      status: 'success',
      data: {
        count: areas.length,
        areas
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

// Get area by ID
const getAreaById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const area = await areaService.getAreaById(id);

    if (!area) {
      return res.status(404).json({
        status: 'error',
        message: 'Area not found',
        timestamp: new Date().toISOString()
      });
    }

    return res.json({
      status: 'success',
      data: area,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return next(error);
  }
};

// Get trash bins in area
const getTrashBinsInArea = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { trash_types: trashTypes, facility_types: facilityTypes } = req.query;

    const filters = {
      trashTypes: trashTypes ? trashTypes.split(',') : null,
      facilityTypes: facilityTypes ? facilityTypes.split(',') : null
    };

    const trashBins = await trashBinService.getTrashBinsByArea(id, filters);

    res.json({
      status: 'success',
      data: {
        area_id: id,
        count: trashBins.length,
        trash_bins: trashBins
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllAreas,
  getAreaById,
  getTrashBinsInArea
};
