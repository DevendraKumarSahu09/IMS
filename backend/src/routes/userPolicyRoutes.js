const express = require('express');
const router = express.Router();
const authenticateJWT = require('../middlewares/authMiddleware');
const authorizeRoles = require('../middlewares/roleMiddleware');
const userPolicyController = require('../controllers/userPolicyController');

router.use(authenticateJWT);

router.get('/', authorizeRoles('admin', 'agent', 'customer'), userPolicyController.getUserPolicies);
router.get('/:id', authorizeRoles('admin', 'agent', 'customer'), userPolicyController.getUserPolicyById);
router.post('/', authorizeRoles('admin'), userPolicyController.createUserPolicy);
router.put('/:id', authorizeRoles('admin', 'agent'), userPolicyController.updateUserPolicy);
router.delete('/:id', authorizeRoles('admin'), userPolicyController.deleteUserPolicy);

module.exports = router;