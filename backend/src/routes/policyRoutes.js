const express = require('express');
const router = express.Router();
const authenticateJWT = require('../middlewares/authMiddleware');
const authorizeRoles = require('../middlewares/roleMiddleware');
const { validatePolicyPurchase } = require('../middlewares/validationMiddleware');
const policyController = require('../controllers/policyController');

// Public routes (no authentication required)
router.get('/', policyController.getPolicies);
router.get('/:id', policyController.getPolicyById);

// Protected routes
router.use(authenticateJWT);
router.post('/', authorizeRoles('admin'), policyController.createPolicy);
router.put('/:id', authorizeRoles('admin'), policyController.updatePolicy);
router.delete('/:id', authorizeRoles('admin'), policyController.deletePolicy);
router.post('/:id/purchase', authorizeRoles('customer'), validatePolicyPurchase, policyController.purchasePolicy);

module.exports = router;
