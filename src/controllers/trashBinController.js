const trashBinService = require('../services/trashBinService');

// Search trash bins
const searchTrashBins = async (req, res, next) => {
  try {
    const {
      lat,
      lng,
      radius = 500,
      trash_types: trashTypes,
      facility_types: facilityTypes,
      min_quality_score: minQualityScore,
      limit = 50
    } = req.query;

    // Validate required parameters
    if (!lat || !lng) {
      return res.status(400).json({
        status: 'error',
        message: 'Latitude and longitude are required',
        timestamp: new Date().toISOString()
      });
    }

    const searchParams = {
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      radius: parseInt(radius, 10),
      trashTypes: trashTypes ? trashTypes.split(',') : null,
      facilityTypes: facilityTypes ? facilityTypes.split(',') : null,
      minQualityScore: minQualityScore ? parseFloat(minQualityScore) : null,
      limit: parseInt(limit, 10)
    };

    const results = await trashBinService.searchNearbyTrashBins(searchParams);

    return res.json({
      status: 'success',
      data: {
        count: results.length,
        radius: searchParams.radius,
        center: { lat: searchParams.lat, lng: searchParams.lng },
        trash_bins: results
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return next(error);
  }
};

// Get trash bin by ID
const getTrashBinById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const trashBin = await trashBinService.getTrashBinById(id);

    if (!trashBin) {
      return res.status(404).json({
        status: 'error',
        message: 'Trash bin not found',
        timestamp: new Date().toISOString()
      });
    }

    return res.json({
      status: 'success',
      data: trashBin,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return next(error);
  }
};

// Submit user feedback
const submitFeedback = async (req, res, next) => {
  try {
    // Handle image file if uploaded
    let imageUrl = null;
    if (req.file) {
      // For now, we'll store the image path. In production, you'd upload to cloud storage
      imageUrl = `/uploads/${req.file.filename}`;
    }

    const feedbackData = {
      trashBinId: req.body.trash_bin_id,
      feedbackType: req.body.feedback_type,
      feedbackContent: req.body.feedback_content,
      userLocation: req.body.user_lat && req.body.user_lng ? {
        lat: parseFloat(req.body.user_lat),
        lng: parseFloat(req.body.user_lng)
      } : null,
      imageUrl: imageUrl
    };

    const feedback = await trashBinService.submitUserFeedback(feedbackData);

    // Broadcast update if feedback affects trash bin status
    if (req.app.locals.broadcastUpdate) {
      req.app.locals.broadcastUpdate('feedback_submitted', {
        trash_bin_id: feedbackData.trashBinId,
        feedback_type: feedbackData.feedbackType
      });
    }

    res.status(201).json({
      status: 'success',
      message: 'Feedback submitted successfully',
      data: { feedback_id: feedback.id },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

// Get trash bins by area
const getTrashBinsByArea = async (req, res, next) => {
  try {
    const { areaId } = req.params;
    const { trash_types: trashTypes, facility_types: facilityTypes } = req.query;

    const filters = {
      trashTypes: trashTypes ? trashTypes.split(',') : null,
      facilityTypes: facilityTypes ? facilityTypes.split(',') : null
    };

    const trashBins = await trashBinService.getTrashBinsByArea(areaId, filters);

    return res.json({
      status: 'success',
      data: {
        area_id: areaId,
        count: trashBins.length,
        trash_bins: trashBins
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  searchTrashBins,
  getTrashBinById,
  submitFeedback,
  getTrashBinsByArea
};
