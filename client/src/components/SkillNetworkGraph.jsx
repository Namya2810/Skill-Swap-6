import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { SKILL_CATEGORIES } from '../data/skills';

// ── Category registry ─────────────────────────────────────────────────────
const CATEGORY_DEFS = [
  { key: 'Frontend',  label: 'Frontend',  color: '#3b82f6', darkBg: '#1e3a5f' },
  { key: 'Backend',   label: 'Backend',   color: '#10b981', darkBg: '#0d3326' },
  { key: 'AI/ML',     label: 'AI / ML',   color: '#8b5cf6', darkBg: '#2e1a4a' },
  { key: 'DevOps',    label: 'DevOps',    color: '#06b6d4', darkBg: '#0a2e38' },
  { key: 'Database',  label: 'Database',  color: '#f59e0b', darkBg: '#3d2500' },
  { key: 'Mobile',    label: 'Mobile',    color: '#f472b6', darkBg: '#3d0a26' },
  { key: 'Security',  label: 'Security',  color: '#ef4444', darkBg: '#3d0a0a' },
  { key: 'Other',     label: 'Other',     color: '#94a3b8', darkBg: '#1a2035' },
];
const CAT_MAP = Object.fromEntries(CATEGORY_DEFS.map(c => [c.key, c]));

// Build skill → category lookup from full dataset
const SKILL_TO_CAT = {};
const CAT_KEY_MAP = {
  'Frontend Development':  'Frontend',
  'Backend Development':   'Backend',
  'Machine Learning & AI': 'AI/ML',
  'Data Science':          'AI/ML',
  'DevOps & Cloud':        'DevOps',
  'Database':              'Database',
  'Mobile Development':    'Mobile',
  'Cybersecurity':         'Security',
};
for (const [catName, skills] of Object.entries(SKILL_CATEGORIES)) {
  const key = CAT_KEY_MAP[catName] || 'Other';
  for (const skill of skills) SKILL_TO_CAT[skill.toLowerCase()] = key;
}

function categorize(name) {
  return SKILL_TO_CAT[(name || '').toLowerCase()] || 'Other';
}

// ── Level config ──────────────────────────────────────────────────────────
const LEVEL_CFG = {
  Beginner:     { r: 24, glow: 4,  glowOpacity: 0.3 },
  Intermediate: { r: 34, glow: 8,  glowOpacity: 0.5 },
  Advanced:     { r: 46, glow: 14, glowOpacity: 0.7 },
};
const LEVEL_WEIGHT = { Beginner: 0.5, Intermediate: 0.75, Advanced: 1.0 };

// ── Force-directed layout ─────────────────────────────────────────────────
function runForce(nodes, links, W, H, iters = 180) {
  const k = Math.sqrt((W * H) / Math.max(nodes.length, 1)) * 0.9;
  const center = { x: W / 2, y: H / 2 };

  // Init positions using cluster angles + random spread
  const catAngles = {};
  const catCounts = {};
  nodes.forEach(n => {
    if (n.isCenter) return;
    catCounts[n.cat] = (catCounts[n.cat] || 0) + 1;
  });
  const cats = Object.keys(catCounts);
  cats.forEach((c, i) => { catAngles[c] = (i / cats.length) * Math.PI * 2; });

  nodes.forEach(n => {
    if (n.isCenter) { n.x = center.x; n.y = center.y; n.vx = 0; n.vy = 0; return; }
    const angle = catAngles[n.cat] ?? 0;
    const spread = 60 + Math.random() * 60;
    n.x = center.x + Math.cos(angle) * (120 + spread) + (Math.random() - 0.5) * 40;
    n.y = center.y + Math.sin(angle) * (100 + spread) + (Math.random() - 0.5) * 40;
    n.vx = 0; n.vy = 0;
  });

  const linkMap = {};
  links.forEach(l => {
    const id = `${l.source}-${l.target}`;
    linkMap[id] = l;
    linkMap[`${l.target}-${l.source}`] = l;
  });

  for (let iter = 0; iter < iters; iter++) {
    const cooling = 1 - iter / iters;
    const temp = 35 * cooling;

    // Repulsion between all node pairs
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i], b = nodes[j];
        let dx = b.x - a.x, dy = b.y - a.y;
        const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
        const minDist = (a.r + b.r) * 1.8 + 20;
        const repulse = (k * k) / dist;
        dx /= dist; dy /= dist;
        const force = Math.max(repulse, minDist / dist * 10);
        a.vx -= dx * force * 0.5;
        a.vy -= dy * force * 0.5;
        b.vx += dx * force * 0.5;
        b.vy += dy * force * 0.5;
      }
    }

    // Attraction along links
    links.forEach(l => {
      const a = nodes.find(n => n.id === l.source);
      const b = nodes.find(n => n.id === l.target);
      if (!a || !b) return;
      let dx = b.x - a.x, dy = b.y - a.y;
      const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
      const idealDist = l.peer ? 110 : 180;
      const f = (dist - idealDist) * 0.08;
      dx /= dist; dy /= dist;
      a.vx += dx * f;
      a.vy += dy * f;
      b.vx -= dx * f;
      b.vy -= dy * f;
    });

    // Gravity toward cluster centre angle
    nodes.forEach(n => {
      if (n.isCenter) return;
      const angle = catAngles[n.cat] ?? 0;
      const targetX = center.x + Math.cos(angle) * 160;
      const targetY = center.y + Math.sin(angle) * 140;
      n.vx += (targetX - n.x) * 0.012;
      n.vy += (targetY - n.y) * 0.012;
      // Gravity to center
      n.vx += (center.x - n.x) * 0.004;
      n.vy += (center.y - n.y) * 0.004;
    });

    // Apply velocity with cooling and clamp
    const padding = 60;
    nodes.forEach(n => {
      if (n.isCenter) return;
      const speed = Math.sqrt(n.vx * n.vx + n.vy * n.vy);
      if (speed > temp) { n.vx = (n.vx / speed) * temp; n.vy = (n.vy / speed) * temp; }
      n.x = Math.max(padding + n.r, Math.min(W - padding - n.r, n.x + n.vx));
      n.y = Math.max(padding + n.r, Math.min(H - padding - n.r, n.y + n.vy));
      n.vx *= 0.8; n.vy *= 0.8;
    });
  }

  return nodes;
}

// ── Tooltip ───────────────────────────────────────────────────────────────
function Tooltip({ node, W, H }) {
  if (!node || node.isCenter) return null;
  const cat = CAT_MAP[node.cat] || CAT_MAP.Other;
  const src = node.source === 'offered' ? '🎓 Offering' : '📚 Learning';
  const tipW = 168, tipH = 82;
  let tx = node.x + node.r + 10;
  let ty = node.y - tipH / 2;
  if (tx + tipW > W - 8) tx = node.x - node.r - tipW - 10;
  if (ty < 8) ty = 8;
  if (ty + tipH > H - 8) ty = H - tipH - 8;
  return (
    <g>
      <rect x={tx} y={ty} width={tipW} height={tipH} rx={10} ry={10}
        fill="rgba(8,14,28,0.97)" stroke={cat.color} strokeWidth={1.5} strokeOpacity={0.6} />
      <text x={tx + 12} y={ty + 20} style={{ fill: '#ffffff', fontSize: 13, fontWeight: 700, fontFamily: 'Space Grotesk, sans-serif' }}>{node.name}</text>
      <text x={tx + 12} y={ty + 37} style={{ fill: cat.color, fontSize: 10, fontFamily: 'JetBrains Mono, monospace' }}>{cat.label}</text>
      <text x={tx + 12} y={ty + 52} style={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'JetBrains Mono, monospace' }}>{node.level}</text>
      <text x={tx + 12} y={ty + 67} style={{ fill: '#64748b', fontSize: 10, fontFamily: 'JetBrains Mono, monospace' }}>{src}</text>
    </g>
  );
}

// ── Insight Panel ─────────────────────────────────────────────────────────
function InsightPanel({ skillsOffered, skillsWanted }) {
  const scores = {};
  const add = (skills, srcW) => {
    skills.forEach(s => {
      const name = typeof s === 'string' ? s : s?.name;
      const level = (typeof s === 'object' ? s?.level : null) || 'Beginner';
      const cat = categorize(name);
      scores[cat] = (scores[cat] || 0) + srcW * (LEVEL_WEIGHT[level] || 0.5);
    });
  };
  add(skillsOffered, 1.0);
  add(skillsWanted, 0.6);

  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  if (sorted.length === 0) return null;

  const [topCat, topScore] = sorted[0];
  const [weakCat] = sorted[sorted.length - 1];
  const topDef = CAT_MAP[topCat] || CAT_MAP.Other;
  const weakDef = CAT_MAP[weakCat] || CAT_MAP.Other;

  // Suggest: find category with score, then a skill in that category not yet added
  const allAdded = new Set([
    ...skillsOffered.map(s => (typeof s === 'string' ? s : s?.name)?.toLowerCase()),
    ...skillsWanted.map(s => (typeof s === 'string' ? s : s?.name)?.toLowerCase()),
  ]);
  let suggestedSkill = null;
  const weakSkills = Object.entries(SKILL_CATEGORIES)
    .filter(([cat]) => CAT_KEY_MAP[cat] === weakCat)
    .flatMap(([, skills]) => skills)
    .filter(s => !allAdded.has(s.toLowerCase()));
  if (weakSkills.length > 0) suggestedSkill = weakSkills[Math.floor(Math.random() * Math.min(weakSkills.length, 5))];

  const maxScore = sorted[0][1];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
      {/* Top strength */}
      <div style={{ padding: '16px 18px', borderRadius: 14, background: 'var(--bg-elevated)', border: `1px solid ${topDef.color}30`, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${topDef.color}, ${topDef.color}55)`, borderRadius: '14px 14px 0 0' }} />
        <div style={{ fontSize: 10, fontFamily: 'JetBrains Mono', color: topDef.color, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>◆ Top Strength</div>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-white)', marginBottom: 4 }}>
          Your strongest area is <span style={{ color: topDef.color }}>{topDef.label}</span>
          {' '}(score: {Math.round((topScore / maxScore) * 100)}/100)
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.6 }}>
          Consider mentoring others in {topDef.label} or taking on advanced projects.
        </div>
      </div>

      {/* Growth area */}
      <div style={{ padding: '16px 18px', borderRadius: 14, background: 'var(--bg-elevated)', border: `1px solid ${weakDef.color}30`, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${weakDef.color}, ${weakDef.color}55)`, borderRadius: '14px 14px 0 0' }} />
        <div style={{ fontSize: 10, fontFamily: 'JetBrains Mono', color: weakDef.color, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>▲ Growth Area</div>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-white)', marginBottom: 4 }}>
          <span style={{ color: weakDef.color }}>{weakDef.label}</span> is your emerging focus — keep building here
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.6 }}>
          Add more {weakDef.label} skills to strengthen this area.
        </div>
      </div>

      {/* Suggested next skill */}
      <div style={{ padding: '16px 18px', borderRadius: 14, background: 'var(--bg-elevated)', border: '1px solid rgba(99,102,241,0.3)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, #6366f1, #8b5cf6)', borderRadius: '14px 14px 0 0' }} />
        <div style={{ fontSize: 10, fontFamily: 'JetBrains Mono', color: '#818cf8', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>→ Suggested Next Skill</div>
        {suggestedSkill ? (
          <>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-white)', marginBottom: 4 }}>
              "<span style={{ color: '#a5b4fc' }}>{suggestedSkill}</span>" would complement your {weakDef.label} skills
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.6 }}>
              It's popular among developers with your profile.
            </div>
          </>
        ) : (
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Great coverage — explore advanced topics in your strong areas.</div>
        )}
      </div>
    </div>
  );
}

// ── Main Graph ────────────────────────────────────────────────────────────
export default function SkillNetworkGraph({ skillsOffered = [], skillsWanted = [] }) {
  const svgRef    = useRef(null);
  const navigate  = useNavigate();
  const [nodes,   setNodes]   = useState([]);
  const [links,   setLinks]   = useState([]);
  const [hovered, setHovered] = useState(null);
  const [dims,    setDims]    = useState({ W: 740, H: 420 });
  const [ready,   setReady]   = useState(false);

  // Observe container width
  useEffect(() => {
    const el = svgRef.current?.parentElement;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      const w = entries[0].contentRect.width;
      setDims({ W: Math.max(w, 320), H: Math.max(Math.round(w * 0.58), 280) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Normalise skill entries
  const norm = useCallback((arr, source) =>
    arr.map(s => typeof s === 'string'
      ? { name: s, level: 'Beginner', source }
      : { name: s?.name || '', level: s?.level || 'Beginner', source }
    ).filter(s => s.name.trim()), []);

  // Build graph whenever data or dimensions change
  useEffect(() => {
    setReady(false);
    const { W, H } = dims;

    const offered = norm(skillsOffered, 'offered');
    const wanted  = norm(skillsWanted,  'wanted');
    const all     = [...offered, ...wanted];

    // Deduplicate (offered wins)
    const deduped = {};
    all.forEach(s => {
      if (!deduped[s.name] || s.source === 'offered') deduped[s.name] = s;
    });
    const skillList = Object.values(deduped);

    // Nodes
    const centerNode = { id: '__you', name: 'You', isCenter: true, x: W / 2, y: H / 2, r: 38, vx: 0, vy: 0 };
    const skillNodes = skillList.map((s, i) => {
      const cat = categorize(s.name);
      const lvl = LEVEL_CFG[s.level] || LEVEL_CFG.Beginner;
      return {
        id:     `skill-${i}`,
        name:   s.name,
        level:  s.level,
        source: s.source,
        cat,
        r:      lvl.r,
        glow:   lvl.glow,
        glowOp: lvl.glowOpacity,
        x: W / 2 + (Math.random() - 0.5) * 200,
        y: H / 2 + (Math.random() - 0.5) * 160,
        vx: 0, vy: 0,
      };
    });

    const allNodes = [centerNode, ...skillNodes];

    // Links: center → skill
    const skillLinks = skillNodes.map(n => ({ source: '__you', target: n.id, peer: false }));

    // Links: same-category peers (only if ≤ 3 pairs per category to avoid clutter)
    const catGroups = {};
    skillNodes.forEach(n => { (catGroups[n.cat] = catGroups[n.cat] || []).push(n.id); });
    const peerLinks = [];
    Object.values(catGroups).forEach(ids => {
      if (ids.length < 2) return;
      for (let i = 0; i < Math.min(ids.length, 3) - 1; i++) {
        peerLinks.push({ source: ids[i], target: ids[i + 1], peer: true });
      }
    });

    const finalLinks = [...skillLinks, ...peerLinks];

    // Run layout
    const laid = runForce([...allNodes], finalLinks, W, H, 200);
    setNodes(laid);
    setLinks(finalLinks);
    setTimeout(() => setReady(true), 80);
  }, [skillsOffered, skillsWanted, dims, norm]);

  const { W, H } = dims;
  const hasSkills = skillsOffered.length > 0 || skillsWanted.length > 0;

  if (!hasSkills) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 280, gap: 14, color: 'var(--text-muted)' }}>
        <div style={{ fontSize: 40 }}>🕸️</div>
        <div style={{ fontSize: 14, fontFamily: 'JetBrains Mono', textAlign: 'center', lineHeight: 1.7 }}>
          Add skills to visualize your learning network.<br />
          <a href="/profile" style={{ color: 'var(--accent-text)', textDecoration: 'none' }}>Go to Profile →</a>
        </div>
      </div>
    );
  }

  const nodeById = Object.fromEntries(nodes.map(n => [n.id, n]));
  const hovNode  = hovered ? nodeById[hovered] : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <div>
          <div style={{ fontSize: 12, fontFamily: 'JetBrains Mono', color: 'var(--accent-text)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 3 }}>◆ Skill Network</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono' }}>hover nodes to explore · click to edit profile</div>
        </div>
        <div style={{ fontSize: 11, fontFamily: 'JetBrains Mono', color: 'var(--text-muted)' }}>
          {nodes.filter(n => !n.isCenter).length} skills · {Object.keys(Object.fromEntries(nodes.filter(n => !n.isCenter).map(n => [n.cat, 1]))).length} domains
        </div>
      </div>

      {/* ── SVG canvas ── */}
      <div ref={svgRef} style={{
        position: 'relative', borderRadius: 16, overflow: 'hidden',
        background: 'radial-gradient(ellipse at 50% 40%, rgba(30,58,138,0.18) 0%, rgba(8,14,28,0.95) 70%)',
        border: '1px solid var(--border)',
        boxShadow: 'inset 0 0 60px rgba(0,0,0,0.4)',
      }}>
        {/* Starfield dots */}
        <svg style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} width={W} height={H}>
          {Array.from({ length: 55 }).map((_, i) => (
            <circle key={i} cx={((i * 137.5) % W).toFixed(1)} cy={((i * 83.7) % H).toFixed(1)} r={i % 5 === 0 ? 1.2 : 0.7} fill="white" opacity={0.06 + (i % 3) * 0.03} />
          ))}
        </svg>

        <svg
          width={W} height={H} style={{ display: 'block', opacity: ready ? 1 : 0, transition: 'opacity 0.5s ease', cursor: 'default' }}
          onClick={() => navigate('/profile')}
        >
          <defs>
            {/* Per-category glow filters */}
            {CATEGORY_DEFS.map(c => (
              <filter key={c.key} id={`glow-${c.key}`} x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="5" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            ))}
            <filter id="glow-center" x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="8" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            {/* Radial gradient for center node */}
            <radialGradient id="grad-center" cx="40%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#4f6ef7" />
              <stop offset="100%" stopColor="#1e3a8a" />
            </radialGradient>
            {/* Radial gradients for categories */}
            {CATEGORY_DEFS.map(c => (
              <radialGradient key={c.key} id={`grad-${c.key}`} cx="40%" cy="35%" r="65%">
                <stop offset="0%" stopColor={c.color} />
                <stop offset="100%" stopColor={c.darkBg} />
              </radialGradient>
            ))}
          </defs>

          {/* ── Edges ── */}
          {links.map((l, i) => {
            const a = nodeById[l.source], b = nodeById[l.target];
            if (!a || !b) return null;
            const isHovered = hovered === l.source || hovered === l.target;
            return (
              <line
                key={i}
                x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                stroke={l.peer ? 'rgba(148,163,184,0.2)' : 'rgba(99,102,241,0.35)'}
                strokeWidth={l.peer ? 1 : 1.5}
                strokeDasharray={l.peer ? '4 6' : undefined}
                opacity={isHovered ? 1 : 0.6}
                style={{ transition: 'opacity 0.2s' }}
              />
            );
          })}

          {/* ── Skill nodes ── */}
          {nodes.filter(n => !n.isCenter).map(n => {
            const cat  = CAT_MAP[n.cat] || CAT_MAP.Other;
            const isH  = hovered === n.id;
            const dashed = n.source === 'wanted';
            const labelFits = n.r >= 28;
            const shortName = n.name.length > 9 ? n.name.slice(0, 8) + '…' : n.name;
            return (
              <g
                key={n.id}
                onMouseEnter={() => setHovered(n.id)}
                onMouseLeave={() => setHovered(null)}
                style={{ cursor: 'pointer', transition: 'opacity 0.2s' }}
                opacity={hovered && !isH ? 0.45 : 1}
              >
                {/* Glow ring */}
                {n.level !== 'Beginner' && (
                  <circle cx={n.x} cy={n.y} r={n.r + n.glow} fill={cat.color} opacity={isH ? n.glowOp * 1.4 : n.glowOp} />
                )}
                {/* Main circle */}
                <circle
                  cx={n.x} cy={n.y} r={n.r}
                  fill={`url(#grad-${n.cat})`}
                  stroke={cat.color}
                  strokeWidth={isH ? 2.5 : dashed ? 1.5 : 1.8}
                  strokeDasharray={dashed ? '5 3' : undefined}
                  filter={`url(#glow-${n.cat})`}
                  style={{ transition: 'r 0.2s, stroke-width 0.15s' }}
                />
                {/* Label */}
                {labelFits && (
                  <text
                    x={n.x} y={n.y + 4.5}
                    textAnchor="middle"
                    style={{
                      fill: '#ffffff', fontFamily: 'Space Grotesk, sans-serif',
                      fontSize: n.r >= 40 ? 11 : n.r >= 30 ? 9.5 : 8.5,
                      fontWeight: 700, pointerEvents: 'none',
                    }}
                  >
                    {shortName}
                  </text>
                )}
                {/* Hover scale ring */}
                {isH && (
                  <circle cx={n.x} cy={n.y} r={n.r + 5} fill="none" stroke={cat.color} strokeWidth={1.5} opacity={0.5} />
                )}
              </g>
            );
          })}

          {/* ── Center "You" node ── */}
          {nodes.find(n => n.isCenter) && (() => {
            const c = nodes.find(n => n.isCenter);
            return (
              <g style={{ cursor: 'pointer' }}>
                <circle cx={c.x} cy={c.y} r={c.r + 18} fill="#3b82f6" opacity={0.07} />
                <circle cx={c.x} cy={c.y} r={c.r + 9} fill="#3b82f6" opacity={0.10} />
                <circle cx={c.x} cy={c.y} r={c.r} fill="url(#grad-center)" stroke="#6366f1" strokeWidth={2.5} filter="url(#glow-center)" />
                <circle cx={c.x} cy={c.y} r={c.r - 9} fill="none" stroke="#818cf8" strokeWidth={1} strokeDasharray="3 5" opacity={0.5} />
                <text x={c.x} y={c.y + 5} textAnchor="middle"
                  style={{ fill: '#ffffff', fontFamily: 'Outfit, sans-serif', fontSize: 14, fontWeight: 800 }}>You</text>
              </g>
            );
          })()}

          {/* ── Tooltip ── */}
          <Tooltip node={hovNode} W={W} H={H} />
        </svg>
      </div>

      {/* ── Legend ── */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 20px' }}>
        {[
          { color: '#34d399', label: 'Advanced — large node · glow' },
          { color: '#60a5fa', label: 'Intermediate — medium' },
          { color: '#fbbf24', label: 'Beginner — small' },
          { color: '#94a3b8', label: '---- Wanted', dashed: true },
          { color: '#818cf8', label: '— Offered' },
        ].map(l => (
          <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{
              width: 20, height: 2,
              background: l.dashed ? `repeating-linear-gradient(90deg,${l.color} 0,${l.color} 4px,transparent 4px,transparent 8px)` : l.color,
              borderRadius: 1,
            }} />
            <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono' }}>{l.label}</span>
          </div>
        ))}
      </div>

      {/* ── Insight panel ── */}
      <InsightPanel skillsOffered={skillsOffered} skillsWanted={skillsWanted} />

      {/* ── Category strength bars (compact) ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px', gap: 24, alignItems: 'start' }}>
        {/* Already covered by InsightPanel — show raw scores */}
        <div />
        <div style={{ padding: '16px 18px', borderRadius: 14, background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: 10, fontFamily: 'JetBrains Mono', color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Category Strengths</div>
          {(() => {
            const scores = {};
            const addScores = (arr, srcW) => arr.forEach(s => {
              const name = typeof s === 'string' ? s : s?.name;
              const level = (typeof s === 'object' ? s?.level : null) || 'Beginner';
              const cat = categorize(name);
              scores[cat] = (scores[cat] || 0) + srcW * (LEVEL_WEIGHT[level] || 0.5);
            });
            addScores(skillsOffered, 1.0);
            addScores(skillsWanted, 0.6);
            const max = Math.max(...Object.values(scores), 1);
            const normalized = Object.entries(scores)
              .map(([cat, raw]) => ({ cat, score: Math.round((raw / max) * 100) }))
              .sort((a, b) => b.score - a.score);
            return normalized.map(({ cat, score }) => {
              const def = CAT_MAP[cat] || CAT_MAP.Other;
              return (
                <div key={cat} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'JetBrains Mono' }}>{def.label}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: def.color, fontFamily: 'JetBrains Mono' }}>{score}</span>
                  </div>
                  <div style={{ height: 5, borderRadius: 99, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${score}%`, borderRadius: 99, background: `linear-gradient(90deg,${def.color}66,${def.color})`, boxShadow: `0 0 6px ${def.color}55`, transition: 'width 1s cubic-bezier(0.4,0,0.2,1)' }} />
                  </div>
                </div>
              );
            });
          })()}
        </div>
      </div>
    </div>
  );
}
