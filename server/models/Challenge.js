const mongoose = require('mongoose');

const ChallengeSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: {
    type: String,
    enum: ['web', 'forensics', 'cryptography', 'reverse-engineering', 'pwn', 'osint', 'network', 'steganography', 'misc'],
    required: true
  },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard', 'insane'], required: true },
  points: { type: Number, required: true },
  flag: { type: String, required: true },
  hints: [{ text: String, cost: Number }],
  files: [{ name: String, url: String }],
  tags: [String],
  solvedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  solveCount: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  writeup: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Challenge', ChallengeSchema);
