const UserPolicy = require('../models/UserPolicy');

exports.getUserPolicies = async (req, res) => {
  try {
    const filter = {};
    if (req.user.role === 'customer') {
      filter.userId = req.user.id;
    }
    
    const userPolicies = await UserPolicy.find(filter)
      .populate('userId', 'name email')
      .populate('policyProductId')
      .populate('assignedAgentId', 'name email')
      .sort({ createdAt: -1 });
    
    res.json(userPolicies);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getUserPolicyById = async (req, res) => {
  try {
    const userPolicy = await UserPolicy.findById(req.params.id)
      .populate('userId', 'name email')
      .populate('policyProductId')
      .populate('assignedAgentId', 'name email');
    
    if (!userPolicy) {
      return res.status(404).json({ error: 'User policy not found' });
    }
    
    // Check if user has access to this policy
    if (req.user.role === 'customer' && userPolicy.userId._id.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    res.json(userPolicy);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createUserPolicy = async (req, res) => {
  try {
    const userPolicy = new UserPolicy(req.body);
    const savedUserPolicy = await userPolicy.save();
    await savedUserPolicy.populate('userId', 'name email');
    await savedUserPolicy.populate('policyProductId');
    res.status(201).json(savedUserPolicy);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.updateUserPolicy = async (req, res) => {
  try {
    const userPolicy = await UserPolicy.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('userId', 'name email')
      .populate('policyProductId')
      .populate('assignedAgentId', 'name email');
    
    if (!userPolicy) {
      return res.status(404).json({ error: 'User policy not found' });
    }
    
    res.json(userPolicy);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.deleteUserPolicy = async (req, res) => {
  try {
    const userPolicy = await UserPolicy.findByIdAndDelete(req.params.id);
    if (!userPolicy) {
      return res.status(404).json({ error: 'User policy not found' });
    }
    res.json({ message: 'User policy deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};