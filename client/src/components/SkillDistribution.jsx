import { useMemo } from 'react';
import { SKILL_CATEGORIES } from '../data/skills';

// ── Category config ────────────────────────────────────────────────────────
const CATEGORIES = [
  { key: 'Frontend',  label: 'Frontend',   color: '#3b82f6', icon: '⬡', keywords: ['Frontend Development'] },
  { key: 'Backend',   label: 'Backend',    color: '#10b981', icon: '⬡', keywords: ['Backend Development', 'Software Engineering'] },
  { key: 'AI / ML',   label: 'AI / ML',    color: '#8b5cf6', icon: '⬡', keywords: ['Machine Learning & AI', 'Data Science'] },
  { key: 'DevOps',    label: 'DevOps',     color: '#06b6d4', icon: '⬡', keywords: ['DevOps & Cloud'] },
  { key: 'Database',  label: 'Database',   color: '#f59e0b', icon: '⬡', keywords: ['Database'] },
  { key: 'Mobile',    label: 'Mobile',     color: '#f472b6', icon: '⬡', keywords: ['Mobile Development'] },
  { key: 'Security',  label: 'Security',   color: '#ef4444', icon: '⬡', keywords: ['Cybersecurity'] },
];

// Build a fast skill → category lookup from the SKILL_CATEGORIES dataset
const SKILL_TO_CATEGORY = {};
for (const [catName, skills] of Object.entries(SKILL_CATEGORIES)) {
  for (const skill of skills) {
    SKILL_TO_CATEGORY[skill.toLowerCase()] = catName;
  }
}

// Weight constants
const SOURCE_WEIGHT  = { offered: 1.0, wanted: 0.6 };
const LEVEL_WEIGHT   = { Beginner: 0.5, Intermediate: 0.75, Advanced: 1.0 };

const TAG_CLOUD_LIMIT = 12;

// ── Helpers ────────────────────────────────────────────────────────────────
function resolveCategory(skillName) {
  const lower = (skillName || '').toLowerCase();
  return SKILL_TO_CATEGORY[lower] || null;
}

function getCategoryKey(catName) {
  if (!catName) return null;
  const found = CATEGORIES.find(c => c.keywords.includes(catName));
  return found?.key || null;
}

/**
 * Calculate category scores from user skill arrays.
 * Returns { [categoryKey]: 0–100 }
 */
function computeScores(skillsOffered = [], skillsWanted = []) {
  const raw = {};

  const add = (skills, sourceKey) => {
    for (const s of skills) {
      const name    = typeof s === 'string' ? s : s?.name;
      const level   = (typeof s === 'object' ? s?.level : null) || 'Beginner';
      const catName = resolveCategory(name);
      const catKey  = getCategoryKey(catName);
      if (!catKey) continue;
      raw[catKey] = (raw[catKey] || 0) + SOURCE_WEIGHT[sourceKey] * (LEVEL_WEIGHT[level] || 0.5);
    }
  };

  add(skillsOffered, 'offered');
  add(skillsWanted,  'wanted');

  // Normalise to 0–100
  const maxRaw = Math.max(...Object.values(raw), 1);
  const scores = {};
  for (const cat of CATEGORIES) {
    scores[cat.key] = Math.round(((raw[cat.key] || 0) / maxRaw) * 100);
  }
  return scores;
}

/**
 * Build the tag cloud items — merge offered + wanted, dedupe, sort by level weight.
 */
function buildTagCloud(skillsOffered = [], skillsWanted = []) {
  const map = {};

  const add = (skills, source) => {
    for (const s of skills) {
      const name  = typeof s === 'string' ? s : s?.name;
      const level = (typeof s === 'object' ? s?.level : null) || 'Beginner';
      if (!name) continue;
      if (!map[name]) map[name] = { name, level, source };
      else if (source === 'offered') map[name].source = 'offered'; // prefer offered
    }
  };

  add(skillsOffered, 'offered');
  add(skillsWanted,  'wanted');

  return Object.values(map)
    .sort((a, b) => (LEVEL_WEIGHT[b.level] || 0) - (LEVEL_WEIGHT[a.level] || 0))
    .slice(0, TAG_CLOUD_LIMIT);
}

// ── Tag Cloud ──────────────────────────────────────────────────────────────
const LEVEL_TAG_SIZE = {
  Beginner:     { fontSize: 11, padding: '3px 9px', opacity: 0.75, fontWeight: 500 },
  Intermediate: { fontSize: 13, padding: '4px 12px', opacity: 0.90, fontWeight: 600 },
  Advanced:     { fontSize: 15, padding: '5px 14px', opacity: 1.00, fontWeight: 700 },
};

const LEVEL_COLOR = {
  Beginner:     { bg: 'rgba(245,158,11,0.15)',  border: 'rgba(245,158,11,0.35)',  text: '#fbbf24' },
  Intermediate: { bg: 'rgba(59,130,246,0.15)',  border: 'rgba(59,130,246,0.35)',  text: '#60a5fa' },
  Advanced:     { bg: 'rgba(16,185,129,0.15)',  border: 'rgba(16,185,129,0.35)',  text: '#34d399' },
};

const SOURCE_ICON = { offered: '🎓', wanted: '📚' };

function TagCloud({ tags }) {
  if (tags.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: 13 }}>
        No skills added yet. Go to{' '}
        <a href="/profile" style={{ color: 'var(--accent-text)', textDecoration: 'none' }}>Profile</a>{' '}
        to add skills.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', justifyContent: 'center', padding: '8px 0 4px' }}>
      {tags.map(({ name, level, source }) => {
        const sz  = LEVEL_TAG_SIZE[level]  || LEVEL_TAG_SIZE.Beginner;
        const col = LEVEL_COLOR[level]     || LEVEL_COLOR.Beginner;
        return (
          <span
            key={name}
            title={`${name} · ${level} · ${source === 'offered' ? 'Offering' : 'Learning'}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              fontSize: sz.fontSize,
              padding: sz.padding,
              fontWeight: sz.fontWeight,
              opacity: sz.opacity,
              borderRadius: 8,
              background: col.bg,
              border: `1px solid ${col.border}`,
              color: col.text,
              fontFamily: 'Space Grotesk, sans-serif',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease',
              cursor: 'default',
            }}
            onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'scale(1.06)'; }}
            onMouseLeave={e => { e.currentTarget.style.opacity = String(sz.opacity); e.currentTarget.style.transform = ''; }}
          >
            <span style={{ fontSize: sz.fontSize - 2, flexShrink: 0 }}>{SOURCE_ICON[source]}</span>
            {name}
          </span>
        );
      })}
    </div>
  );
}

// ── Horizontal Bar Chart ───────────────────────────────────────────────────
function BarChart({ scores }) {
  const activeCats = CATEGORIES.filter(c => scores[c.key] > 0);

  if (activeCats.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-muted)', fontSize: 13 }}>
        Skill data will appear here once you add skills.
      </div>
    );
  }

  // Sort by score descending
  const sorted = [...activeCats].sort((a, b) => (scores[b.key] || 0) - (scores[a.key] || 0));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {sorted.map(cat => {
        const val   = scores[cat.key] || 0;
        const color = cat.color;
        const barColor = val >= 70 ? '#10b981' : val >= 40 ? color : '#f59e0b';
        return (
          <div key={cat.key}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontFamily: 'JetBrains Mono', fontWeight: 500 }}>
                {cat.label}
              </span>
              <span style={{ fontSize: 13, fontWeight: 700, color: barColor, fontFamily: 'JetBrains Mono' }}>
                {val}
              </span>
            </div>
            <div style={{ height: 7, borderRadius: 99, background: 'var(--bg-elevated)', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${val}%`,
                  borderRadius: 99,
                  background: `linear-gradient(90deg, ${barColor}88, ${barColor})`,
                  boxShadow: `0 0 8px ${barColor}55`,
                  transition: 'width 1s cubic-bezier(0.4,0,0.2,1)',
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Legend ─────────────────────────────────────────────────────────────────
function LevelLegend() {
  return (
    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
      {[
        { label: 'Advanced',     color: '#34d399', desc: 'large tag · 1.0× weight' },
        { label: 'Intermediate', color: '#60a5fa', desc: 'medium tag · 0.75× weight' },
        { label: 'Beginner',     color: '#fbbf24', desc: 'small tag · 0.5× weight' },
      ].map(l => (
        <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: l.color, boxShadow: `0 0 5px ${l.color}` }} />
          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono' }}>
            {l.label}
            <span style={{ color: 'var(--text-faint)', marginLeft: 4 }}>{l.desc}</span>
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Main Export ────────────────────────────────────────────────────────────
/**
 * SkillDistribution
 * Props:
 *   skillsOffered — [{name, level}]
 *   skillsWanted  — [{name, level}]
 */
export default function SkillDistribution({ skillsOffered = [], skillsWanted = [] }) {
  const scores = useMemo(() => computeScores(skillsOffered, skillsWanted), [skillsOffered, skillsWanted]);
  const tags   = useMemo(() => buildTagCloud(skillsOffered, skillsWanted), [skillsOffered, skillsWanted]);

  const hasData = skillsOffered.length > 0 || skillsWanted.length > 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* ── Tag Cloud ── */}
      <div>
        <div style={{ fontSize: 12, fontFamily: 'JetBrains Mono', color: 'var(--text-muted)', marginBottom: 10, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          🏷 Skill Tag Cloud
          <span style={{ marginLeft: 8, color: 'var(--text-faint)', fontSize: 10 }}>
            size = level · 🎓 offering · 📚 learning
          </span>
        </div>
        <div style={{
          padding: '16px 20px',
          borderRadius: 12,
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border)',
          minHeight: 72,
        }}>
          <TagCloud tags={tags} />
        </div>
      </div>

      {/* ── Bar Chart ── */}
      <div>
        <div style={{ fontSize: 12, fontFamily: 'JetBrains Mono', color: 'var(--text-muted)', marginBottom: 10, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          📊 Category Strength
          <span style={{ marginLeft: 8, color: 'var(--text-faint)', fontSize: 10 }}>
            offered ×1.0 · wanted ×0.6 · normalized to 100
          </span>
        </div>
        <BarChart scores={scores} />
      </div>

      {/* ── Legend ── */}
      {hasData && (
        <div style={{
          padding: '10px 14px',
          borderRadius: 10,
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border)',
        }}>
          <LevelLegend />
        </div>
      )}
    </div>
  );
}
