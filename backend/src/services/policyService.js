const Policy = require('../models/Policy');
const UserPolicy = require('../models/UserPolicy');

/**
 * Policy Service - Business logic for policy operations
 * This service handles all business logic related to policies
 */

class PolicyService {
  /**
   * Get all available policy products
   * @returns {Promise<Array>} Array of policy products
   */
  async getAllPolicies() {
    try {
      return await Policy.find().sort({ createdAt: -1 });
    } catch (error) {
      throw new Error(`Failed to fetch policies: ${error.message}`);
    }
  }

  /**
   * Get a specific policy by ID
   * @param {string} policyId - The policy ID
   * @returns {Promise<Object>} Policy object
   */
  async getPolicyById(policyId) {
    try {
      const policy = await Policy.findById(policyId);
      if (!policy) {
        throw new Error('Policy not found');
      }
      return policy;
    } catch (error) {
      if (error.message === 'Policy not found') {
        throw error; // Re-throw the original error
      }
      throw new Error(`Failed to fetch policy: ${error.message}`);
    }
  }

  /**
   * Create a new policy product (Admin only)
   * @param {Object} policyData - Policy data
   * @returns {Promise<Object>} Created policy
   */
  async createPolicy(policyData) {
    try {
      // Check if policy code already exists
      const existingPolicy = await Policy.findOne({ code: policyData.code });
      if (existingPolicy) {
        throw new Error('Policy code already exists');
      }

      const policy = new Policy(policyData);
      return await policy.save();
    } catch (error) {
      throw new Error(`Failed to create policy: ${error.message}`);
    }
  }

  /**
   * Update a policy product (Admin only)
   * @param {string} policyId - The policy ID
   * @param {Object} updateData - Updated policy data
   * @returns {Promise<Object>} Updated policy
   */
  async updatePolicy(policyId, updateData) {
    try {
      // Check if policy exists
      const policy = await Policy.findById(policyId);
      if (!policy) {
        throw new Error('Policy not found');
      }

      // If updating code, check if new code already exists
      if (updateData.code && updateData.code !== policy.code) {
        const existingPolicy = await Policy.findOne({ code: updateData.code });
        if (existingPolicy) {
          throw new Error('Policy code already exists');
        }
      }

      const updatedPolicy = await Policy.findByIdAndUpdate(
        policyId,
        updateData,
        { new: true, runValidators: true }
      );

      return updatedPolicy;
    } catch (error) {
      throw new Error(`Failed to update policy: ${error.message}`);
    }
  }

  /**
   * Delete a policy product (Admin only)
   * @param {string} policyId - The policy ID
   * @returns {Promise<Object>} Deleted policy
   */
  async deletePolicy(policyId) {
    try {
      // Check if policy exists
      const policy = await Policy.findById(policyId);
      if (!policy) {
        throw new Error('Policy not found');
      }

      // Check if policy has active user policies
      const activeUserPolicies = await UserPolicy.countDocuments({
        policyProductId: policyId,
        status: 'ACTIVE'
      });

      if (activeUserPolicies > 0) {
        throw new Error('Cannot delete policy with active user policies');
      }

      await Policy.findByIdAndDelete(policyId);
      return policy;
    } catch (error) {
      throw new Error(`Failed to delete policy: ${error.message}`);
    }
  }

  /**
   * Purchase a policy for a user
   * @param {string} policyId - The policy ID to purchase
   * @param {string} userId - The user ID purchasing the policy
   * @param {Object} purchaseData - Purchase details
   * @returns {Promise<Object>} Created user policy
   */
  async purchasePolicy(policyId, userId, purchaseData) {
    try {
      const { startDate, termMonths, nominee } = purchaseData;

      // Get the policy product
      const policy = await this.getPolicyById(policyId);

      // Validate nominee data
      if (!nominee.name || !nominee.relation) {
        throw new Error('Nominee name and relation are required');
      }

      // Calculate end date
      const start = new Date(startDate);
      const endDate = new Date(start);
      endDate.setMonth(endDate.getMonth() + termMonths);

      // Check if user already has this policy
      const existingUserPolicy = await UserPolicy.findOne({
        userId,
        policyProductId: policyId,
        status: 'ACTIVE'
      });

      if (existingUserPolicy) {
        throw new Error('User already has an active policy of this type');
      }

      // Create user policy
      const userPolicy = new UserPolicy({
        userId,
        policyProductId: policyId,
        startDate: start,
        endDate: endDate,
        premiumPaid: policy.premium,
        nominee: nominee
      });

      const savedUserPolicy = await userPolicy.save();
      await savedUserPolicy.populate('policyProductId');

      return savedUserPolicy;
    } catch (error) {
      throw new Error(`Failed to purchase policy: ${error.message}`);
    }
  }

  /**
   * Get policies for a specific user
   * @param {string} userId - The user ID
   * @returns {Promise<Array>} Array of user policies
   */
  async getUserPolicies(userId) {
    try {
      return await UserPolicy.find({ userId })
        .populate('policyProductId')
        .populate('assignedAgentId', 'name email')
        .sort({ createdAt: -1 });
    } catch (error) {
      throw new Error(`Failed to fetch user policies: ${error.message}`);
    }
  }

  /**
   * Cancel a user policy
   * @param {string} userPolicyId - The user policy ID
   * @param {string} userId - The user ID (for authorization)
   * @returns {Promise<Object>} Updated user policy
   */
  async cancelUserPolicy(userPolicyId, userId) {
    try {
      const userPolicy = await UserPolicy.findOne({
        _id: userPolicyId,
        userId: userId
      });

      if (!userPolicy) {
        throw new Error('User policy not found');
      }

      if (userPolicy.status === 'CANCELLED') {
        throw new Error('Policy is already cancelled');
      }

      if (userPolicy.status === 'EXPIRED') {
        throw new Error('Cannot cancel expired policy');
      }

      userPolicy.status = 'CANCELLED';
      await userPolicy.save();

      return userPolicy;
    } catch (error) {
      throw new Error(`Failed to cancel policy: ${error.message}`);
    }
  }
}

module.exports = new PolicyService();
