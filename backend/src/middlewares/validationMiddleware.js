const { body, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('Validation errors:', errors.array());
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
  body('userPolicyId').isMongoId().withMessage('Valid user policy ID is required'),
  body('incidentDate').isDate().withMessage('Incident date must be a valid date'),
  body('description').notEmpty().withMessage('Description is required'),
  body('amountClaimed').isNumeric().withMessage('Amount must be a number').custom((value) => {
    const num = parseFloat(value);
    if (isNaN(num) || num < 0) {
      throw new Error('Amount must be a positive number');
    }
    return true;
  }),
  (req, res, next) => {
    console.log('Validation middleware - request body:', req.body);
    console.log('Validation middleware - userPolicyId:', req.body.userPolicyId);
    console.log('Validation middleware - incidentDate:', req.body.incidentDate);
    console.log('Validation middleware - amountClaimed:', req.body.amountClaimed);
    console.log('Validation middleware - description:', req.body.description);
    next();
  },
  handleValidationErrors
];

// Payment creation validation
const validatePaymentCreation = [
  body('userPolicyId').isMongoId().withMessage('Valid user policy ID is required'),
  body('amount').isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
  body('method').isIn(['CARD', 'NETBANKING', 'OFFLINE', 'SIMULATED']).withMessage('Invalid payment method'),
  body('reference').notEmpty().withMessage('Payment reference is required'),
  (req, res, next) => {
    console.log('Payment validation middleware - request body:', req.body);
    console.log('Payment validation middleware - userPolicyId:', req.body.userPolicyId);
    console.log('Payment validation middleware - amount:', req.body.amount);
    console.log('Payment validation middleware - method:', req.body.method);
    console.log('Payment validation middleware - reference:', req.body.reference);
    next();
  },
  handleValidationErrors
];

// Claim status update validation
const validateClaimStatusUpdate = [
  body('status').isIn(['PENDING', 'APPROVED', 'REJECTED']).withMessage('Invalid status value'),
  body('notes').optional().isString(),
  handleValidationErrors
];

// Agent creation validation
const validateAgentCreation = [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  body('role').optional().isIn(['agent', 'admin']).withMessage('Role must be either agent or admin'),
  handleValidationErrors
];

// User update validation
const validateUserUpdate = [
  body('name').optional().notEmpty().withMessage('Name cannot be empty'),
  body('email').optional().isEmail().withMessage('Valid email is required'),
  body('role').optional().isIn(['customer', 'agent', 'admin']).withMessage('Invalid role'),
  body('status').optional().isIn(['active', 'inactive']).withMessage('Invalid status'),
  handleValidationErrors
];

// Policy creation validation
const validatePolicyCreation = [
  body('code').notEmpty().withMessage('Policy code is required'),
  body('title').notEmpty().withMessage('Policy title is required'),
  body('description').notEmpty().withMessage('Policy description is required'),
  body('premium').isFloat({ min: 0 }).withMessage('Premium must be a positive number'),
  body('termMonths').isInt({ min: 1 }).withMessage('Term months must be a positive integer'),
  body('minSumInsured').isFloat({ min: 0 }).withMessage('Minimum sum insured must be a positive number'),
  handleValidationErrors
];

// Policy update validation
const validatePolicyUpdate = [
  body('code').optional().notEmpty().withMessage('Policy code cannot be empty'),
  body('title').optional().notEmpty().withMessage('Policy title cannot be empty'),
  body('description').optional().notEmpty().withMessage('Policy description cannot be empty'),
  body('premium').optional().isFloat({ min: 0 }).withMessage('Premium must be a positive number'),
  body('termMonths').optional().isInt({ min: 1 }).withMessage('Term months must be a positive integer'),
  body('minSumInsured').optional().isFloat({ min: 0 }).withMessage('Minimum sum insured must be a positive number'),
  handleValidationErrors
];

module.exports = {
  validatePolicyPurchase,
  validateClaimCreation,
  validatePaymentCreation,
  validateClaimStatusUpdate,
  validateAgentCreation,
  validateUserUpdate,
  validatePolicyCreation,
  validatePolicyUpdate,
  handleValidationErrors
};
