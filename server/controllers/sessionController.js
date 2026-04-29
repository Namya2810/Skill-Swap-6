const Session = require('../models/Session');
const User = require('../models/User');
const MentorshipRequest = require('../models/MentorshipRequest');
const { sendSessionConfirmationEmail } = require('../utils/emailService');

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Parse a session's stored date + time strings into a JS Date.
 * date format: "YYYY-MM-DD"  |  time format: "HH:MM" (24-hr)
 */
function parseSessionDateTime(date, time = '00:00') {
  // Build ISO string and parse — avoids timezone surprises from `new Date(date)`
  return new Date(`${date}T${time}:00`);
}

/**
 * Auto-expire any Accepted sessions whose datetime has already passed.
 * Called at the start of getSessions so users always see fresh status.
 */
async function autoExpirePastSessions(userId) {
  const now = new Date();
  const activeSessions = await Session.find({
    $or: [{ requester: userId }, { host: userId }],
    status: 'Accepted',
  });

  const expireIds = activeSessions
    .filter(s => parseSessionDateTime(s.date, s.time) < now)
    .map(s => s._id);

  if (expireIds.length > 0) {
    await Session.updateMany(
      { _id: { $in: expireIds } },
      { $set: { status: 'Expired' } }
    );
  }
}

// ── Controllers ───────────────────────────────────────────────────────────────

// @desc  Request a session
// @route POST /api/sessions/request
const requestSession = async (req, res) => {
  try {
    const { hostId, topic, date, time, note } = req.body;
    if (!hostId || !topic || !date || !time)
      return res.status(400).json({ message: 'hostId, topic, date and time are required' });

    if (hostId === req.user._id.toString())
      return res.status(400).json({ message: 'Cannot book a session with yourself' });

    // ── Date validation: reject past dates ──────────────────────────────────
    const sessionDateTime = parseSessionDateTime(date, time);
    if (sessionDateTime <= new Date())
      return res.status(400).json({ message: 'Session date and time must be in the future' });
    // ────────────────────────────────────────────────────────────────────────

    const host = await User.findById(hostId);
    if (!host) return res.status(404).json({ message: 'User not found' });

    const session = await Session.create({
      requester: req.user._id,
      host: hostId,
      topic, date, time,
      note: note || '',
    });

    const populated = await Session.findById(session._id)
      .populate('requester', 'name email role')
      .populate('host', 'name email role skillsOffered');

    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @desc  Accept or cancel a session (host only)
// @route PUT /api/sessions/:id/respond
const respondToSession = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['Accepted', 'Cancelled'].includes(status))
      return res.status(400).json({ message: 'Status must be Accepted or Cancelled' });

    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ message: 'Session not found' });

    if (session.host.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Not authorized' });

    // Prevent accepting a session whose date has already passed
    if (status === 'Accepted') {
      const sessionDateTime = parseSessionDateTime(session.date, session.time);
      if (sessionDateTime <= new Date())
        return res.status(400).json({ message: 'Cannot accept a session whose date has already passed' });
    }

    session.status = status;
    await session.save();

    const populated = await Session.findById(session._id)
      .populate('requester', 'name email role')
      .populate('host', 'name email role');

    // Send confirmation emails to both parties when accepted
    if (status === 'Accepted') {
      const { requester, host } = populated;
      const sharedPayload = { sessionTopic: session.topic, sessionDate: session.date, sessionTime: session.time || '' };

      if (requester?.email) {
        sendSessionConfirmationEmail({ to: requester.email, name: requester.name, peerName: host.name, role: 'requester', ...sharedPayload });
      }
      if (host?.email) {
        sendSessionConfirmationEmail({ to: host.email, name: host.name, peerName: requester.name, role: 'host', ...sharedPayload });
      }
    }

    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @desc  Mark session as completed
// @route PUT /api/sessions/:id/complete
const completeSession = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ message: 'Session not found' });

    const uid = req.user._id.toString();
    if (session.requester.toString() !== uid && session.host.toString() !== uid)
      return res.status(403).json({ message: 'Not authorized' });

    if (session.status !== 'Accepted')
      return res.status(400).json({ message: 'Can only complete accepted sessions' });

    session.status = 'Completed';
    session.completedAt = new Date();
    await session.save();

    const populated = await Session.findById(session._id)
      .populate('requester', 'name email role')
      .populate('host', 'name email role');

    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @desc  Get all sessions for current user (auto-expires past accepted sessions)
// @route GET /api/sessions
const getSessions = async (req, res) => {
  try {
    const uid = req.user._id;

    // Auto-expire any Accepted sessions whose datetime has passed
    await autoExpirePastSessions(uid);

    const sessions = await Session.find({ $or: [{ requester: uid }, { host: uid }] })
      .populate('requester', 'name email role')
      .populate('host', 'name email role skillsOffered')
      .sort({ createdAt: -1 });

    res.json(sessions);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = { requestSession, respondToSession, completeSession, getSessions };
