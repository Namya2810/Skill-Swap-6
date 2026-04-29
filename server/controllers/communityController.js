const Community = require('../models/Community');
const User = require('../models/User');
const { weightedJaccardScore, categoryBonus, roleBonus } = require('./communityScoring');
const { getDominantCategory } = require('../data/skillCategories');

// Helper: extract skill name regardless of string or {name,level} object
const skillName = s => (typeof s === 'string' ? s : s.name || '').toLowerCase().trim();

// ── Thresholds ──────────────────────────────────────────────────────────────
// FIXED: Was 0.30 — too high. Jaccard on small sets (3-5 skills vs 6-8 tags)
// rarely exceeds 0.20 even for good matches. Use 0.10 as meaningful threshold.
// Category alignment (+0.15) and role bonus (+0.05) push good matches above this.
const STRONG_MATCH_THRESHOLD = 0.08;   // score >= 0.08 → show as recommended
const BEST_MATCH_THRESHOLD   = 0.35;   // score >= 0.35 → label as "Best Match"
const LOW_MATCH_LABEL_CUTOFF = 0.03;   // score < 0.03 → "Very low match"

// @desc  Get current user's community + members
// @route GET /api/community
const getMyCommunity = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('community');
    if (!user.community) return res.json({ community: null, members: [] });

    const community = await Community.findById(user.community._id).populate('members', '-password');
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
// @route GET /api/community/all
const getAllCommunities = async (req, res) => {
  try {
    const communities = await Community.find({}).populate('members', 'name role skillsOffered skillsWanted');
    res.json(communities);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @desc  Get top 3 recommended communities for current user (threshold-filtered)
// @route GET /api/community/recommend
const getRecommendedCommunities = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    // Normalise skill lists
    const offeredNames = (user.skillsOffered || []).map(skillName).filter(Boolean);
    const wantedNames  = (user.skillsWanted  || []).map(skillName).filter(Boolean);
    const allSkills    = [...offeredNames, ...wantedNames];

    if (allSkills.length === 0) {
      return res.json({
        recommendations: [],
        canCreate: false,
        noSkills: true,
        message: 'Add skills to your profile first',
      });
    }

    const communities = await Community.find({}).populate('members', 'role');
    const scored = [];

    for (const comm of communities) {
      const commTagsLower = (comm.tags || []).map(t => t.toLowerCase().trim());
      const commTagSet = new Set(commTagsLower);

      // ── Score computation ──────────────────────────────────────────
      let score = weightedJaccardScore(offeredNames, wantedNames, commTagsLower);
      score += categoryBonus(allSkills, commTagsLower);
      score += await roleBonus(user.role, comm.members);
      score = parseFloat(score.toFixed(4));

      // DEBUG: log score so developers can verify Jaccard calculation
      console.log(`[Community scoring] "${comm.name}" → score=${score.toFixed(4)} | userSkills=${JSON.stringify(allSkills.slice(0,4))} | commTags=${JSON.stringify(commTagsLower.slice(0,4))}`);

      // ── Similarity chips (why this match?) ───────────────────────
      const matchedOffered = offeredNames.filter(s => commTagSet.has(s));
      const matchedWanted  = wantedNames.filter(s => commTagSet.has(s));

      const userCat = getDominantCategory(allSkills);
      const commCat = getDominantCategory(commTagsLower);
      const categoryAligned = userCat && commCat && userCat === commCat;

      const mentorCount  = comm.members.filter(m => m.role === 'Mentor').length;
      const learnerCount = comm.members.filter(m => m.role === 'Learner').length;
      let roleBalanceChip = null;
      if (user.role === 'Mentor'  && learnerCount > mentorCount)  roleBalanceChip = 'Learner demand ✓';
      if (user.role === 'Learner' && mentorCount  > learnerCount) roleBalanceChip = 'Mentor demand ✓';

      const similarityChips = [];
      matchedOffered.slice(0, 3).forEach(s => similarityChips.push({ label: `${s} ✓`, type: 'skill-offered' }));
      matchedWanted.slice(0, 2).forEach(s => similarityChips.push({ label: `wants ${s} ✓`, type: 'skill-wanted' }));
      if (categoryAligned) similarityChips.push({ label: `${userCat} ✓`, type: 'category' });
      if (roleBalanceChip) similarityChips.push({ label: roleBalanceChip, type: 'role' });

      // ── Threshold-based match quality label ─────────────────────
      // FIX: don't claim "Best Match" for weak scores
      let matchQuality;
      if (score >= BEST_MATCH_THRESHOLD)          matchQuality = 'best';
      else if (score >= STRONG_MATCH_THRESHOLD)   matchQuality = 'strong';
      else if (score >= LOW_MATCH_LABEL_CUTOFF)   matchQuality = 'weak';
      else                                        matchQuality = 'none';

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

    // FIX: Only include communities with a meaningful score (>= threshold)
    const strongMatches = scored.filter(c => c.score >= STRONG_MATCH_THRESHOLD).slice(0, 3);

    // Decide if user can create a community
    // canCreate = true when no strong match exists
    const canCreate = strongMatches.length === 0;

    // If no strong matches, provide weak suggestions anyway (top 3 regardless) 
    // but flag them as weak so the UI can handle them differently
    const weakSuggestions = strongMatches.length === 0
      ? scored.filter(c => c.score > 0).slice(0, 3)
      : [];

    res.json({
      recommendations: strongMatches,
      weakSuggestions,
      canCreate,
      noStrongMatch: strongMatches.length === 0,
      message: strongMatches.length === 0
        ? 'No strong community match found for your skill set.'
        : null,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @desc  User manually joins a recommended community
// @route PUT /api/community/join
const joinCommunity = async (req, res) => {
  try {
    const { communityId } = req.body;
    if (!communityId) return res.status(400).json({ message: 'communityId required' });

    const user = await User.findById(req.user._id);
    const community = await Community.findById(communityId);
    if (!community) return res.status(404).json({ message: 'Community not found' });

    if (user.community && user.community.toString() !== communityId) {
      await Community.findByIdAndUpdate(user.community, { $pull: { members: user._id } });
    }

    const memberIds = community.members.map(m => m.toString());
    if (!memberIds.includes(user._id.toString())) {
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

// @desc  Create a new community — triggered when no strong match exists
// @route POST /api/community/create
const createCommunity = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name?.trim()) return res.status(400).json({ message: 'Community name is required' });

    const user = await User.findById(req.user._id);
    const offeredNames = (user.skillsOffered || []).map(skillName).filter(Boolean);
    const wantedNames  = (user.skillsWanted  || []).map(skillName).filter(Boolean);
    const allSkills    = [...new Set([...offeredNames, ...wantedNames])];

    if (allSkills.length === 0) {
      return res.status(400).json({ message: 'Add skills to your profile before creating a community' });
    }

    const existing = await Community.findOne({ name: { $regex: new RegExp(`^${name.trim()}$`, 'i') } });
    if (existing) return res.status(400).json({ message: 'A community with this name already exists' });

    // Generate broad tags: user skills + category keywords so future users match in
    // This is why React + Python in same community is CORRECT — both map to the same user
    const { SKILL_CATEGORIES, getDominantCategory } = require('../data/skillCategories');
    const dominantCat = getDominantCategory(allSkills);

    // Pull up to 4 representative skills from dominant category
    let categoryTags = [];
    if (dominantCat && SKILL_CATEGORIES[dominantCat]) {
      // Pick the most common skills from that category as additional tags
      categoryTags = SKILL_CATEGORIES[dominantCat].slice(0, 4);
    }

    // Final tags: actual user skills (higher weight in matching) + category context
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
      community: {
        _id: community._id,
        name: community.name,
        tags: community.tags,
        memberCount: 1,
      },
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = { getMyCommunity, getAllCommunities, getRecommendedCommunities, joinCommunity, createCommunity };
