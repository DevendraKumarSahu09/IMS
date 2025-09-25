const policyService = require('../services/policyService');
const { logAction } = require('../utils/auditLogger');

exports.getPolicies = async (req, res) => {
  try {
    const policies = await policyService.getAllPolicies();
    res.json(policies);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getPolicyById = async (req, res) => {
  try {
    const policy = await policyService.getPolicyById(req.params.id);
    res.json(policy);
  } catch (err) {
    res.status(404).json({ error: err.message });
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
    
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
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
    
    res.status(201).json(savedUserPolicy);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
