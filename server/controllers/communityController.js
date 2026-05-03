const Community = require('../models/Community');
const User = require('../models/User');
const { weightedJaccardScore, categoryBonus, roleBonus } = require('./communityScoring');
const { getDominantCategory, SKILL_CATEGORIES } = require('../data/skillCategories');

const skillName = s => (typeof s === 'string' ? s : s?.name || '').toLowerCase().trim();

// ── Thresholds ─────────────────────────────────────────────────────────────
// Weighted Jaccard + bonuses can produce 0–1.35
// A score of 0.12 means at least 1 shared skill in a small set → meaningful
const STRONG_MATCH_THRESHOLD = 0.12;
const BEST_MATCH_THRESHOLD   = 0.40;

// @desc  Get current user's community + members
const getMyCommunity = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('community');
    if (!user.community) return res.json({ community: null, members: [] });

    const community = await Community.findById(user.community._id)
      .populate('members', '-password');
    if (!community) {
      await User.findByIdAndUpdate(req.user._id, { $unset: { community: 1 } });
      return res.json({ community: null, members: [] });
    }

    res.json({
      community: {
        _id: community._id,
        name: community.name,
        tags: community.tags,
        memberCount: community.members.length,
      },
      members: community.members.filter(m => m._id.toString() !== req.user._id.toString()),
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @desc  Get all communities
const getAllCommunities = async (req, res) => {
  try {
    const communities = await Community.find({})
      .populate('members', 'name role skillsOffered skillsWanted');
    res.json(communities);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @desc  Get recommended communities (above threshold only)
const getRecommendedCommunities = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const offeredNames = (user.skillsOffered || []).map(skillName).filter(Boolean);
    const wantedNames  = (user.skillsWanted  || []).map(skillName).filter(Boolean);
    const allSkills    = [...offeredNames, ...wantedNames];

    if (allSkills.length === 0) {
      return res.json({ recommendations: [], canCreate: false, noSkills: true });
    }

    const communities = await Community.find({}).populate('members', 'role');
    const scored = [];

    for (const comm of communities) {
      const commTagsLower = (comm.tags || []).map(t => t.toLowerCase().trim());
      const commTagSet    = new Set(commTagsLower);

      let score = weightedJaccardScore(offeredNames, wantedNames, commTagsLower);
      score += categoryBonus(allSkills, commTagsLower);
      score += await roleBonus(user.role, comm.members);
      score = parseFloat(score.toFixed(4));

      const matchedOffered = offeredNames.filter(s => commTagSet.has(s));
      const matchedWanted  = wantedNames.filter(s  => commTagSet.has(s));
      const userCat = getDominantCategory(allSkills);
      const commCat = getDominantCategory(commTagsLower);

      const similarityChips = [];
      matchedOffered.slice(0, 3).forEach(s => similarityChips.push({ label: `${s} ✓`, type: 'skill-offered' }));
      matchedWanted.slice(0, 2).forEach(s  => similarityChips.push({ label: `wants ${s} ✓`, type: 'skill-wanted' }));
      if (userCat && commCat && userCat === commCat) similarityChips.push({ label: `${userCat} ✓`, type: 'category' });

      let matchQuality;
      if (score >= BEST_MATCH_THRESHOLD)        matchQuality = 'best';
      else if (score >= STRONG_MATCH_THRESHOLD) matchQuality = 'strong';
      else                                      matchQuality = 'weak';

      scored.push({
        _id: comm._id,
        name: comm.name,
        tags: comm.tags,
        memberCount: comm.members.length,
        score,
        matchQuality,
        similarityChips,
        sharedSkillCount: matchedOffered.length + matchedWanted.length,
      });
    }

    scored.sort((a, b) => b.score - a.score);

    // Only communities above threshold count as real recommendations
    const strongMatches = scored
      .filter(c => c.score >= STRONG_MATCH_THRESHOLD)
      .slice(0, 3);

    // FIX: canCreate = true only when NO strong match exists
    const canCreate = strongMatches.length === 0;

    // Weak suggestions (only shown when no strong match found)
    const weakSuggestions = canCreate
      ? scored.filter(c => c.score > 0 && c.score < STRONG_MATCH_THRESHOLD).slice(0, 3)
      : [];

    res.json({
      recommendations: strongMatches,
      weakSuggestions,
      canCreate,
      noStrongMatch: strongMatches.length === 0,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @desc  Join a community (with proper switch handling)
const joinCommunity = async (req, res) => {
  try {
    const { communityId } = req.body;
    if (!communityId) return res.status(400).json({ message: 'communityId required' });

    const user      = await User.findById(req.user._id);
    const community = await Community.findById(communityId);
    if (!community) return res.status(404).json({ message: 'Community not found' });

    // Remove from old community
    if (user.community && user.community.toString() !== communityId) {
      await Community.findByIdAndUpdate(user.community, { $pull: { members: user._id } });
    }

    if (!community.members.map(m => m.toString()).includes(user._id.toString())) {
      community.members.push(user._id);
      await community.save();
    }

    user.community = community._id;
    await user.save();

    const updated = await User.findById(user._id).select('-password').populate('community', 'name tags');
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @desc  Create community (only when canCreate is true — no strong match)
const createCommunity = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name?.trim()) return res.status(400).json({ message: 'Community name is required' });

    const user = await User.findById(req.user._id);
    const offeredNames = (user.skillsOffered || []).map(skillName).filter(Boolean);
    const wantedNames  = (user.skillsWanted  || []).map(skillName).filter(Boolean);
    const allSkills    = [...new Set([...offeredNames, ...wantedNames])];

    if (allSkills.length === 0)
      return res.status(400).json({ message: 'Add skills to your profile before creating a community' });

    const existing = await Community.findOne({
      name: { $regex: new RegExp(`^${name.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
    });
    if (existing) return res.status(400).json({ message: 'A community with this name already exists' });

    // Build broad tag set: user skills + top skills from dominant category
    const dominantCat = getDominantCategory(allSkills);
    const categoryTags = dominantCat && SKILL_CATEGORIES[dominantCat]
      ? SKILL_CATEGORIES[dominantCat].slice(0, 5)
      : [];

    const autoTags = [...new Set([
      ...offeredNames.slice(0, 5),
      ...wantedNames.slice(0, 3),
      ...categoryTags,
    ])].slice(0, 12);

    const community = await Community.create({
      name: name.trim(),
      tags: autoTags,
      members: [user._id],
    });

    if (user.community) {
      await Community.findByIdAndUpdate(user.community, { $pull: { members: user._id } });
    }
    user.community = community._id;
    await user.save();

    res.status(201).json({
      community: { _id: community._id, name: community.name, tags: community.tags, memberCount: 1 },
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = { getMyCommunity, getAllCommunities, getRecommendedCommunities, joinCommunity, createCommunity };
