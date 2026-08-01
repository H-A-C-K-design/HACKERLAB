const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  type: {
    type: String,
    enum: ['python', 'bash', 'c', 'javascript', 'sql-injection', 'xss', 'buffer-overflow'],
    required: true
  },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], required: true },
  points: { type: Number, required: true },
  starterCode: { type: String, default: '' },
  solution: { type: String, required: true },
  testCases: [{
    input: String,
    expectedOutput: String,
    isHidden: { type: Boolean, default: false }
  }],
  hints: [String],
  tags: [String],
  completedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Task', TaskSchema);
