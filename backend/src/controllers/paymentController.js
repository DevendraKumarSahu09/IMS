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
    res.json({
      success: true,
      data: payments
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch payments' 
    });
  }
};

exports.getUserPayments = async (req, res) => {
  try {
    const payments = await Payment.find({ userId: req.user.id })
      .populate('userPolicyId')
      .sort({ createdAt: -1 });
    
    console.log('Backend: Found payments for user:', payments.length);
    console.log('Backend: Payment data:', JSON.stringify(payments, null, 2));
    
    res.json({
      success: true,
      data: payments
    });
  } catch (err) {
    console.error('Backend: Error fetching user payments:', err);
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
    
    res.json({
      success: true,
      data: payment
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch payment' });
  }
};

exports.createPayment = async (req, res) => {
  try {
    const { userPolicyId, amount, method, reference } = req.body;
    
    console.log('Create payment request:', {
      userId: req.user.id,
      userPolicyId,
      amount,
      method,
      reference
    });
    
    // Create payment with user ID
    const payment = new Payment({
      userId: req.user.id,
      userPolicyId: userPolicyId,
      amount,
      method,
      reference
    });
    
    const saved = await payment.save();
    await saved.populate('userPolicyId');
    
    console.log('Payment created successfully:', saved);
    res.status(201).json({
      success: true,
      data: saved
    });
  } catch (err) {
    console.error('Error creating payment:', err);
    res.status(400).json({ error: err.message });
  }
};
