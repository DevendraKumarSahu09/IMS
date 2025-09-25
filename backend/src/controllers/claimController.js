const claimService = require('../services/claimService');
const { logAction } = require('../utils/auditLogger');

exports.getClaims = async (req, res) => {
  try {
    const claims = await claimService.getClaims(req.user);
    res.json(claims);
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to fetch claims' });
  }
};

exports.getClaimById = async (req, res) => {
  try {
    const claim = await claimService.getClaimById(req.params.id, req.user);
    res.json(claim);
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
    const { policyId, incidentDate, description, amount } = req.body;
    
    const saved = await claimService.createClaim(req.user.id, {
      userPolicyId: policyId,
      incidentDate,
      description,
      amountClaimed: amount
    });
    
    // Log the action
    await logAction(
      'claim submission',
      req.user.id,
      {
        claimId: saved._id,
        userPolicyId: policyId,
        incidentDate: incidentDate,
        description: description,
        amountClaimed: amount
      },
      req.ip
    );
    
    res.status(201).json(saved);
  } catch (error) {
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

