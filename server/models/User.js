const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true, minlength: 3 },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, minlength: 6 },
  avatar: { type: String, default: 'hacker1' },
  role: { type: String, enum: ['student', 'instructor', 'admin'], default: 'student' },
  level: { type: Number, default: 1 },
  xp: { type: Number, default: 0 },
  rank: { type: String, default: 'Script Kiddie' },
  badges: [{ name: String, icon: String, earnedAt: Date }],
  completedChallenges: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Challenge' }],
  completedLabs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Lab' }],
  completedTasks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Task' }],
  streak: { type: Number, default: 0 },
  lastActive: { type: Date, default: Date.now },
  bio: { type: String, default: '' },
  skills: [String],
  createdAt: { type: Date, default: Date.now }
});

UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

UserSchema.methods.updateRank = function() {
  const ranks = [
    { min: 0, name: 'Script Kiddie' },
    { min: 500, name: 'Newbie Hacker' },
    { min: 1500, name: 'Penetration Tester' },
    { min: 3000, name: 'Security Analyst' },
    { min: 6000, name: 'Ethical Hacker' },
    { min: 10000, name: 'Cyber Warrior' },
    { min: 20000, name: 'Elite Hacker' },
    { min: 50000, name: 'Cyber God' }
  ];
  const rank = ranks.filter(r => this.xp >= r.min).pop();
  this.rank = rank.name;
  this.level = Math.floor(this.xp / 500) + 1;
};

module.exports = mongoose.model('User', UserSchema);
