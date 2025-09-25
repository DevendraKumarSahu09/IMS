const AuditLog = require('../models/AuditLog');

const getRecentAuditLogs = async (limit = 50) => {
  return await AuditLog.find()
    .populate('actorId', 'name email role')
    .sort({ timestamp: -1 })
    .limit(limit);
};

module.exports = {
  getRecentAuditLogs
};
