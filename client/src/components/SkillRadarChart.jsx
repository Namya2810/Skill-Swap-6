import { useState, useEffect } from 'react';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Tooltip, ResponsiveContainer,
} from 'recharts';

// Default dummy data — swap for real user skills data when ready
const DEFAULT_SKILLS = [
  { skill: 'AI / ML',          value: 78 },
  { skill: 'Web Dev',          value: 85 },
  { skill: 'Data Structures',  value: 62 },
  { skill: 'Communication',    value: 90 },
  { skill: 'Networking',       value: 55 },
  { skill: 'System Design',    value: 47 },
];

/* Custom tooltip */
function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const { skill, value } = payload[0]?.payload || {};
  return (
    <div style={{
      background: 'rgba(10,16,36,0.95)',
      border: '1px solid rgba(99,130,255,0.35)',
      borderRadius: 10,
      padding: '8px 14px',
      backdropFilter: 'blur(8px)',
      boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
    }}>
      <div style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: '#94a3b8', marginBottom: 2 }}>{skill}</div>
      <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 22, color: '#60a5fa' }}>{value}</div>
      <div style={{ fontSize: 10, color: '#475569' }}>/ 100</div>
    </div>
  );
}

/* Custom angle axis tick — wraps long labels */
function CustomTick({ x, y, payload, cx, cy }) {
  const label = payload.value;
  const dx = x - cx;
  const dy = y - cy;
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);

  let textAnchor = 'middle';
  let offsetX = 0;
  const offsetY = 0;

  if (Math.abs(dx) > 10) {
    textAnchor = dx > 0 ? 'start' : 'end';
    offsetX = dx > 0 ? 6 : -6;
  }

  return (
    <text
      x={x + offsetX}
      y={y + offsetY}
      textAnchor={textAnchor}
      dominantBaseline="central"
      style={{ fill: '#7ba3d4', fontSize: 10.5, fontFamily: 'JetBrains Mono' }}
    >
      {label}
    </text>
  );
}

export default function SkillRadarChart({ skills = null }) {
  const data = skills || DEFAULT_SKILLS;
  const [animated, setAnimated] = useState(false);

  // Trigger entrance animation after mount
  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 120);
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={{
      opacity: animated ? 1 : 0,
      transform: animated ? 'scale(1)' : 'scale(0.92)',
      transition: 'opacity 0.55s ease, transform 0.55s cubic-bezier(0.34,1.3,0.64,1)',
    }}>
      <ResponsiveContainer width="100%" height={240}>
        <RadarChart data={data} cx="50%" cy="50%" outerRadius="72%">
          <defs>
            {/* Glow filter */}
            <filter id="radar-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            {/* Fill gradient */}
            <radialGradient id="radar-fill" cx="50%" cy="50%" r="50%">
              <stop offset="0%"   stopColor="#6366f1" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.08} />
            </radialGradient>
          </defs>

          {/* Grid */}
          <PolarGrid
            gridType="polygon"
            stroke="rgba(56,100,220,0.18)"
            strokeWidth={1}
          />

          {/* Axis labels */}
          <PolarAngleAxis
            dataKey="skill"
            tick={<CustomTick />}
            tickLine={false}
            axisLine={false}
          />

          {/* Radius axis — hidden ticks, subtle line */}
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={false}
            axisLine={false}
            tickCount={4}
          />

          {/* Radar surface */}
          <Radar
            name="Skills"
            dataKey="value"
            stroke="#6366f1"
            strokeWidth={2}
            fill="url(#radar-fill)"
            filter="url(#radar-glow)"
            dot={{ r: 4, fill: '#3b82f6', strokeWidth: 0 }}
            activeDot={{ r: 6, fill: '#60a5fa', stroke: 'rgba(96,165,250,0.4)', strokeWidth: 4 }}
            isAnimationActive={true}
            animationBegin={100}
            animationDuration={900}
            animationEasing="ease-out"
          />

          <Tooltip content={<CustomTooltip />} />
        </RadarChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: '6px 14px',
        marginTop: 8, justifyContent: 'center',
      }}>
        {data.map(d => (
          <div key={d.skill} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{
              width: 6, height: 6, borderRadius: '50%',
              background: d.value >= 75 ? '#10b981' : d.value >= 50 ? '#3b82f6' : '#f59e0b',
              boxShadow: `0 0 5px ${d.value >= 75 ? '#10b981' : d.value >= 50 ? '#3b82f6' : '#f59e0b'}`,
            }} />
            <span style={{ fontSize: 10, fontFamily: 'JetBrains Mono', color: 'var(--text-muted)' }}>
              {d.skill} <span style={{ color: d.value >= 75 ? '#10b981' : d.value >= 50 ? '#60a5fa' : '#fbbf24', fontWeight: 600 }}>{d.value}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
