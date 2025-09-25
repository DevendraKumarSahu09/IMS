const Agent = require('../models/Agent');
const UserPolicy = require('../models/UserPolicy');
const Claim = require('../models/Claim');

const getAllAgents = async () => {
  return await Agent.find().populate('assignedPolicies');
};

const getAgentById = async (agentId) => {
  const agent = await Agent.findById(agentId).populate('assignedPolicies');
  if (!agent) {
    throw new Error('Agent not found');
  }
  return agent;
};

const createAgent = async (agentData) => {
  const agent = new Agent(agentData);
  return await agent.save();
};

const assignAgent = async (agentId, policyId, claimId) => {
  const agent = await Agent.findById(agentId);
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
