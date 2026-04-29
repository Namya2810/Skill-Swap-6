const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  requester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  host: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  topic: {
    type: String,
    required: [true, 'Topic is required'],
    trim: true,
  },
  date: {
    type: String,
    required: [true, 'Date is required'],
  },
  time: {
    type: String,
    required: [true, 'Time is required'],
  },
  note: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    // Added 'Expired' — set by system when an Accepted session's datetime passes
    // without being marked Complete by either party.
    enum: ['Pending', 'Accepted', 'Completed', 'Cancelled', 'Expired'],
    default: 'Pending',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  completedAt: {
    type: Date,
  },
});

module.exports = mongoose.model('Session', sessionSchema);
