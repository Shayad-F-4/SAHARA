const mongoose = require('mongoose');

const helperSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  provider: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  contact: { type: String, required: true, trim: true },
  likes: { type: Number, default: 0 },
  stars: { type: Number, default: 0 },
  likedBy: { type: [String], default: [] }, // lowercased usernames
  ownerUsername: { type: String, required: true, lowercase: true, trim: true },
}, { timestamps: true });

module.exports = mongoose.model('helper', helperSchema);
