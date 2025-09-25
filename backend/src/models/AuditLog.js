const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  action: { type: String, required: true },
  actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  details: { type: mongoose.Schema.Types.Mixed, required: true },
  ip: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

// Add indexes for performance optimization
auditLogSchema.index({ actorId: 1 }); // For user-specific audit queries
auditLogSchema.index({ action: 1 }); // For action-based queries
auditLogSchema.index({ timestamp: -1 }); // For sorting by timestamp (most recent first)
auditLogSchema.index({ actorId: 1, timestamp: -1 }); // Compound index for user's audit trail

module.exports = mongoose.model('AuditLog', auditLogSchema);
