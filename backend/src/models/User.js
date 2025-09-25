const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, required: true, enum: ['customer', 'agent', 'admin'], default: 'customer' }
}, { timestamps: true });

// Add indexes for performance optimization
userSchema.index({ email: 1 }); // Unique index already exists, but explicit for clarity
userSchema.index({ role: 1 }); // For role-based queries
userSchema.index({ createdAt: -1 }); // For sorting by creation date

module.exports = mongoose.model('User', userSchema);
