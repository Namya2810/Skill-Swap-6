import { getSkillCategory } from '../data/skills';

const CATEGORY_CLASS = {
  'Frontend Development':  'skill-frontend',
  'Backend Development':   'skill-backend',
  'Machine Learning & AI': 'skill-ml',
  'Data Science':          'skill-ml',
  'Database':              'skill-database',
  'DevOps & Cloud':        'skill-devops',
  'UI/UX Design':          'skill-design',
  'Cybersecurity':         'skill-security',
  'Mobile Development':    'skill-mobile',
  'Blockchain & Web3':     'skill-web3',
  'Soft Skills & Career':  'skill-soft',
  'Game Development':      'skill-game',
  'Embedded & IoT':        'skill-devops',
  'Emerging Tech':         'skill-ml',
  'Software Engineering':  'skill-backend',
};

const VARIANT_CLASS = {
  blue:    'tag-blue',
  cyan:    'tag-cyan',
  emerald: 'tag-emerald',
  amber:   'tag-amber',
  violet:  'tag-violet',
  slate:   'tag-slate',
};

const LEVEL_STYLES = {
  Beginner:     { color: '#fbbf24', symbol: '○' },
  Intermediate: { color: '#60a5fa', symbol: '◑' },
  Advanced:     { color: '#34d399', symbol: '●' },
};

/**
 * SkillTag — renders a skill chip.
 *
 * FIX 1: Returns null for empty skill names — was causing "oval with no text" bug.
 *         Empty ovals appeared when skill objects had no .name field.
 * FIX 2: Uses inline style gap:5 instead of Tailwind gap-1.5 which wasn't being
 *         applied because the element uses plain CSS class, not Tailwind JIT.
 *
 * Props:
 *   skill     — string (skill name) OR {name, level} object
 *   variant   — 'auto' | 'blue' | 'cyan' | 'emerald' | 'amber' | 'violet' | 'slate'
 *   level     — explicit level override (optional)
 *   showLevel — show the ○/◑/● level symbol (default: false for compact display)
 *   onRemove  — optional remove callback
 */
export default function SkillTag({ skill, variant = 'auto', level, showLevel = false, onRemove }) {
  const skillName  = typeof skill === 'string' ? skill.trim() : (skill?.name || '').trim();
  const skillLevel = level || (typeof skill === 'object' ? skill?.level : null);

  // Guard: never render an empty chip — this was the oval bug root cause
  if (!skillName) return null;

  let cssClass;
  if (variant === 'auto' || !VARIANT_CLASS[variant]) {
    const category = getSkillCategory(skillName);
    cssClass = (category && CATEGORY_CLASS[category]) || 'skill-default';
  } else {
    cssClass = VARIANT_CLASS[variant];
  }

  const lvlStyle = skillLevel ? (LEVEL_STYLES[skillLevel] || null) : null;

  return (
    <span
      className={`tag ${cssClass}`}
      style={{ gap: 5 }}
      title={skillLevel ? `${skillName} · ${skillLevel}` : skillName}
    >
      {showLevel && lvlStyle && (
        <span style={{ color: lvlStyle.color, fontSize: 10, lineHeight: 1 }}>
          {lvlStyle.symbol}
        </span>
      )}
      {skillName}
      {onRemove && (
        <button
          type="button"
          onClick={e => { e.stopPropagation(); onRemove(skillName); }}
          style={{
            marginLeft: 2, opacity: 0.55, cursor: 'pointer',
            background: 'none', border: 'none', color: 'inherit',
            fontSize: 11, padding: 0, lineHeight: 1,
            transition: 'opacity 0.15s', display: 'inline-flex',
            alignItems: 'center',
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = '1'}
          onMouseLeave={e => e.currentTarget.style.opacity = '0.55'}
          aria-label={`Remove ${skillName}`}
        >
          ✕
        </button>
      )}
    </span>
  );
}
