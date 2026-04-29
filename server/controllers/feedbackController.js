const Feedback = require('../models/Feedback');
const MentorshipRequest = require('../models/MentorshipRequest');

// @desc    Submit feedback for a mentor/peer
// @route   POST /api/feedback
const submitFeedback = async (req, res) => {
  try {
    const { toUserId, message, rating } = req.body;

    if (!toUserId || !message || !rating) {
      return res.status(400).json({ message: 'toUserId, message, and rating are required' });
    }

    // Check that an accepted mentorship exists between these users
    const mentorship = await MentorshipRequest.findOne({
      $or: [
        { sender: req.user._id, receiver: toUserId },
        { sender: toUserId, receiver: req.user._id },
      ],
      status: 'Accepted',
    });

    if (!mentorship) {
      return res.status(403).json({
        message: 'You can only give feedback to users with whom you have an accepted mentorship',
      });
    }

    // Prevent duplicate feedback
    const existing = await Feedback.findOne({
      fromUser: req.user._id,
      toUser: toUserId,
    });

    if (existing) {
      return res.status(400).json({ message: 'You have already given feedback to this user' });
    }

    const feedback = await Feedback.create({
      fromUser: req.user._id,
      toUser: toUserId,
      message,
      rating: Number(rating),
    });

    const populated = await Feedback.findById(feedback._id)
      .populate('fromUser', 'name email')
      .populate('toUser', 'name email');

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get all feedback for/by the current user
// @route   GET /api/feedback
const getFeedback = async (req, res) => {
  try {
    // Feedback received by this user
    const received = await Feedback.find({ toUser: req.user._id })
      .populate('fromUser', 'name email role')
      .sort({ createdAt: -1 });

    // Feedback this user gave
    const given = await Feedback.find({ fromUser: req.user._id })
      .populate('toUser', 'name email role')
      .sort({ createdAt: -1 });

    // Compute average rating
    const avgRating =
      received.length > 0
        ? received.reduce((sum, f) => sum + f.rating, 0) / received.length
        : null;

    res.json({ received, given, avgRating });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { submitFeedback, getFeedback };
