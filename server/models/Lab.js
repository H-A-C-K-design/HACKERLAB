const mongoose = require('mongoose');

const LabSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: {
    type: String,
    enum: ['kali-basics', 'network-scan', 'web-hacking', 'password-cracking', 'malware-analysis', 'forensics', 'exploitation'],
    required: true
  },
  difficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced'], required: true },
  duration: { type: String, required: true },
  xpReward: { type: Number, default: 100 },
  steps: [{
    stepNumber: Number,
    title: String,
    instruction: String,
    command: String,
    expectedOutput: String,
    hint: String
  }],
  tools: [String],
  objectives: [String],
  completedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  isActive: { type: Boolean, default: true },
  thumbnail: { type: String, default: 'default-lab' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Lab', LabSchema);
