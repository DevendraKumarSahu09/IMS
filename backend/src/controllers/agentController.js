const User = require('../models/User');
const UserPolicy = require('../models/UserPolicy');
const Claim = require('../models/Claim');
const bcrypt = require('bcryptjs');

exports.getAgents = async (req, res) => {
  try {
    const agents = await User.find({ role: { $in: ['agent', 'admin'] } }).select('-passwordHash');
    res.json(agents);
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to fetch agents' });
  }
};

exports.getAgentById = async (req, res) => {
  try {
    const agent = await User.findOne({ _id: req.params.id, role: { $in: ['agent', 'admin'] } }).select('-passwordHash');
    if (!agent) return res.status(404).json({ error: 'Agent not found' });
    res.json(agent);
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to fetch agent' });
  }
};

exports.createAgent = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }
    
    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Create user with specified role
    const user = new User({ 
      name, 
      email, 
      passwordHash, 
      role: role || 'agent' 
    });
    
    const saved = await user.save();
    
    // Return user without password hash
    const { passwordHash: _, ...userResponse } = saved.toObject();
    res.status(201).json(userResponse);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.assignAgent = async (req, res) => {
  try {
    const { policyId, claimId } = req.body;
    const agentId = req.params.id;
    
    // Verify agent exists and has correct role
    const agent = await User.findOne({ _id: agentId, role: { $in: ['agent', 'admin'] } });
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }
    
    const result = {};
    
    // Assign to policy if policyId provided
    if (policyId) {
      const userPolicy = await UserPolicy.findById(policyId);
      if (!userPolicy) {
        return res.status(404).json({ error: 'Policy not found' });
      }
      
      userPolicy.assignedAgentId = agentId;
      await userPolicy.save();
      result.policy = userPolicy;
    }
    
    // Assign to claim if claimId provided
    if (claimId) {
      const claim = await Claim.findById(claimId);
      if (!claim) {
        return res.status(404).json({ error: 'Claim not found' });
      }
      
      claim.decidedByAgentId = agentId;
      await claim.save();
      result.claim = claim;
    }
    
    if (!policyId && !claimId) {
      return res.status(400).json({ error: 'Either policyId or claimId must be provided' });
    }
    
    res.json({ message: 'Agent assigned successfully', ...result });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to assign agent' });
  }
};
