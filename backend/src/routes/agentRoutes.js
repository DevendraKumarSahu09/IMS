const express = require('express');
const router = express.Router();
const authenticateJWT = require('../middlewares/authMiddleware');
const authorizeRoles = require('../middlewares/roleMiddleware');
const agentController = require('../controllers/agentController');

router.use(authenticateJWT);

router.get('/', authorizeRoles('admin'), agentController.getAgents);
router.get('/:id', authorizeRoles('admin'), agentController.getAgentById);
router.post('/', authorizeRoles('admin'), agentController.createAgent);
router.put('/:id/assign', authorizeRoles('admin'), agentController.assignAgent);

module.exports = router;
