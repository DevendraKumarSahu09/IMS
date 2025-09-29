const express = require('express');
const router = express.Router();
const authenticateJWT = require('../middlewares/authMiddleware');
const authorizeRoles = require('../middlewares/roleMiddleware');
const { validateUserUpdate, validatePolicyCreation, validatePolicyUpdate, validateAgentCreation } = require('../middlewares/validationMiddleware');
const adminController = require('../controllers/adminController');

// All admin routes require authentication and admin role
router.use(authenticateJWT);
router.use(authorizeRoles('admin'));

// Audit and Summary
router.get('/audit', adminController.getAuditLogs);
router.get('/summary', adminController.getSummary);

// User Management
router.get('/users', adminController.getAllUsers);
router.post('/users', validateAgentCreation, adminController.createUser);
router.get('/users/:id', adminController.getUserById);
router.put('/users/:id', validateUserUpdate, adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);

// Policy Product Management
router.get('/policies', adminController.getAllPolicies);
router.post('/policies', validatePolicyCreation, adminController.createPolicy);
router.put('/policies/:id', validatePolicyUpdate, adminController.updatePolicy);
router.delete('/policies/:id', adminController.deletePolicy);

// Claim Assignment Management
router.get('/claims/unassigned', adminController.getUnassignedClaims);
router.post('/claims/assign', adminController.assignClaimToAgent);
router.get('/agents/:agentId/claims', adminController.getAgentClaims);

module.exports = router;
