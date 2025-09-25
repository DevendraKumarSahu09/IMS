const policyService = require('../services/policyService');
const { logAction } = require('../utils/auditLogger');

exports.getUserPolicies = async (req, res) => {
  try {
    const userPolicies = await policyService.getUserPolicies(req.user.id);
    res.json(userPolicies);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.cancelUserPolicy = async (req, res) => {
  try {
    const userPolicy = await policyService.cancelUserPolicy(req.params.id, req.user.id);
    
    // Log the action
    await logAction(
      'policy cancellation',
      req.user.id,
      {
        userPolicyId: userPolicy._id,
        cancellationReason: 'User requested cancellation'
      },
      req.ip
    );
    
    res.json({ message: 'Policy cancelled successfully', userPolicy });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
