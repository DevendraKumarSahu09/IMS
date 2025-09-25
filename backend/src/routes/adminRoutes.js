const express = require('express');
const router = express.Router();
const authenticateJWT = require('../middlewares/authMiddleware');
const authorizeRoles = require('../middlewares/roleMiddleware');
const adminController = require('../controllers/adminController');

// All admin routes require authentication and admin role
router.use(authenticateJWT);
router.use(authorizeRoles('admin'));

router.get('/audit', adminController.getAuditLogs);
router.get('/summary', adminController.getSummary);

module.exports = router;
