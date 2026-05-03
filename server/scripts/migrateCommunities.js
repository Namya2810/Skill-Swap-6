/**
 * migrateCommunities.js
 * ─────────────────────────────────────────────────────────────────────────────
 * One-time script that reassigns every user to the community that best matches
 * their skills using the same weighted Jaccard scoring used by the live app.
 *
 * WHAT IT DOES:
 *   1. Loads every user from MongoDB
 *   2. Loads every community
 *   3. For each user → finds the best-matching community (score >= threshold)
 *   4. If a good match exists  → moves user to that community
 *   5. If no good match exists → creates a NEW community from their skills
 *   6. Users with NO skills at all → left in their current community (untouched)
 *   7. Cleans up empty communities at the end
 *
 * SAFE TO RUN:
 *   - Dry-run mode by default (set DRY_RUN=false to actually save changes)
 *   - Logs every decision so you can review before committing
 *   - Does NOT delete any messages, posts, or session history
 *   - Can be run multiple times safely (idempotent)
 *
 * HOW TO RUN:
 *   cd server
 *   node scripts/migrateCommunities.js             ← dry run (preview only)
 *   DRY_RUN=false node scripts/migrateCommunities.js  ← actually saves changes
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

require('dotenv').config({ path: '../.env' });
const mongoose  = require('mongoose');
const User      = require('../models/User');
const Community = require('../models/Community');
const { SKILL_CATEGORIES, getSkillCategory, getDominantCategory } = require('../data/skillCategories');

// ── Config ───────────────────────────────────────────────────────────────────
const DRY_RUN           = process.env.DRY_RUN !== 'false'; // default: dry run
const STRONG_THRESHOLD  = 0.12;   // minimum score to call it a real match
const MAX_COMMUNITY_SIZE = 20;    // soft cap — won't create new comm if existing fits

// ── Colours for terminal output ───────────────────────────────────────────────
const C = {
  reset:  '\x1b[0m',
  bold:   '\x1b[1m',
  green:  '\x1b[32m',
  yellow: '\x1b[33m',
  blue:   '\x1b[34m',
  cyan:   '\x1b[36m',
  red:    '\x1b[31m',
  grey:   '\x1b[90m',
};

const log  = (msg)        => console.log(msg);
const ok   = (msg)        => console.log(`  ${C.green}✓${C.reset} ${msg}`);
const warn = (msg)        => console.log(`  ${C.yellow}⚠${C.reset} ${msg}`);
const info = (msg)        => console.log(`  ${C.blue}→${C.reset} ${msg}`);
const skip = (msg)        => console.log(`  ${C.grey}–${C.reset} ${C.grey}${msg}${C.reset}`);
const err  = (msg)        => console.log(`  ${C.red}✗${C.reset} ${msg}`);
const sep  = ()           => console.log(`${C.grey}${'─'.repeat(70)}${C.reset}`);

// ── Scoring (mirrors communityController.js exactly) ─────────────────────────
const skillName = s => (typeof s === 'string' ? s : s?.name || '').toLowerCase().trim();

function jaccardSimilarity(setA, setB) {
  if (setA.size === 0 && setB.size === 0) return 0;
  const intersection = [...setA].filter(x => setB.has(x)).length;
  const union        = new Set([...setA, ...setB]).size;
  return intersection / union;
}

function weightedJaccardScore(offeredNames, wantedNames, commTags) {
  const offeredSet = new Set(offeredNames);
  const wantedSet  = new Set(wantedNames);
  const tagSet     = new Set(commTags);
  const userSet    = new Set([...offeredSet, ...wantedSet]);

  const base = jaccardSimilarity(userSet, tagSet);

  let offeredBonus = 0;
  if (offeredSet.size > 0) {
    const overlap   = [...offeredSet].filter(s => tagSet.has(s)).length;
    offeredBonus    = (overlap / offeredSet.size) * 0.3;
  }
  return base + offeredBonus;
}

function categoryBonus(userSkills, commTags) {
  const userCat = getDominantCategory(userSkills);
  const commCat = getDominantCategory(commTags);
  return (userCat && commCat && userCat === commCat) ? 0.15 : 0;
}

function scoreUserAgainstCommunity(offeredNames, wantedNames, commTags) {
  const allSkills = [...offeredNames, ...wantedNames];
  let score = weightedJaccardScore(offeredNames, wantedNames, commTags);
  score    += categoryBonus(allSkills, commTags);
  return parseFloat(score.toFixed(4));
}

// ── Build community tags from user skills ─────────────────────────────────────
function buildCommunityTags(offeredNames, wantedNames) {
  const allSkills    = [...new Set([...offeredNames, ...wantedNames])];
  const dominantCat  = getDominantCategory(allSkills);
  const categoryTags = dominantCat && SKILL_CATEGORIES[dominantCat]
    ? SKILL_CATEGORIES[dominantCat].slice(0, 5)
    : [];

  return [...new Set([
    ...offeredNames.slice(0, 5),
    ...wantedNames.slice(0, 3),
    ...categoryTags,
  ])].slice(0, 12);
}

// ── Generate a meaningful community name ──────────────────────────────────────
function suggestCommunityName(offeredNames, wantedNames, existingNames) {
  const allSkills   = [...offeredNames, ...wantedNames];
  const dominantCat = getDominantCategory(allSkills);

  // Map category → readable prefix
  const CAT_NAMES = {
    'Frontend Development':  'Frontend',
    'Backend Development':   'Backend',
    'Machine Learning & AI': 'AI / ML',
    'Data Science':          'Data Science',
    'DevOps & Cloud':        'DevOps',
    'Database':              'Database',
    'Mobile Development':    'Mobile',
    'Cybersecurity':         'Security',
    'Blockchain':            'Blockchain',
    'Game Development':      'Game Dev',
  };

  const prefix = CAT_NAMES[dominantCat] || (offeredNames[0]
    ? offeredNames[0].charAt(0).toUpperCase() + offeredNames[0].slice(1)
    : 'General');

  // Make name unique if it already exists
  let name = `${prefix} Community`;
  let i = 2;
  while (existingNames.has(name.toLowerCase())) {
    name = `${prefix} Community ${i}`;
    i++;
  }
  return name;
}

// ── Main Migration ────────────────────────────────────────────────────────────
async function migrate() {
  // ── Connect ────────────────────────────────────────────────────────────────
  await mongoose.connect(process.env.MONGO_URI);
  log(`\n${C.bold}${C.cyan}SkillLink Community Migration${C.reset}`);
  log(DRY_RUN
    ? `${C.yellow}${C.bold}DRY RUN MODE — no changes will be saved${C.reset}\n`
    : `${C.red}${C.bold}LIVE MODE — changes WILL be saved to MongoDB${C.reset}\n`);
  sep();

  // ── Load data ──────────────────────────────────────────────────────────────
  const [allUsers, allCommunities] = await Promise.all([
    User.find({}).lean(),
    Community.find({}).lean(),
  ]);

  log(`${C.bold}Loaded:${C.reset} ${allUsers.length} users, ${allCommunities.length} communities\n`);

  // Track changes we'll apply at the end
  // { userId → communityId }  (new assignment)
  const assignments = new Map();
  // Communities to create: [{ name, tags, memberUserIds[] }]
  const toCreate = [];
  // Community member lists we'll rebuild
  const communityMembers = {}; // communityId → Set of userIds
  allCommunities.forEach(c => {
    communityMembers[c._id.toString()] = new Set(
      (c.members || []).map(m => m.toString())
    );
  });

  // Existing community names (lowercase) for uniqueness check
  const existingCommunityNames = new Set(
    allCommunities.map(c => c.name.toLowerCase())
  );

  // ── Per-user decisions ─────────────────────────────────────────────────────
  let movedCount   = 0;
  let stayedCount  = 0;
  let createdCount = 0;
  let skippedCount = 0;

  for (const user of allUsers) {
    const offeredNames = (user.skillsOffered || []).map(skillName).filter(Boolean);
    const wantedNames  = (user.skillsWanted  || []).map(skillName).filter(Boolean);
    const allSkills    = [...offeredNames, ...wantedNames];

    log(`${C.bold}${user.name}${C.reset} ${C.grey}<${user.email}>${C.reset}`);

    // ── No skills → skip ──────────────────────────────────────────────────
    if (allSkills.length === 0) {
      skip(`No skills — leaving in current community`);
      skippedCount++;
      log('');
      continue;
    }

    info(`Skills: ${allSkills.slice(0, 5).join(', ')}${allSkills.length > 5 ? ` +${allSkills.length - 5} more` : ''}`);

    // ── Score against all existing communities ────────────────────────────
    const scored = allCommunities.map(comm => {
      const commTags = (comm.tags || []).map(t => t.toLowerCase().trim());
      const score    = scoreUserAgainstCommunity(offeredNames, wantedNames, commTags);
      return { comm, score };
    }).sort((a, b) => b.score - a.score);

    const best      = scored[0];
    const bestScore = best ? best.score : 0;
    const bestComm  = best ? best.comm  : null;

    // ── Strong match found ────────────────────────────────────────────────
    if (bestScore >= STRONG_THRESHOLD && bestComm) {
      const bestId      = bestComm._id.toString();
      const currentId   = user.community?.toString();

      if (currentId === bestId) {
        ok(`Already in correct community: "${bestComm.name}" (score: ${bestScore})`);
        stayedCount++;
      } else {
        const currentName = allCommunities.find(c => c._id.toString() === currentId)?.name || 'none';
        ok(`Move: "${currentName}" → "${bestComm.name}" (score: ${bestScore})`);
        assignments.set(user._id.toString(), bestId);

        // Update in-memory member sets
        if (currentId && communityMembers[currentId]) {
          communityMembers[currentId].delete(user._id.toString());
        }
        if (!communityMembers[bestId]) communityMembers[bestId] = new Set();
        communityMembers[bestId].add(user._id.toString());
        movedCount++;
      }

    // ── No strong match → create new community ────────────────────────────
    } else {
      // Check if any pending "toCreate" community matches this user
      let matched = false;
      for (const pending of toCreate) {
        const pendingTags = pending.tags.map(t => t.toLowerCase());
        const score = scoreUserAgainstCommunity(offeredNames, wantedNames, pendingTags);
        if (score >= STRONG_THRESHOLD) {
          warn(`No existing match (best: ${bestScore}) → joining pending new community "${pending.name}" (score: ${score})`);
          pending.memberUserIds.push(user._id.toString());
          assignments.set(user._id.toString(), pending.tempId);
          matched = true;
          movedCount++;
          break;
        }
      }

      if (!matched) {
        const newName = suggestCommunityName(offeredNames, wantedNames, existingCommunityNames);
        const newTags = buildCommunityTags(offeredNames, wantedNames);
        const tempId  = `new_${toCreate.length}`;

        warn(`No existing match (best: ${bestScore}) → will create "${newName}"`);
        info(`Tags: ${newTags.slice(0, 6).join(', ')}`);

        existingCommunityNames.add(newName.toLowerCase());
        toCreate.push({ tempId, name: newName, tags: newTags, memberUserIds: [user._id.toString()] });
        assignments.set(user._id.toString(), tempId);
        createdCount++;
      }
    }

    log('');
  }

  // ── Summary before applying ───────────────────────────────────────────────
  sep();
  log(`${C.bold}Summary:${C.reset}`);
  log(`  ${C.green}✓ Staying in correct community:${C.reset}  ${stayedCount} users`);
  log(`  ${C.blue}→ Being moved to better community:${C.reset} ${movedCount} users`);
  log(`  ${C.yellow}+ New communities to create:${C.reset}      ${toCreate.length} (for ${createdCount} users)`);
  log(`  ${C.grey}– Skipped (no skills):${C.reset}            ${skippedCount} users`);
  sep();

  if (DRY_RUN) {
    log(`\n${C.yellow}${C.bold}DRY RUN complete — nothing was saved.${C.reset}`);
    log(`Run with ${C.cyan}DRY_RUN=false node scripts/migrateCommunities.js${C.reset} to apply.\n`);
    await mongoose.disconnect();
    return;
  }

  // ── Apply changes ─────────────────────────────────────────────────────────
  log(`\n${C.bold}Applying changes...${C.reset}\n`);

  // 1. Create new communities first (so we have real IDs)
  const tempIdToRealId = {};
  for (const pending of toCreate) {
    const created = await Community.create({
      name:    pending.name,
      tags:    pending.tags,
      members: [],
    });
    tempIdToRealId[pending.tempId] = created._id.toString();
    ok(`Created community: "${pending.name}" (${pending.tags.slice(0,4).join(', ')})`);
  }

  // 2. Update user community assignments
  const bulkUserOps = [];
  for (const [userId, communityIdOrTemp] of assignments.entries()) {
    const realCommunityId = tempIdToRealId[communityIdOrTemp] || communityIdOrTemp;
    bulkUserOps.push({
      updateOne: {
        filter: { _id: userId },
        update: { $set: { community: realCommunityId } },
      },
    });
  }
  if (bulkUserOps.length > 0) {
    await User.bulkWrite(bulkUserOps);
    ok(`Updated ${bulkUserOps.length} user community assignments`);
  }

  // 3. Rebuild community members arrays from scratch (guaranteed accurate)
  log('\nRebuilding community member lists...');
  const allUsersUpdated = await User.find({ community: { $ne: null } }).select('community').lean();
  const communityMembersFinal = {};
  for (const u of allUsersUpdated) {
    const cId = u.community.toString();
    if (!communityMembersFinal[cId]) communityMembersFinal[cId] = [];
    communityMembersFinal[cId].push(u._id);
  }

  const bulkCommOps = [];
  const allFinalCommunities = await Community.find({}).lean();
  for (const comm of allFinalCommunities) {
    const members = communityMembersFinal[comm._id.toString()] || [];
    bulkCommOps.push({
      updateOne: {
        filter: { _id: comm._id },
        update: { $set: { members } },
      },
    });
  }
  if (bulkCommOps.length > 0) {
    await Community.bulkWrite(bulkCommOps);
    ok(`Rebuilt member lists for ${bulkCommOps.length} communities`);
  }

  // 4. Delete communities that ended up empty
  const emptyCommunities = await Community.find({ members: { $size: 0 } });
  if (emptyCommunities.length > 0) {
    const emptyIds = emptyCommunities.map(c => c._id);
    await Community.deleteMany({ _id: { $in: emptyIds } });
    warn(`Deleted ${emptyCommunities.length} empty communities: ${emptyCommunities.map(c => c.name).join(', ')}`);
  }

  // ── Final report ──────────────────────────────────────────────────────────
  sep();
  const finalCommunities = await Community.find({})
    .populate('members', 'name')
    .lean();

  log(`\n${C.bold}Final community state:${C.reset}`);
  for (const comm of finalCommunities) {
    log(`\n  ${C.cyan}${comm.name}${C.reset} (${comm.members.length} members)`);
    log(`  Tags: ${(comm.tags || []).slice(0, 6).join(', ')}`);
    comm.members.forEach(m => log(`    ${C.grey}· ${m.name}${C.reset}`));
  }

  sep();
  log(`\n${C.bold}${C.green}Migration complete!${C.reset}\n`);
  await mongoose.disconnect();
}

// ── Run ───────────────────────────────────────────────────────────────────────
migrate().catch(e => {
  err(`Migration failed: ${e.message}`);
  console.error(e);
  process.exit(1);
});
