const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text:   { type: String, required: true, trim: true, maxlength: 1000 },
  createdAt: { type: Date, default: Date.now },
});

const postSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  // Community scope — posts only visible to members of same community
  community: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Community',
    default: null,
  },
  type: {
    type: String,
    enum: ['General', 'Achievement', 'Question', 'Resource'],
    default: 'General',
  },
  content: {
    type: String,
    required: [true, 'Post content is required'],
    trim: true,
    maxlength: 3000,
  },
  // Reactions: { userId: 'emoji' } — stored as Map
  reactions: {
    type: Map,
    of: String, // emoji string e.g. '👍', '🔥', '❤️'
    default: {},
  },
  comments: [commentSchema],
  views: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

postSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Post', postSchema);
