const policyService = require('../services/policyService');
const { logAction } = require('../utils/auditLogger');

exports.getPolicies = async (req, res) => {
  try {
    const policies = await policyService.getAllPolicies();
    res.json({
      success: true,
      data: policies
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
};

exports.getPolicyById = async (req, res) => {
  try {
    const policy = await policyService.getPolicyById(req.params.id);
    res.json({
      success: true,
      data: policy
    });
  } catch (err) {
    res.status(404).json({ 
      success: false,
      error: err.message 
    });
  }
};

exports.createPolicy = async (req, res) => {
  try {
    const saved = await policyService.createPolicy(req.body);
    
    // Log the action
    await logAction(
      'policy creation',
      req.user.id,
      {
        policyId: saved._id,
        code: saved.code,
        title: saved.title,
        premium: saved.premium
      },
      req.ip
    );
    
    res.status(201).json({
      success: true,
      data: saved
    });
  } catch (err) {
    res.status(400).json({ 
      success: false,
      error: err.message 
    });
  }
};

exports.updatePolicy = async (req, res) => {
  try {
    const updated = await policyService.updatePolicy(req.params.id, req.body);
    
    // Log the action
    await logAction(
      'policy update',
      req.user.id,
      {
        policyId: updated._id,
        code: updated.code,
        title: updated.title,
        changes: req.body
      },
      req.ip
    );
    
    res.json({
      success: true,
      data: updated
    });
  } catch (err) {
    res.status(400).json({ 
      success: false,
      error: err.message 
    });
  }
};

exports.deletePolicy = async (req, res) => {
  try {
    const deleted = await policyService.deletePolicy(req.params.id);
    
    // Log the action
    await logAction(
      'policy deletion',
      req.user.id,
      {
        policyId: req.params.id,
        code: deleted.code,
        title: deleted.title
      },
      req.ip
    );
    
    res.json({ 
      success: true,
      message: 'Policy deleted successfully' 
    });
  } catch (err) {
    res.status(400).json({ 
      success: false,
      error: err.message 
    });
  }
};

exports.purchasePolicy = async (req, res) => {
  try {
    const { startDate, termMonths, nominee } = req.body;
    const policyId = req.params.id;
    
    const savedUserPolicy = await policyService.purchasePolicy(
      policyId,
      req.user.id,
      { startDate, termMonths, nominee }
    );
    
    // Log the action
    await logAction(
      'policy purchase',
      req.user.id,
      {
        userPolicyId: savedUserPolicy._id,
        policyProductId: policyId,
        startDate: startDate,
        termMonths: termMonths,
        premium: savedUserPolicy.premiumPaid,
        nominee: nominee
      },
      req.ip
    );
    
    res.status(201).json({
      success: true,
      data: savedUserPolicy
    });
  } catch (err) {
    res.status(400).json({ 
      success: false,
      error: err.message 
    });
  }
};
