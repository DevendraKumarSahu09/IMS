const express = require('express');
const router = express.Router();
const authenticateJWT = require('../middlewares/authMiddleware');
const authorizeRoles = require('../middlewares/roleMiddleware');
const auditController = require('../controllers/auditController');

router.use(authenticateJWT);

router.get('/', authorizeRoles('admin'), auditController.getAuditLogs);
router.get('/:id', authorizeRoles('admin'), auditController.getAuditLogById);

module.exports = router;