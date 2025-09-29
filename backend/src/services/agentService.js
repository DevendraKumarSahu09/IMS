const User = require('../models/User');
const UserPolicy = require('../models/UserPolicy');
const Claim = require('../models/Claim');

const getAllAgents = async () => {
  return await User.find({ role: { $in: ['agent', 'admin'] } }).select('-passwordHash');
};

const getAgentById = async (agentId) => {
  const agent = await User.findOne({ _id: agentId, role: { $in: ['agent', 'admin'] } }).select('-passwordHash');
  if (!agent) {
    throw new Error('Agent not found');
  }
  return agent;
};

const createAgent = async (agentData) => {
  // This function is now handled in the controller
  throw new Error('Use controller createAgent method instead');
};

const assignAgent = async (agentId, policyId, claimId) => {
  const agent = await User.findOne({ _id: agentId, role: { $in: ['agent', 'admin'] } });
  if (!agent) {
    throw new Error('Agent not found');
  }

  const result = {};

  if (policyId) {
    const userPolicy = await UserPolicy.findById(policyId);
    if (!userPolicy) {
      throw new Error('Policy not found');
    }
    userPolicy.assignedAgentId = agentId;
    await userPolicy.save();
    result.policy = userPolicy;
  }

  if (claimId) {
    const claim = await Claim.findById(claimId);
    if (!claim) {
      throw new Error('Claim not found');
    }
    claim.decidedByAgentId = agentId;
    await claim.save();
    result.claim = claim;
  }

  if (!policyId && !claimId) {
    throw new Error('Either policyId or claimId must be provided');
  }

  return result;
};

module.exports = {
  getAllAgents,
  getAgentById,
  createAgent,
  assignAgent
};
