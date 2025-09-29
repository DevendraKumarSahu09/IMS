const AuditLog = require('../models/AuditLog');
const User = require('../models/User');
const UserPolicy = require('../models/UserPolicy');
const Claim = require('../models/Claim');
const Payment = require('../models/Payment');
const Policy = require('../models/Policy');
const claimService = require('../services/claimService');
const bcrypt = require('bcryptjs');
const { logAction } = require('../utils/auditLogger');

exports.getAuditLogs = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;
    
    console.log('Audit logs request query:', req.query);
    
    // Build filter object
    let filter = {};
    
    // Filter by action
    if (req.query.action) {
      filter.action = { $regex: req.query.action, $options: 'i' };
    }
    
    // Filter by actor ID
    if (req.query.actorId) {
      filter.actorId = req.query.actorId;
    }
    
    // Filter by date range
    if (req.query.dateFrom || req.query.dateTo) {
      filter.timestamp = {};
      if (req.query.dateFrom) {
        filter.timestamp.$gte = new Date(req.query.dateFrom);
      }
      if (req.query.dateTo) {
        // Add 23:59:59 to include the entire day
        const endDate = new Date(req.query.dateTo);
        endDate.setHours(23, 59, 59, 999);
        filter.timestamp.$lte = endDate;
      }
    }
    
    console.log('MongoDB filter:', JSON.stringify(filter, null, 2));
    
    // Get total count for pagination
    const total = await AuditLog.countDocuments(filter);
    
    // Fetch audit logs with filters
    const auditLogs = await AuditLog.find(filter)
      .populate('actorId', 'name email role')
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit);
    
    console.log(`Found ${auditLogs.length} audit logs out of ${total} total`);
    
    // Transform the logs to match frontend expectations
    const transformedLogs = auditLogs.map(log => ({
      ...log.toObject(),
      actor: log.actorId ? {
        name: log.actorId.name,
        email: log.actorId.email,
        role: log.actorId.role
      } : null
    }));
    
    res.json({
      logs: transformedLogs,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch audit logs' });
  }
};

exports.getSummary = async (req, res) => {
  try {
    const [
      totalUsers,
      totalPolicies,
      pendingClaims,
      totalPayments,
      activeAgents
    ] = await Promise.all([
      User.countDocuments(),
      UserPolicy.countDocuments({ status: 'ACTIVE' }),
      Claim.countDocuments({ status: 'PENDING' }),
      Payment.aggregate([
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      User.countDocuments({ role: 'agent' })
    ]);
    
    const summary = {
      totalUsers,
      totalPolicies,
      pendingClaims,
      totalPayments: totalPayments[0]?.total || 0,
      activeAgents
    };
    
    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to fetch summary' });
  }
};

// User Management APIs
exports.getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const role = req.query.role || '';

    let filter = {};
    
    // Search filter
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Role filter
    if (role) {
      filter.role = role;
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-passwordHash')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(filter)
    ]);

    // Add assigned claims count for each user
    const usersWithClaimsCount = await Promise.all(
      users.map(async (user) => {
        const Claim = require('../models/Claim');
        const assignedClaimsCount = await Claim.countDocuments({ 
          assignedAgentId: user._id 
        });
        
        return {
          ...user.toObject(),
          assignedClaims: assignedClaimsCount
        };
      })
    );

    res.json({
      success: true,
      data: usersWithClaimsCount,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to fetch users' });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-passwordHash');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to fetch user' });
  }
};

exports.createUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const user = new User({
      name,
      email,
      passwordHash,
      role: role || 'agent'
    });

    const savedUser = await user.save();

    // Log the action
    await logAction(
      'user creation',
      req.user.id,
      {
        createdUserId: savedUser._id,
        createdUserName: name,
        createdUserEmail: email,
        createdUserRole: role || 'agent'
      },
      req.ip
    );

    res.status(201).json({ 
      success: true, 
      data: {
        _id: savedUser._id,
        name: savedUser.name,
        email: savedUser.email,
        role: savedUser.role,
        status: savedUser.status,
        createdAt: savedUser.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to create user' });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { name, email, role } = req.body;
    const userId = req.params.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if email is being changed and if it already exists
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email, _id: { $ne: userId } });
      if (existingUser) {
        return res.status(400).json({ error: 'Email already exists' });
      }
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (role) updateData.role = role;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-passwordHash');

    // Log the action
    await logAction(
      'user update',
      req.user.id,
      {
        targetUserId: userId,
        changes: updateData
      },
      req.ip
    );

    res.json({ success: true, data: updatedUser });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to update user' });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent admin from deleting themselves
    if (userId === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    // Check if user has active policies or claims
    const [activePolicies, activeClaims] = await Promise.all([
      UserPolicy.countDocuments({ userId, status: 'ACTIVE' }),
      Claim.countDocuments({ userId, status: 'PENDING' })
    ]);

    if (activePolicies > 0 || activeClaims > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete user with active policies or pending claims' 
      });
    }

    await User.findByIdAndDelete(userId);

    // Log the action
    await logAction(
      'user deletion',
      req.user.id,
      {
        deletedUserId: userId,
        deletedUserName: user.name,
        deletedUserEmail: user.email
      },
      req.ip
    );

    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to delete user' });
  }
};

// Policy Product Management APIs
exports.getAllPolicies = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';

    let filter = {};
    if (search) {
      filter = {
        $or: [
          { title: { $regex: search, $options: 'i' } },
          { code: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ]
      };
    }

    const [policies, total] = await Promise.all([
      Policy.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Policy.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: policies,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to fetch policies' });
  }
};

exports.createPolicy = async (req, res) => {
  try {
    const { code, title, description, premium, termMonths, minSumInsured } = req.body;

    // Check if policy code already exists
    const existingPolicy = await Policy.findOne({ code });
    if (existingPolicy) {
      return res.status(400).json({ error: 'Policy code already exists' });
    }

    const policy = new Policy({
      code,
      title,
      description,
      premium,
      termMonths,
      minSumInsured
    });

    const savedPolicy = await policy.save();

    // Log the action
    await logAction(
      'policy creation',
      req.user.id,
      {
        policyId: savedPolicy._id,
        policyCode: code,
        policyTitle: title
      },
      req.ip
    );

    res.status(201).json({ success: true, data: savedPolicy });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to create policy' });
  }
};

exports.updatePolicy = async (req, res) => {
  try {
    const { code, title, description, premium, termMonths, minSumInsured } = req.body;
    const policyId = req.params.id;

    const policy = await Policy.findById(policyId);
    if (!policy) {
      return res.status(404).json({ error: 'Policy not found' });
    }

    // Check if code is being changed and if it already exists
    if (code && code !== policy.code) {
      const existingPolicy = await Policy.findOne({ code, _id: { $ne: policyId } });
      if (existingPolicy) {
        return res.status(400).json({ error: 'Policy code already exists' });
      }
    }

    const updateData = {};
    if (code) updateData.code = code;
    if (title) updateData.title = title;
    if (description) updateData.description = description;
    if (premium !== undefined) updateData.premium = premium;
    if (termMonths !== undefined) updateData.termMonths = termMonths;
    if (minSumInsured !== undefined) updateData.minSumInsured = minSumInsured;

    const updatedPolicy = await Policy.findByIdAndUpdate(
      policyId,
      updateData,
      { new: true, runValidators: true }
    );

    // Log the action
    await logAction(
      'policy update',
      req.user.id,
      {
        policyId: policyId,
        changes: updateData
      },
      req.ip
    );

    res.json({ success: true, data: updatedPolicy });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to update policy' });
  }
};

exports.deletePolicy = async (req, res) => {
  try {
    const policyId = req.params.id;

    // Check if policy exists
    const policy = await Policy.findById(policyId);
    if (!policy) {
      return res.status(404).json({ error: 'Policy not found' });
    }

    // Check if policy has active user policies
    const activeUserPolicies = await UserPolicy.countDocuments({ 
      policyProductId: policyId, 
      status: 'ACTIVE' 
    });

    if (activeUserPolicies > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete policy with active user policies' 
      });
    }

    await Policy.findByIdAndDelete(policyId);

    // Log the action
    await logAction(
      'policy deletion',
      req.user.id,
      {
        policyId: policyId,
        policyCode: policy.code,
        policyTitle: policy.title
      },
      req.ip
    );

    res.json({ success: true, message: 'Policy deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to delete policy' });
  }
};

// Claim Assignment Methods
exports.getUnassignedClaims = async (req, res) => {
  try {
    const claims = await claimService.getUnassignedClaims();
    res.json({
      success: true,
      data: claims
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: error.message || 'Failed to fetch unassigned claims' 
    });
  }
};


exports.assignClaimToAgent = async (req, res) => {
  try {
    const { claimId, agentId } = req.body;
    
    if (!claimId || !agentId) {
      return res.status(400).json({ 
        success: false,
        error: 'Claim ID and Agent ID are required' 
      });
    }

    // Verify agent exists and has agent role
    const agent = await User.findById(agentId);
    if (!agent || agent.role !== 'agent') {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid agent ID or agent not found' 
      });
    }

    const updatedClaim = await claimService.assignClaimToAgent(claimId, agentId, req.user.id);
    
    // Log the assignment action
    await logAction(
      'claim assignment',
      req.user.id,
      {
        claimId: claimId,
        assignedAgentId: agentId,
        assignedAgentName: agent.name
      },
      req.ip
    );
    
    res.json({
      success: true,
      data: updatedClaim,
      message: 'Claim assigned to agent successfully'
    });
  } catch (error) {
    if (error.message === 'Claim not found' || error.message === 'Can only assign pending claims') {
      return res.status(400).json({ 
        success: false,
        error: error.message 
      });
    }
    res.status(500).json({ 
      success: false,
      error: error.message || 'Failed to assign claim to agent' 
    });
  }
};

exports.getAgentClaims = async (req, res) => {
  try {
    const { agentId } = req.params;
    const claims = await claimService.getAgentClaims(agentId);
    res.json({
      success: true,
      data: claims
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: error.message || 'Failed to fetch agent claims' 
    });
  }
};
