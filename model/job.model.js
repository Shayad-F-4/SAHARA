const mongoose = require('mongoose');

const helperSchema = new mongoose.Schema({
  username: { type: String, required: true, lowercase: true, trim: true },
  contact: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
}, { _id: false });

const jobSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  category: { type: String, required: true, trim: true },
  employer: { type: String, required: true, trim: true },
  location: { type: String, required: true, trim: true },
  urgency: { type: String, default: 'medium' },
  duration: { type: String, required: true },
  budget: { type: Number, default: 0 },
  requirements: { type: [String], default: [] },
  description: { type: String, required: true },
  ownerUsername: { type: String, required: true, lowercase: true, trim: true },
  helpers: { type: [helperSchema], default: [] }
}, { timestamps: true });

module.exports = mongoose.model('job', jobSchema);
