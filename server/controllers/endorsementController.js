const Endorsement = require('../models/Endorsement');
const Session = require('../models/Session');

// @desc  Endorse a skill for a user (must have completed session)
// @route POST /api/endorsements
const endorseSkill = async (req, res) => {
  try {
    const { toUserId, skill, sessionId } = req.body;
    if (!toUserId || !skill || !sessionId)
      return res.status(400).json({ message: 'toUserId, skill, and sessionId are required' });

    if (toUserId === req.user._id.toString())
      return res.status(400).json({ message: 'Cannot endorse yourself' });

    // Verify completed session between these two users
    const session = await Session.findById(sessionId);
    if (!session || session.status !== 'Completed')
      return res.status(403).json({ message: 'Can only endorse after a completed session' });

    const uid = req.user._id.toString();
    const isParticipant = session.requester.toString() === uid || session.host.toString() === uid;
    if (!isParticipant)
      return res.status(403).json({ message: 'Not a participant in this session' });

    const endorsement = await Endorsement.create({
      fromUser: req.user._id,
      toUser:   toUserId,
      skill:    skill.toLowerCase().trim(),
      session:  sessionId,
    });

    res.status(201).json(endorsement);
  } catch (err) {
    if (err.code === 11000)
      return res.status(400).json({ message: 'You have already endorsed this skill for this user' });
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @desc  Get endorsements for a user (grouped by skill)
// @route GET /api/endorsements/:userId
const getEndorsements = async (req, res) => {
  try {
    const endorsements = await Endorsement.find({ toUser: req.params.userId })
      .populate('fromUser', 'name');

    // Group by skill with count and endorser names
    const grouped = {};
    for (const e of endorsements) {
      if (!grouped[e.skill]) grouped[e.skill] = { skill: e.skill, count: 0, endorsers: [] };
      grouped[e.skill].count++;
      grouped[e.skill].endorsers.push(e.fromUser?.name || 'Someone');
    }

    res.json(Object.values(grouped).sort((a, b) => b.count - a.count));
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = { endorseSkill, getEndorsements };
