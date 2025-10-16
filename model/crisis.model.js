const mongoose = require('mongoose');

const crisisSchema = new mongoose.Schema({
  crisis_type: {
    type: String,
    required: true,
    enum: ['flood', 'fire', 'earthquake', 'storm', 'accident', 'other']
  },
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  location: { type: String, required: true },
  priority: {
    type: String,
    required: true,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'resolved'],
    default: 'pending'
  },
  reportedBy: { type: String, required: true, lowercase: true, trim: true },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

module.exports = mongoose.model('crisis_location', crisisSchema);
