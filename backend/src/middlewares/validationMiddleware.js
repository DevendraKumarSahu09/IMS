const { body, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

// Policy purchase validation
const validatePolicyPurchase = [
  body('startDate').isISO8601().withMessage('Start date must be a valid date'),
  body('termMonths').isInt({ min: 1, max: 120 }).withMessage('Term months must be between 1 and 120'),
  body('nominee.name').notEmpty().withMessage('Nominee name is required'),
  body('nominee.relation').notEmpty().withMessage('Nominee relation is required'),
  handleValidationErrors
];

// Claim creation validation
const validateClaimCreation = [
  body('policyId').isMongoId().withMessage('Valid policy ID is required'),
  body('incidentDate').isISO8601().withMessage('Incident date must be a valid date'),
  body('description').notEmpty().withMessage('Description is required'),
  body('amount').isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
  handleValidationErrors
];

// Payment creation validation
const validatePaymentCreation = [
  body('policyId').isMongoId().withMessage('Valid policy ID is required'),
  body('amount').isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
  body('method').isIn(['CARD', 'NETBANKING', 'OFFLINE', 'SIMULATED']).withMessage('Invalid payment method'),
  body('reference').notEmpty().withMessage('Payment reference is required'),
  handleValidationErrors
];

// Claim status update validation
const validateClaimStatusUpdate = [
  body('status').isIn(['PENDING', 'APPROVED', 'REJECTED']).withMessage('Invalid status value'),
  body('notes').optional().isString(),
  handleValidationErrors
];

module.exports = {
  validatePolicyPurchase,
  validateClaimCreation,
  validatePaymentCreation,
  validateClaimStatusUpdate,
  handleValidationErrors
};
