const mongoose = require('mongoose');

const policySchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  premium: { type: Number, required: true }, // monthly or yearly depending on term
  termMonths: { type: Number, required: true },
  minSumInsured: { type: Number, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Policy', policySchema);
