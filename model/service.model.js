const mongoose = require('mongoose');

const helperSchema = new mongoose.Schema({
  username: { type: String, required: true, lowercase: true, trim: true },
  contact: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
}, { _id: false });

const serviceSchema = new mongoose.Schema({
  category: { type: String, required: true, trim: true },
  workerName: { type: String, required: true, trim: true },
  location: { type: String, required: true, trim: true },
  experience: { type: Number, default: 0 },
  rate: { type: Number, default: 0 },
  skills: { type: [String], default: [] },
  description: { type: String, required: true },
  ownerUsername: { type: String, required: true, lowercase: true, trim: true },
  helpers: { type: [helperSchema], default: [] }
}, { timestamps: true });

module.exports = mongoose.model('service', serviceSchema);
