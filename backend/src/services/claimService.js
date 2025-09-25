const Claim = require('../models/Claim');
const UserPolicy = require('../models/UserPolicy');

/**
 * Claim Service - Business logic for claim operations
 * This service handles all business logic related to claims
 */

class ClaimService {
  /**
   * Get claims with role-based filtering
   * @param {string} userId - The user ID
   * @param {string} userRole - The user role
   * @returns {Promise<Array>} Array of claims
   */
  async getClaims(userId, userRole) {
    try {
      const filter = {};
      if (userRole === 'customer') {
        filter.userId = userId;
      }

      return await Claim.find(filter)
        .populate('userPolicyId')
        .populate('userId', 'name email')
        .populate('decidedByAgentId', 'name email')
        .sort({ createdAt: -1 });
    } catch (error) {
      throw new Error(`Failed to fetch claims: ${error.message}`);
    }
  }

  /**
   * Get a specific claim by ID with authorization check
   * @param {string} claimId - The claim ID
   * @param {string} userId - The user ID
   * @param {string} userRole - The user role
   * @returns {Promise<Object>} Claim object
   */
  async getClaimById(claimId, userId, userRole) {
    try {
      const claim = await Claim.findById(claimId)
        .populate('userPolicyId')
        .populate('userId', 'name email')
        .populate('decidedByAgentId', 'name email');

      if (!claim) {
        throw new Error('Claim not found');
      }

      // Check authorization
      if (userRole === 'customer' && claim.userId._id.toString() !== userId) {
        throw new Error('Access denied: You do not have access to this claim');
      }

      return claim;
    } catch (error) {
      if (error.message === 'Claim not found' || error.message === 'Access denied: You do not have access to this claim') {
        throw error; // Re-throw the original error
      }
      throw new Error(`Failed to fetch claim: ${error.message}`);
    }
  }

  /**
   * Create a new claim
   * @param {string} userId - The user ID
   * @param {Object} claimData - Claim data
   * @returns {Promise<Object>} Created claim
   */
  async createClaim(userId, claimData) {
    try {
      const { userPolicyId, incidentDate, description, amountClaimed } = claimData;

      // Validate that the user owns the policy
      const userPolicy = await UserPolicy.findOne({
        _id: userPolicyId,
        userId: userId,
        status: 'ACTIVE'
      });

      if (!userPolicy) {
        throw new Error('Policy not found or not active');
      }

      // Validate incident date is not in the future
      const incident = new Date(incidentDate);
      if (incident > new Date()) {
        throw new Error('Incident date cannot be in the future');
      }

      // Validate claim amount
      if (amountClaimed <= 0) {
        throw new Error('Claim amount must be positive');
      }

      const claim = new Claim({
        userId,
        userPolicyId,
        incidentDate,
        description,
        amountClaimed
      });

      const saved = await claim.save();
      await saved.populate('userPolicyId');

      return saved;
    } catch (error) {
      throw new Error(`Failed to create claim: ${error.message}`);
    }
  }

  /**
   * Update claim status (Agent/Admin only)
   * @param {string} claimId - The claim ID
   * @param {string} agentId - The agent ID making the decision
   * @param {Object} updateData - Update data
   * @returns {Promise<Object>} Updated claim
   */
  async updateClaimStatus(claimId, agentId, updateData) {
    try {
      const { status, notes } = updateData;

      // Validate status
      if (!['PENDING', 'APPROVED', 'REJECTED'].includes(status)) {
        throw new Error('Invalid status value');
      }

      // First check if claim exists and is pending
      const existingClaim = await Claim.findById(claimId);
      if (!existingClaim) {
        throw new Error('Claim not found');
      }

      // Check if claim is already processed
      if (existingClaim.status !== 'PENDING') {
        throw new Error('Claim has already been processed');
      }

      // Use findByIdAndUpdate to avoid full document validation
      const updatedClaim = await Claim.findByIdAndUpdate(
        claimId,
        {
          status: status,
          decisionNotes: notes,
          decidedByAgentId: agentId
        },
        { new: true, runValidators: false } // Don't run validators on the entire document
      ).populate('decidedByAgentId', 'name email');

      return updatedClaim;
    } catch (error) {
      if (error.message === 'Invalid status value' || error.message === 'Claim not found' || error.message === 'Claim has already been processed') {
        throw error; // Re-throw the original error
      }
      throw new Error(`Failed to update claim status: ${error.message}`);
    }
  }

  /**
   * Get claims assigned to a specific agent
   * @param {string} agentId - The agent ID
   * @returns {Promise<Array>} Array of assigned claims
   */
  async getAgentClaims(agentId) {
    try {
      return await Claim.find({ decidedByAgentId: agentId })
        .populate('userPolicyId')
        .populate('userId', 'name email')
        .sort({ createdAt: -1 });
    } catch (error) {
      throw new Error(`Failed to fetch agent claims: ${error.message}`);
    }
  }
}

module.exports = new ClaimService();
