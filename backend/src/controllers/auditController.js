const auditService = require('../services/auditService');

exports.getAuditLogs = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const logs = await auditService.getRecentAuditLogs(limit);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAuditLogById = async (req, res) => {
  try {
    const AuditLog = require('../models/AuditLog');
    const log = await AuditLog.findById(req.params.id)
      .populate('actorId', 'name email role');
    
    if (!log) {
      return res.status(404).json({ error: 'Audit log not found' });
    }
    
    res.json(log);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};