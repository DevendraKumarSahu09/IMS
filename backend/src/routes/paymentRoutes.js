const express = require('express');
const router = express.Router();
const authenticateJWT = require('../middlewares/authMiddleware');
const authorizeRoles = require('../middlewares/roleMiddleware');
const { validatePaymentCreation } = require('../middlewares/validationMiddleware');
const paymentController = require('../controllers/paymentController');

router.use(authenticateJWT);

router.get('/', authorizeRoles('admin', 'agent', 'customer'), paymentController.getPayments);
router.get('/user', authorizeRoles('customer'), paymentController.getUserPayments);
router.get('/:id', authorizeRoles('admin', 'agent', 'customer'), paymentController.getPaymentById);
router.post('/', authorizeRoles('customer'), validatePaymentCreation, paymentController.createPayment);

module.exports = router;
