const Payment = require('../models/Payment');

exports.getPayments = async (req, res) => {
  try {
    const filter = {};
    if (req.user.role === 'customer') {
      filter.userId = req.user.id;
    }
    const payments = await Payment.find(filter)
      .populate('userPolicyId')
      .populate('userId', 'name email');
    res.json(payments);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
};

exports.getUserPayments = async (req, res) => {
  try {
    const payments = await Payment.find({ userId: req.user.id })
      .populate('userPolicyId')
      .sort({ createdAt: -1 });
    res.json(payments);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user payments' });
  }
};

exports.getPaymentById = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('userPolicyId')
      .populate('userId', 'name email');
    if (!payment) return res.status(404).json({ error: 'Payment not found' });
    
    // Check if user can access this payment
    if (req.user.role === 'customer' && payment.userId._id.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    res.json(payment);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch payment' });
  }
};

exports.createPayment = async (req, res) => {
  try {
    const { policyId, amount, method, reference } = req.body;
    
    // Create payment with user ID
    const payment = new Payment({
      userId: req.user.id,
      userPolicyId: policyId,
      amount,
      method,
      reference
    });
    
    const saved = await payment.save();
    await saved.populate('userPolicyId');
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
