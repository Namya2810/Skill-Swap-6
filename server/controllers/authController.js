const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Community = require('../models/Community');
const { getDominantCategory } = require('../data/skillCategories');
const { weightedJaccardScore, categoryBonus, roleBonus } = require('./communityScoring');

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });

// Helper: normalise skills — accepts string[] or {name,level}[] → returns names as string[]
const toNameArray = (skills) =>
  (skills || []).map(s => (typeof s === 'string' ? s : s.name || '').toLowerCase().trim()).filter(Boolean);

// @route POST /api/auth/register
const registerUser = async (req, res) => {
  try {
    const { name, email, password, role, skillsOffered, skillsWanted, bio } = req.body;
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'User already exists with this email' });

    // Normalise: accept both string[] and {name,level}[] from client
    const normOffered = normaliseSkills(skillsOffered);
    const normWanted  = normaliseSkills(skillsWanted);

    const user = await User.create({
      name, email, password,
      role: role || 'Learner',
      skillsOffered: normOffered,
      skillsWanted:  normWanted,
      bio: bio || '',
    });

    await assignCommunity(user);

    res.status(201).json({
      _id: user._id, name: user.name, email: user.email, role: user.role,
      skillsOffered: user.skillsOffered, skillsWanted: user.skillsWanted,
      bio: user.bio, community: user.community, token: generateToken(user._id),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @route POST /api/auth/login
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).populate('community', 'name');
    if (!user) return res.status(401).json({ message: 'Invalid email or password' });
    const isMatch = await user.matchPassword(password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid email or password' });

    res.json({
      _id: user._id, name: user.name, email: user.email, role: user.role,
      skillsOffered: user.skillsOffered, skillsWanted: user.skillsWanted,
      bio: user.bio, community: user.community, token: generateToken(user._id),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

/**
 * normaliseSkills — accepts either string[] (legacy) or {name,level}[] (new format).
 * Always returns {name, level}[] for storage.
 */
const normaliseSkills = (skills) => {
  if (!skills || !Array.isArray(skills)) return [];
  return skills.map(s => {
    if (typeof s === 'string') return { name: s.trim(), level: 'Beginner' };
    const level = ['Beginner', 'Intermediate', 'Advanced'].includes(s.level) ? s.level : 'Beginner';
    return { name: (s.name || '').trim(), level };
  }).filter(s => s.name.length > 0);
};

/**
 * assignCommunity — auto-assigns on register / profile update.
 */
const assignCommunity = async (user) => {
  try {
    const offeredNames = toNameArray(user.skillsOffered);
    const wantedNames  = toNameArray(user.skillsWanted);
    const allSkills    = [...offeredNames, ...wantedNames];

    if (allSkills.length === 0) return;

    const communities = await Community.find({});
    let bestMatch = null;
    let bestScore = 0;

    for (const comm of communities) {
      let score = weightedJaccardScore(offeredNames, wantedNames, comm.tags);
      score += categoryBonus(allSkills, comm.tags);
      score += await roleBonus(user.role, comm.members);

      console.log(`[Community] "${comm.name}" score: ${score.toFixed(4)}`);
      if (score > bestScore) { bestScore = score; bestMatch = comm; }
    }

    if (bestMatch && bestScore > 0) {
      bestMatch.members.push(user._id);
      const existingTags = new Set(bestMatch.tags.map(t => t.toLowerCase()));
      const newTags = allSkills.filter(s => !existingTags.has(s));
      bestMatch.tags = [...bestMatch.tags, ...newTags].slice(0, 10);
      await bestMatch.save();
      user.community = bestMatch._id;
      console.log(`[Community] "${user.name}" → joined "${bestMatch.name}" (${bestScore.toFixed(4)})`);
    } else {
      const dominantCat = getDominantCategory(allSkills);
      const communityName = dominantCat
        ? `${dominantCat} Community`
        : `${capitalize(allSkills[0])} Community`;

      const newComm = await Community.create({
        name: communityName,
        tags: allSkills.slice(0, 8),
        members: [user._id],
      });
      user.community = newComm._id;
      console.log(`[Community] "${user.name}" → created "${communityName}"`);
    }

    await user.save();
  } catch (err) {
    console.error('[Community] Assignment error:', err.message);
  }
};

const capitalize = (str) => str ? str.charAt(0).toUpperCase() + str.slice(1) : '';

module.exports = { registerUser, loginUser, assignCommunity, normaliseSkills };
