/**
 * communityScoring.js
 * Shared scoring functions used by both authController (auto-assign on register)
 * and communityController (recommend endpoint).
 * Extracted to avoid duplication — no logic changes from existing authController.
 */

const User = require('../models/User');
const { getDominantCategory } = require('../data/skillCategories');

// Jaccard similarity J(A,B) = |A∩B| / |A∪B|
const jaccardSimilarity = (setA, setB) => {
  if (setA.size === 0 && setB.size === 0) return 0;
  const intersection = new Set([...setA].filter(x => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  return intersection.size / union.size;
};

/**
 * Weighted Jaccard:
 *   base  = Jaccard(offered ∪ wanted, communityTags)
 *   bonus = (offeredOverlap / totalOffered) × 0.3   ← skillsOffered get higher weight
 *   range: 0–1.3
 */
const weightedJaccardScore = (skillsOffered, skillsWanted, communityTags) => {
  const offeredSet = new Set(skillsOffered.map(s => s.toLowerCase().trim()));
  const wantedSet  = new Set(skillsWanted.map(s  => s.toLowerCase().trim()));
  const tagSet     = new Set(communityTags.map(t => t.toLowerCase().trim()));
  const userSet    = new Set([...offeredSet, ...wantedSet]);

  const baseScore = jaccardSimilarity(userSet, tagSet);

  let offeredBonus = 0;
  if (offeredSet.size > 0) {
    const offeredOverlap = [...offeredSet].filter(s => tagSet.has(s)).length;
    offeredBonus = (offeredOverlap / offeredSet.size) * 0.3;
  }

  return baseScore + offeredBonus;
};

// Category alignment bonus: +0.15 if user and community share dominant tech category
const categoryBonus = (userSkills, communityTags) => {
  const userCat = getDominantCategory(userSkills);
  const commCat = getDominantCategory(communityTags);
  return (userCat && commCat && userCat === commCat) ? 0.15 : 0;
};

// Role balance bonus: +0.05 if community complements user's role (soft, not enforced)
const roleBonus = async (userRole, members) => {
  if (!members || members.length === 0) return 0;
  // members may be ObjectIds or populated docs
  const ids = members.map(m => (m._id || m));
  const memberDocs = await User.find({ _id: { $in: ids } }).select('role');
  const mentorCount  = memberDocs.filter(m => m.role === 'Mentor').length;
  const learnerCount = memberDocs.filter(m => m.role === 'Learner').length;
  if (userRole === 'Mentor'  && learnerCount > mentorCount)  return 0.05;
  if (userRole === 'Learner' && mentorCount  > learnerCount) return 0.05;
  return 0;
};

module.exports = { jaccardSimilarity, weightedJaccardScore, categoryBonus, roleBonus };
