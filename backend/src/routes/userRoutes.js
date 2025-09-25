const express = require('express');
const router = express.Router();
const authenticateJWT = require('../middlewares/authMiddleware');
const authorizeRoles = require('../middlewares/roleMiddleware');
const userController = require('../controllers/userController');

// All user routes require authentication
router.use(authenticateJWT);

// User-specific policy routes
router.get('/policies', authorizeRoles('customer'), userController.getUserPolicies);
router.put('/policies/:id/cancel', authorizeRoles('customer'), userController.cancelUserPolicy);

module.exports = router;
