const AuditLog = require('../models/AuditLog');
const User = require('../models/User');
const UserPolicy = require('../models/UserPolicy');
const Claim = require('../models/Claim');
const Payment = require('../models/Payment');

exports.getAuditLogs = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const auditLogs = await AuditLog.find()
      .populate('actorId', 'name email role')
      .sort({ timestamp: -1 })
      .limit(limit);
    
    res.json(auditLogs);
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to fetch audit logs' });
  }
};

exports.getSummary = async (req, res) => {
  try {
    const [
      totalUsers,
      totalPolicies,
      pendingClaims,
      totalPayments
    ] = await Promise.all([
      User.countDocuments(),
      UserPolicy.countDocuments({ status: 'ACTIVE' }),
      Claim.countDocuments({ status: 'PENDING' }),
      Payment.aggregate([
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ])
    ]);
    
    const summary = {
      totalUsers,
      totalPolicies,
      pendingClaims,
      totalPayments: totalPayments[0]?.total || 0
    };
    
    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to fetch summary' });
  }
};
