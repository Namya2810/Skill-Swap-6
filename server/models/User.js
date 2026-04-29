const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Sub-schema for a skill with a proficiency level
const skillEntrySchema = new mongoose.Schema({
  name:  { type: String, required: true, trim: true },
  level: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'], default: 'Beginner' },
}, { _id: false });

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
  },
  role: {
    type: String,
    enum: ['Learner', 'Mentor'],
    default: 'Learner',
  },
  // Skills this user can teach / offer — stored as [{name, level}]
  skillsOffered: {
    type: [skillEntrySchema],
    default: [],
  },
  // Skills this user wants to learn — stored as [{name, level}]
  skillsWanted: {
    type: [skillEntrySchema],
    default: [],
  },
  bio: {
    type: String,
    default: '',
  },
  community: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Community',
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare entered password with hashed password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
