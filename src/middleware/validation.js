const { body, query, param, validationResult } = require('express-validator');

// Validation middleware wrapper
const validate = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    res.status(400).json({
      status: 'error',
      message: 'Validation failed',
      errors: errors.array(),
      timestamp: new Date().toISOString()
    });
  };
};

// Search query validation
const validateSearchQuery = validate([
  query('lat')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),
  query('lng')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),
  query('radius')
    .optional()
    .isInt({ min: 100, max: 5000 })
    .withMessage('Radius must be between 100 and 5000 meters'),
  query('trash_types')
    .optional()
    .isString()
    .withMessage('Trash types must be a string'),
  query('facility_types')
    .optional()
    .isString()
    .withMessage('Facility types must be a string'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
]);

// Feedback validation
const validateFeedback = validate([
  body('trash_bin_id')
    .isUUID()
    .withMessage('Invalid trash bin ID'),
  body('feedback_type')
    .isIn(['incorrect_location', 'removed', 'closed', 'wrong_info', 'other'])
    .withMessage('Invalid feedback type'),
  body('feedback_content')
    .optional()
    .isString()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Feedback content must be between 1 and 1000 characters'),
  body('user_lat')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('User latitude must be between -90 and 90'),
  body('user_lng')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('User longitude must be between -180 and 180'),
]);

// UUID param validation
const validateUUID = (paramName) => {
  return validate([
    param(paramName)
      .isUUID()
      .withMessage(`Invalid ${paramName}`)
  ]);
};

module.exports = {
  validate,
  validateSearchQuery,
  validateFeedback,
  validateUUID
};