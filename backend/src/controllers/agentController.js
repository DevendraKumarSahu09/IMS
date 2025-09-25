const Agent = require('../models/Agent');
const UserPolicy = require('../models/UserPolicy');
const Claim = require('../models/Claim');

exports.getAgents = async (req, res) => {
  try {
    const agents = await Agent.find().populate('assignedPolicies');
    res.json(agents);
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to fetch agents' });
  }
};

exports.getAgentById = async (req, res) => {
  try {
    const agent = await Agent.findById(req.params.id).populate('assignedPolicies');
    if (!agent) return res.status(404).json({ error: 'Agent not found' });
    res.json(agent);
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to fetch agent' });
  }
};

exports.createAgent = async (req, res) => {
  try {
    const agent = new Agent(req.body);
    const saved = await agent.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.assignAgent = async (req, res) => {
  try {
    const { policyId, claimId } = req.body;
    const agentId = req.params.id;
    
    // Verify agent exists
    const agent = await Agent.findById(agentId);
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
