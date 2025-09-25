const mongoose = require('mongoose');

const agentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: String,
  assignedPolicies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Policy' }]
}, { timestamps: true });

module.exports = mongoose.model('Agent', agentSchema);
