const AuditLog = require('../models/AuditLog');

const logAction = async (action, actorId, details, ip) => {
  try {
    const auditLog = new AuditLog({
      action,
      actorId,
      details,
      ip: ip || '127.0.0.1'
    });
    await auditLog.save();
  } catch (error) {
    console.error('Failed to log audit action:', error);
  }
};

module.exports = { logAction };
