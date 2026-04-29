const User    = require('../models/User');
const Session  = require('../models/Session');
const Feedback = require('../models/Feedback');
const Endorsement = require('../models/Endorsement');
const { assignCommunity, normaliseSkills } = require('./authController');

// ── Activity-based level inference ──────────────────────────────────────────
/**
 * For each skill, check completed sessions + feedback rating + endorsements.
 * Returns a Map of skillNameLower → { inferredLevel, sessionCount, endorsements, evidence }
 *
 * Rules:
 *   Advanced     : ≥5 sessions teaching this skill AND avg rating ≥ 4.0
 *                  OR ≥3 endorsements for this skill
 *   Intermediate : ≥2 sessions teaching this skill
 *                  OR avg rating ≥ 3.5
 *                  OR ≥1 endorsement
 *   Beginner     : everything else (new skill, self-reported only)
 */
async function inferSkillLevels(userId) {
  const [sessions, feedback, endorsements] = await Promise.all([
    Session.find({ $or: [{ host: userId }, { requester: userId }], status: 'Completed' }).select('topic host'),
    Feedback.find({ toUser: userId }).select('rating'),
    Endorsement.find({ toUser: userId }).select('skill'),
  ]);

  const avgRating = feedback.length > 0
    ? feedback.reduce((s, f) => s + (f.rating || 0), 0) / feedback.length
    : 0;

  // Count sessions where THIS user was the teacher (host)
  const sessionsBySkill = {};
  sessions
    .filter(s => s.host?.toString() === userId.toString())
    .forEach(s => {
      const topic = (s.topic || '').toLowerCase().trim();
      if (topic) sessionsBySkill[topic] = (sessionsBySkill[topic] || 0) + 1;
    });

  // Count endorsements per skill
  const endorsementsBySkill = {};
  endorsements.forEach(e => {
    const skill = (e.skill || '').toLowerCase().trim();
    if (skill) endorsementsBySkill[skill] = (endorsementsBySkill[skill] || 0) + 1;
  });

  return { sessionsBySkill, endorsementsBySkill, avgRating };
}

/**
 * Given a skill name and inference data, return the inferred level + evidence string.
 * The user's manually-set level is ALWAYS preserved — inference only suggests
 * when the evidence supports upgrading beyond what the user has set.
 */
function resolveSkillLevel(skillName, manualLevel, { sessionsBySkill, endorsementsBySkill, avgRating }) {
  const lower  = (skillName || '').toLowerCase().trim();
  const taught  = sessionsBySkill[lower] || 0;
  const endorsed = endorsementsBySkill[lower] || 0;

  let inferredLevel = 'Beginner';
  let evidence = null;

  if ((taught >= 5 && avgRating >= 4.0) || endorsed >= 3) {
    inferredLevel = 'Advanced';
    evidence = taught >= 5 ? `${taught} sessions taught · ${avgRating.toFixed(1)}★` : `${endorsed} endorsements`;
  } else if (taught >= 2 || avgRating >= 3.5 || endorsed >= 1) {
    inferredLevel = 'Intermediate';
    evidence = taught >= 2 ? `${taught} sessions taught` : endorsed >= 1 ? `${endorsed} endorsement` : `${avgRating.toFixed(1)}★ avg rating`;
  }

  // Determine which is "higher" — user cannot be demoted by inference
  const ORDER = { Beginner: 0, Intermediate: 1, Advanced: 2 };
  const manualRank = ORDER[manualLevel] ?? 0;
  const inferRank  = ORDER[inferredLevel] ?? 0;

  const finalLevel  = inferRank > manualRank ? inferredLevel : manualLevel;
  const suggestion  = inferRank > manualRank ? inferredLevel : null; // suggest upgrade if applicable

  return { finalLevel, suggestion, evidence };
}

// @desc    Get logged-in user's profile — with inferred skill levels
// @route   GET /api/users/profile
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password')
      .populate('community', 'name tags members');

    if (!user) return res.status(404).json({ message: 'User not found' });

    // Run inference
    const inferData = await inferSkillLevels(req.user._id);

    // Attach inference metadata to each skill — client uses this for badge display
    const enrichSkills = (skills) => skills.map(s => {
      const name = typeof s === 'string' ? s : (s.name || '');
      const manualLevel = typeof s === 'string' ? 'Beginner' : (s.level || 'Beginner');
      const { finalLevel, suggestion, evidence } = resolveSkillLevel(name, manualLevel, inferData);
      return {
        name,
        level: finalLevel,           // best of manual + inferred
        manualLevel,                 // what user set themselves
        suggestion,                  // non-null if inference suggests upgrading
        evidence,                    // human-readable reason e.g. "3 sessions taught"
      };
    });

    const enriched = user.toObject();
    enriched.skillsOffered = enrichSkills(user.skillsOffered);
    enriched.skillsWanted  = enrichSkills(user.skillsWanted);

    res.json(enriched);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update logged-in user's profile
// @route   PUT /api/users/profile
const updateProfile = async (req, res) => {
  try {
    const { name, bio, skillsOffered, skillsWanted, role } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (name) user.name = name;
    if (bio !== undefined) user.bio = bio;
    if (role) user.role = role;
    // Normalise to {name,level}[] format
    if (skillsOffered) user.skillsOffered = normaliseSkills(skillsOffered);
    if (skillsWanted)  user.skillsWanted  = normaliseSkills(skillsWanted);

    if (skillsOffered || skillsWanted) {
      if (user.community) {
        const Community = require('../models/Community');
        await Community.findByIdAndUpdate(user.community, { $pull: { members: user._id } });
        user.community = null;
      }
      await user.save();
      await assignCommunity(user);
    } else {
      await user.save();
    }

    const updated = await User.findById(user._id)
      .select('-password')
      .populate('community', 'name tags');

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get all users
// @route   GET /api/users
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password').populate('community', 'name');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (req.user._id.toString() === id) {
      return res.status(400).json({ message: 'You cannot delete your own account via this endpoint.' });
    }

    await User.findByIdAndDelete(id);
    res.json({ message: `User "${user.name}" (${user.email}) deleted successfully.` });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
module.exports = { getProfile, updateProfile, getAllUsers, inferSkillLevels, deleteUser };