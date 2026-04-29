const User = require('../models/User');
const MentorshipRequest = require('../models/MentorshipRequest');

// Helper: extract skill name regardless of old (string) or new ({name,level}) format
const skillName = s => (typeof s === 'string' ? s : s.name || '').toLowerCase();

/**
 * Peer Recommendation Score
 *
 * Weights:
 *   theirOffered ∩ myWanted   → +3 per skill  (they can teach me)
 *   myOffered ∩ theirWanted   → +2 per skill  (I can teach them)
 *   same community            → +2 flat bonus
 *
 * Also returns level info for matched skills to drive the breakdown UI.
 */
const computePeerScore = (me, other) => {
  const myWanted   = new Set(me.skillsWanted.map(skillName));
  const myOffered  = new Set(me.skillsOffered.map(skillName));

  // Build maps: skill name → level for other user
  const theirOfferMap = {};
  other.skillsOffered.forEach(s => { theirOfferMap[skillName(s)] = typeof s === 'string' ? 'Beginner' : (s.level || 'Beginner'); });

  const theirWantMap = {};
  other.skillsWanted.forEach(s => { theirWantMap[skillName(s)] = typeof s === 'string' ? 'Beginner' : (s.level || 'Beginner'); });

  // They can teach me — include level info
  const teachMe = Object.keys(theirOfferMap)
    .filter(s => myWanted.has(s))
    .map(s => ({ name: s, level: theirOfferMap[s] }));

  // I can teach them
  const iTeach = Object.keys(theirWantMap)
    .filter(s => myOffered.has(s))
    .map(s => ({ name: s, level: theirWantMap[s] }));

  const skillScore = teachMe.length * 3 + iTeach.length * 2;

  const sameCommunity = me.community && other.community &&
    me.community.toString() === other.community.toString();
  const communityBonus = (sameCommunity && skillScore > 0) ? 2 : 0;

  // Category match bonus: +1 if both share a dominant skill category
  const myAllSkills  = [...me.skillsOffered, ...me.skillsWanted].map(skillName);
  const theirAllSkills = [...other.skillsOffered, ...other.skillsWanted].map(skillName);

  // Detect category overlap (simple: shared skills normalized)
  const myCatSet = new Set(myAllSkills);
  const theirCatSet = new Set(theirAllSkills);
  const sharedSkills = [...myCatSet].filter(s => theirCatSet.has(s));
  const categoryMatch = sharedSkills.length > 0;
  const categoryBonus = categoryMatch ? 1 : 0;

  const totalScore = skillScore + communityBonus + categoryBonus;

  return {
    score: totalScore,
    teachMe,          // [{name, level}] — they can teach me
    iTeach,           // [{name, level}] — I can teach them
    sameCommunity,
    communityBonus,
    categoryMatch,
    categoryBonus,
    scoreBreakdown: {
      skillMatch:    skillScore,
      communityBonus,
      categoryBonus,
    },
  };
};

// @desc  Get peer recommendations
// @route GET /api/peers/recommend
const getRecommendations = async (req, res) => {
  try {
    const me = await User.findById(req.user._id);
    const allUsers = await User.find({ _id: { $ne: req.user._id } }).select('-password');

    const accepted = await MentorshipRequest.find({
      $or: [{ sender: me._id }, { receiver: me._id }],
      status: 'Accepted',
    });
    const connectedIds = new Set(
      accepted.map(r => r.sender.toString() === me._id.toString()
        ? r.receiver.toString()
        : r.sender.toString()
      )
    );

    const results = allUsers
      .map(u => {
        const { score, teachMe, iTeach, sameCommunity, scoreBreakdown } = computePeerScore(me, u);
        return {
          user: u,
          score,
          matchedSkills: teachMe,
          canTeach: iTeach,
          isConnected: connectedIds.has(u._id.toString()),
          sameCommunity,
          scoreBreakdown,
        };
      })
      .filter(r => r.score > 0 && (r.matchedSkills.length > 0 || r.canTeach.length > 0))
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    res.json(results);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = { getRecommendations };
