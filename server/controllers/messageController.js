const Message = require('../models/Message');
const MentorshipRequest = require('../models/MentorshipRequest');

/**
 * Check if two users have an accepted mentorship connection.
 * Connection exists if any MentorshipRequest between them has status='Accepted'.
 */
const isConnected = async (userAId, userBId) => {
  const conn = await MentorshipRequest.findOne({
    $or: [
      { sender: userAId, receiver: userBId },
      { sender: userBId, receiver: userAId },
    ],
    status: 'Accepted',
  });
  return !!conn;
};

// @desc  Send a message (only if connected via accepted mentorship)
// @route POST /api/messages
const sendMessage = async (req, res) => {
  try {
    const { receiverId, text } = req.body;

    if (!receiverId || !text?.trim()) {
      return res.status(400).json({ message: 'receiverId and text are required' });
    }

    if (receiverId === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot message yourself' });
    }

    // ── CONNECTION GATE ──────────────────────────────────────────
    const connected = await isConnected(req.user._id, receiverId);
    if (!connected) {
      return res.status(403).json({ message: 'Connect first to chat' });
    }
    // ────────────────────────────────────────────────────────────

    const msg = await Message.create({
      sender: req.user._id,
      receiver: receiverId,
      text: text.trim(),
    });

    const populated = await Message.findById(msg._id)
      .populate('sender',   'name email')
      .populate('receiver', 'name email');

    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @desc  Get conversation between current user and another user
// @route GET /api/messages/:userId
const getConversation = async (req, res) => {
  try {
    const { userId } = req.params;

    // Only connected users can read the conversation
    const connected = await isConnected(req.user._id, userId);
    if (!connected) {
      return res.status(403).json({ message: 'Connect first to chat' });
    }

    const messages = await Message.find({
      $or: [
        { sender: req.user._id, receiver: userId },
        { sender: userId, receiver: req.user._id },
      ],
    })
      .sort({ createdAt: 1 }) // oldest first (chat order)
      .populate('sender',   'name email')
      .populate('receiver', 'name email');

    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @desc  Get all conversations (inbox — list of unique chat partners)
// @route GET /api/messages
const getInbox = async (req, res) => {
  try {
    const myId = req.user._id;

    // Find all messages involving the current user
    const messages = await Message.find({
      $or: [{ sender: myId }, { receiver: myId }],
    })
      .sort({ createdAt: -1 })
      .populate('sender',   'name email')
      .populate('receiver', 'name email');

    // Build unique partner list with latest message per conversation
    const seen = new Map();
    for (const msg of messages) {
      const partner = msg.sender._id.toString() === myId.toString()
        ? msg.receiver
        : msg.sender;
      if (!seen.has(partner._id.toString())) {
        seen.set(partner._id.toString(), { partner, lastMessage: msg });
      }
    }

    res.json([...seen.values()]);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @desc  Delete a message (only sender can delete)
// @route DELETE /api/messages/:id
const deleteMessage = async (req, res) => {
  try {
    const msg = await Message.findById(req.params.id);
    if (!msg) return res.status(404).json({ message: 'Message not found' });
    if (msg.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this message' });
    }
    await msg.deleteOne();
    res.json({ message: 'Message deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = { sendMessage, getConversation, getInbox, deleteMessage };
