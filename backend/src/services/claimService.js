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
      } else if (userRole === 'agent') {
        // Agents only see claims assigned to them
        filter.assignedAgentId = userId;
      }
      // Admins see all claims (no filter)

      return await Claim.find(filter)
        .populate({
          path: 'userPolicyId',
          populate: {
            path: 'policyProductId',
            select: 'title code'
          }
        })
        .populate('userId', 'name email')
        .populate('assignedAgentId', 'name email')
        .populate('decidedByAgentId', 'name email')
        .sort({ createdAt: -1 });
    } catch (error) {
      throw new Error(`Failed to fetch claims: ${error.message}`);
    }
  }

  /**
   * Get claims with advanced filtering and pagination
   * @param {string} userId - The user ID
   * @param {string} userRole - The user role
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} Object with claims and pagination info
   */
  async getClaimsWithFilters(userId, userRole, filters) {
    try {
      const { page, limit, status, dateFrom, dateTo, amountMin, amountMax, search } = filters;
      console.log('Search filter received:', search);
      
      // Build base filter
      const filter = {};
      if (userRole === 'customer') {
        filter.userId = userId;
      } else if (userRole === 'agent') {
        filter.assignedAgentId = userId;
      }
      // Admins see all claims (no role filter)

      // Add status filter
      if (status) {
        filter.status = status;
      }

      // Add date range filter
      if (dateFrom || dateTo) {
        filter.createdAt = {};
        if (dateFrom) {
          filter.createdAt.$gte = new Date(dateFrom);
        }
        if (dateTo) {
          const endDate = new Date(dateTo);
          endDate.setHours(23, 59, 59, 999);
          filter.createdAt.$lte = endDate;
        }
      }

      // Add amount range filter
      if (amountMin !== null || amountMax !== null) {
        filter.amountClaimed = {};
        if (amountMin !== null) {
          filter.amountClaimed.$gte = amountMin;
        }
        if (amountMax !== null) {
          filter.amountClaimed.$lte = amountMax;
        }
      }

      // Add search filter (search in multiple fields)
      if (search) {
        const searchRegex = { $regex: search, $options: 'i' };
        const searchConditions = [
          { description: searchRegex },
          { status: searchRegex }
        ];
        
        // If search is a valid number, also search by amount
        if (!isNaN(search) && !isNaN(parseFloat(search))) {
          searchConditions.push({ amountClaimed: parseFloat(search) });
        }
        
        filter.$or = searchConditions;
      }

      console.log('Final filter applied:', JSON.stringify(filter, null, 2));

      // Calculate pagination
      const skip = (page - 1) * limit;
      
      // Get total count for pagination
      const total = await Claim.countDocuments(filter);
      const pages = Math.ceil(total / limit);

      // Fetch claims with filters and pagination
      const claims = await Claim.find(filter)
        .populate({
          path: 'userPolicyId',
          populate: {
            path: 'policyProductId',
            select: 'title code'
          }
        })
        .populate('userId', 'name email')
        .populate('assignedAgentId', 'name email')
        .populate('decidedByAgentId', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      return {
        claims,
        pagination: {
          page,
          limit,
          total,
          pages
        }
      };
    } catch (error) {
      throw new Error(`Failed to fetch claims with filters: ${error.message}`);
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
        .populate({
          path: 'userPolicyId',
          populate: {
            path: 'policyProductId',
            select: 'title code'
          }
        })
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

      console.log('Claim service - createClaim:', {
        userId,
        userPolicyId,
        incidentDate,
        description,
        amountClaimed
      });

      // Validate that the user owns the policy
      const userPolicy = await UserPolicy.findOne({
        _id: userPolicyId,
        userId: userId,
        status: 'ACTIVE'
      });

      console.log('Found user policy:', userPolicy);

      if (!userPolicy) {
        console.log('Policy not found. Searching for policies for user:', userId);
        const allUserPolicies = await UserPolicy.find({ userId: userId });
        console.log('All user policies:', allUserPolicies);
        throw new Error('Policy not found or not active');
      }

      // Validate incident date is a valid date
      const incident = new Date(incidentDate);
      if (isNaN(incident.getTime())) {
        throw new Error('Invalid incident date');
      }
      
      console.log('Date validation:', {
        incidentDate: incidentDate,
        incident: incident.toISOString(),
        isValid: !isNaN(incident.getTime())
      });

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

      console.log('Creating claim with data:', {
        userId,
        userPolicyId,
        incidentDate,
        description,
        amountClaimed
      });

      const saved = await claim.save();
      console.log('Claim saved successfully:', saved);
      
      await saved.populate('userPolicyId');
      console.log('Claim populated:', saved);

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
      return await Claim.find({ assignedAgentId: agentId })
        .populate({
          path: 'userPolicyId',
          populate: {
            path: 'policyProductId',
            select: 'title code'
          }
        })
        .populate('userId', 'name email')
        .populate('assignedAgentId', 'name email')
        .populate('decidedByAgentId', 'name email')
        .sort({ createdAt: -1 });
    } catch (error) {
      throw new Error(`Failed to fetch agent claims: ${error.message}`);
    }
  }

  /**
   * Assign a claim to an agent (Admin only)
   * @param {string} claimId - The claim ID
   * @param {string} agentId - The agent ID to assign to
   * @param {string} adminId - The admin ID making the assignment
   * @returns {Promise<Object>} Updated claim
   */
  async assignClaimToAgent(claimId, agentId, adminId) {
    try {
      // Check if claim exists and is pending
      const existingClaim = await Claim.findById(claimId);
      if (!existingClaim) {
        throw new Error('Claim not found');
      }

      if (existingClaim.status !== 'PENDING') {
        throw new Error('Can only assign pending claims');
      }

      // Update the claim with assigned agent
      const updatedClaim = await Claim.findByIdAndUpdate(
        claimId,
        { assignedAgentId: agentId },
        { new: true, runValidators: false }
      ).populate('assignedAgentId', 'name email');

      return updatedClaim;
    } catch (error) {
      if (error.message === 'Claim not found' || error.message === 'Can only assign pending claims') {
        throw error;
      }
      throw new Error(`Failed to assign claim: ${error.message}`);
    }
  }

  /**
   * Get unassigned claims (for admin to assign)
   * @returns {Promise<Array>} Array of unassigned claims
   */
  async getUnassignedClaims() {
    try {
      return await Claim.find({ 
        assignedAgentId: { $exists: false },
        status: 'PENDING'
      })
        .populate({
          path: 'userPolicyId',
          populate: {
            path: 'policyProductId',
            select: 'title code'
          }
        })
        .populate('userId', 'name email')
        .sort({ createdAt: -1 });
    } catch (error) {
      throw new Error(`Failed to fetch unassigned claims: ${error.message}`);
    }
  }
}

module.exports = new ClaimService();
