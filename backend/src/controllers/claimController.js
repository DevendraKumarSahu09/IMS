const claimService = require('../services/claimService');
const { logAction } = require('../utils/auditLogger');

exports.getClaims = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      dateFrom,
      dateTo,
      amountMin,
      amountMax,
      search
    } = req.query;

    const claims = await claimService.getClaimsWithFilters(
      req.user.id, 
      req.user.role,
      {
        page: parseInt(page),
        limit: parseInt(limit),
        status,
        dateFrom,
        dateTo,
        amountMin: amountMin ? parseFloat(amountMin) : null,
        amountMax: amountMax ? parseFloat(amountMax) : null,
        search
      }
    );
    
    res.json({
      success: true,
      data: claims.claims,
      pagination: claims.pagination
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: error.message || 'Failed to fetch claims' 
    });
  }
};

exports.getClaimById = async (req, res) => {
  try {
    const claim = await claimService.getClaimById(req.params.id, req.user.id, req.user.role);
    res.json({
      success: true,
      data: claim
    });
  } catch (error) {
    if (error.message === 'Claim not found') {
      return res.status(404).json({ error: error.message });
    }
    if (error.message === 'Access denied: You do not have access to this claim') {
      return res.status(403).json({ error: error.message });
    }
    res.status(500).json({ error: error.message || 'Failed to fetch claim' });
  }
};

exports.createClaim = async (req, res) => {
  try {
    const { userPolicyId, incidentDate, description, amountClaimed } = req.body;
    
    console.log('Create claim request:', {
      userId: req.user.id,
      userPolicyId,
      incidentDate,
      description,
      amountClaimed
    });
    
    console.log('User from token:', req.user);
    
    const saved = await claimService.createClaim(req.user.id, {
      userPolicyId,
      incidentDate,
      description,
      amountClaimed
    });
    
    // Log the action
    await logAction(
      'claim submission',
      req.user.id,
      {
        claimId: saved._id,
        userPolicyId: userPolicyId,
        incidentDate: incidentDate,
        description: description,
        amountClaimed: amountClaimed
      },
      req.ip
    );
    
    console.log('Claim created successfully:', saved);
    res.status(201).json(saved);
  } catch (error) {
    console.error('Error creating claim:', error);
    res.status(400).json({ error: error.message });
  }
};

// PUT /api/v1/claims/:id/status
exports.updateClaimStatus = async (req, res) => {
  try {
    const { status, notes } = req.body;
    const claimId = req.params.id;
    
    const updatedClaim = await claimService.updateClaimStatus(claimId, req.user.id, { status, notes });
    
    // Log the action
    await logAction(
      'claim status update',
      req.user.id,
      {
        claimId: updatedClaim._id,
        status: status,
        notes: notes,
        decidedByAgentId: req.user.id
      },
      req.ip
    );
    
    res.json(updatedClaim);
  } catch (error) {
    if (error.message === 'Claim not found') {
      return res.status(404).json({ error: error.message });
    }
    if (error.message === 'Invalid status value') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: error.message || 'Failed to update claim status' });
  }
};

