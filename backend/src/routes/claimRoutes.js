const express = require('express');
const router = express.Router();
const authenticateJWT = require('../middlewares/authMiddleware');
const authorizeRoles = require('../middlewares/roleMiddleware');
const { validateClaimCreation, validateClaimStatusUpdate } = require('../middlewares/validationMiddleware');
const claimController = require('../controllers/claimController');

router.use(authenticateJWT);

router.get('/', authorizeRoles('admin', 'agent', 'customer'), claimController.getClaims);
router.get('/:id', authorizeRoles('admin', 'agent', 'customer'), claimController.getClaimById);
router.post('/', authorizeRoles('customer'), validateClaimCreation, claimController.createClaim);
router.put('/:id/status', authorizeRoles('agent', 'admin'), validateClaimStatusUpdate, claimController.updateClaimStatus);

module.exports = router;
