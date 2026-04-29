const MentorshipRequest = require('../models/MentorshipRequest');
const User = require('../models/User');

// @desc    Send a mentorship request
// @route   POST /api/mentorship/request
const sendRequest = async (req, res) => {
  try {
    const { receiverId, message, skillsRequested } = req.body;

    if (!receiverId) {
      return res.status(400).json({ message: 'Receiver ID is required' });
    }

    // Can't send request to yourself
    if (receiverId === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot send request to yourself' });
    }

    // Check if receiver exists
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({ message: 'Receiver not found' });
    }

    // Check for existing pending request between these users
    const existingRequest = await MentorshipRequest.findOne({
      sender: req.user._id,
      receiver: receiverId,
      status: 'Pending',
    });

    if (existingRequest) {
      return res.status(400).json({ message: 'A pending request already exists' });
    }

    const request = await MentorshipRequest.create({
      sender: req.user._id,
      receiver: receiverId,
      message: message || '',
      skillsRequested: skillsRequested || [],
    });

    const populated = await MentorshipRequest.findById(request._id)
      .populate('sender', 'name email role skillsOffered')
      .populate('receiver', 'name email role skillsOffered');

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Accept or reject a mentorship request
// @route   PUT /api/mentorship/respond
const respondToRequest = async (req, res) => {
  try {
    const { requestId, status } = req.body;

    if (!['Accepted', 'Rejected'].includes(status)) {
      return res.status(400).json({ message: 'Status must be Accepted or Rejected' });
    }

    const request = await MentorshipRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    // Only the receiver can respond
    if (request.receiver.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to respond to this request' });
    }

    if (request.status !== 'Pending') {
      return res.status(400).json({ message: 'Request already responded to' });
    }

    request.status = status;
    request.respondedAt = new Date();
    await request.save();

    const populated = await MentorshipRequest.findById(request._id)
      .populate('sender', 'name email role')
      .populate('receiver', 'name email role');

    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get all mentorship requests for the current user (sent + received)
// @route   GET /api/mentorship
const getRequests = async (req, res) => {
  try {
    const sent = await MentorshipRequest.find({ sender: req.user._id })
      .populate('receiver', 'name email role skillsOffered')
      .sort({ createdAt: -1 });

    const received = await MentorshipRequest.find({ receiver: req.user._id })
      .populate('sender', 'name email role skillsOffered skillsWanted')
      .sort({ createdAt: -1 });

    res.json({ sent, received });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { sendRequest, respondToRequest, getRequests };
