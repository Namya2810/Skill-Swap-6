import { useState, useRef, useEffect } from 'react';
import SkillTag from './SkillTag';
import { searchSkills, getSkillCategory } from '../data/skills';

const LEVELS = ['Beginner', 'Intermediate', 'Advanced'];

const LEVEL_CONFIG = {
  Beginner:     { bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.35)',  text: '#fbbf24', icon: '○', hint: 'Just starting out' },
  Intermediate: { bg: 'rgba(59,130,246,0.12)',  border: 'rgba(59,130,246,0.35)',  text: '#60a5fa', icon: '◑', hint: 'Comfortable with basics' },
  Advanced:     { bg: 'rgba(16,185,129,0.12)',  border: 'rgba(16,185,129,0.35)',  text: '#34d399', icon: '●', hint: 'Deep expertise' },
};

function SkillLevelBadge({ level, onClick }) {
  const cfg = LEVEL_CONFIG[level] || LEVEL_CONFIG.Beginner;
  return (
    <button
      type="button"
      onClick={onClick}
      title={`${cfg.hint} — click to change level`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        fontSize: 10,
        fontFamily: 'JetBrains Mono, monospace',
        fontWeight: 600,
        padding: '3px 8px',
        borderRadius: 99,
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        color: cfg.text,
        cursor: 'pointer',
        transition: 'all 0.15s',
        whiteSpace: 'nowrap',
        flexShrink: 0,      // ISSUE 1 FIX: badge never shrinks or wraps
      }}
      onMouseEnter={e => { e.currentTarget.style.opacity = '0.8'; e.currentTarget.style.transform = 'scale(1.06)'; }}
      onMouseLeave={e => { e.currentTarget.style.opacity = '1';   e.currentTarget.style.transform = ''; }}
    >
      <span style={{ fontSize: 9 }}>{cfg.icon}</span>{level}
    </button>
  );
}

/**
 * SkillInput — tag input with autocomplete + per-skill level cycling.
 *
 * Props:
 *   label, skills, onChange, variant, placeholder — standard
 *
 * Changes:
 *   - Removed fake "suggested level" / "avg rating" / Apply button system entirely
 *   - Fixed skill chip layout: flex-wrap + shrink-0 badge prevents overflow
 *   - Each skill row: skill name chip (truncated if long) + level badge (never overflows)
 */
export default function SkillInput({ label, skills = [], onChange, variant = 'blue', placeholder }) {
  const [input, setInput]               = useState('');
  const [suggestions, setSuggestions]   = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeIndex, setActiveIndex]   = useState(-1);
  const [validationError, setValidationError] = useState('');
  const wrapperRef = useRef(null);

  const normSkills = skills.map(s =>
    typeof s === 'string'
      ? { name: s, level: 'Beginner' }
      : {
          name:  s?.name || '',
          level: LEVELS.includes(s?.level) ? s.level : 'Beginner',
        }
  ).filter(s => s.name.trim());

  useEffect(() => {
    const handler = e => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setShowDropdown(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleInputChange = e => {
    const val = e.target.value;
    setInput(val); setActiveIndex(-1); setValidationError('');
    if (val.trim().length >= 1) {
      const results = searchSkills(val, 8).filter(
        s => !normSkills.map(sk => sk.name.toLowerCase()).includes(s.toLowerCase())
      );
      setSuggestions(results);
      setShowDropdown(results.length > 0);
    } else {
      setSuggestions([]);
      setShowDropdown(false);
    }
  };

  const addSkill = skillName => {
    const trimmed = skillName.trim();
    if (!trimmed || trimmed.length < 2 || !/[a-zA-Z]/.test(trimmed)) {
      setValidationError(`"${trimmed}" is not a valid skill name`);
      return;
    }
    setValidationError('');
    if (normSkills.map(s => s.name.toLowerCase()).includes(trimmed.toLowerCase())) {
      setInput(''); setShowDropdown(false); return;
    }
    onChange([...normSkills, { name: trimmed, level: 'Beginner' }]);
    setInput(''); setSuggestions([]); setShowDropdown(false); setActiveIndex(-1);
  };

  const removeSkill = skillName => onChange(normSkills.filter(s => s.name !== skillName));

  const cycleLevel = skillName => {
    onChange(normSkills.map(s => {
      if (s.name !== skillName) return s;
      const idx = LEVELS.indexOf(s.level);
      return { ...s, level: LEVELS[(idx + 1) % LEVELS.length] };
    }));
  };

  const handleKeyDown = e => {
    if (showDropdown && suggestions.length > 0) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIndex(i => Math.min(i + 1, suggestions.length - 1)); return; }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setActiveIndex(i => Math.max(i - 1, -1)); return; }
      if (e.key === 'Enter' && activeIndex >= 0) { e.preventDefault(); addSkill(suggestions[activeIndex]); return; }
    }
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); if (input.trim()) addSkill(input); }
    if (e.key === 'Escape') setShowDropdown(false);
  };

  return (
    <div>
      {label && <label className="label">{label}</label>}
      <div className="relative" ref={wrapperRef}>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onFocus={() => { if (suggestions.length > 0) setShowDropdown(true); }}
              placeholder={placeholder || 'Type a skill — suggestions appear automatically...'}
              className="input pr-10"
              autoComplete="off"
            />
            {input && (
              <button
                type="button"
                onClick={() => { setInput(''); setSuggestions([]); setShowDropdown(false); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400 text-sm"
              >✕</button>
            )}
          </div>
          <button
            type="button"
            onClick={() => input.trim() && addSkill(input)}
            className="btn-secondary shrink-0 px-4"
          >Add</button>
        </div>

        {showDropdown && suggestions.length > 0 && (
          <div className="autocomplete-dropdown">
            <div className="px-3 py-1.5 text-xs font-mono border-b border-blue-900/30" style={{ color: '#3d5a8a' }}>
              📚 tech skills · ↑↓ navigate · Enter to select
            </div>
            {suggestions.map((s, i) => {
              const cat = getSkillCategory(s);
              return (
                <div
                  key={s}
                  className="autocomplete-item flex items-center justify-between"
                  style={i === activeIndex ? { background: 'rgba(37,99,235,0.25)', color: '#bfdbfe' } : {}}
                  onMouseDown={() => addSkill(s)}
                  onMouseEnter={() => setActiveIndex(i)}
                >
                  <span>{s}</span>
                  {cat && <span className="text-xs ml-2 shrink-0" style={{ color: '#3d5a8a' }}>{cat}</span>}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ISSUE 1 FIX: each skill row is a flex row with flex-wrap + overflow-hidden
          so long skill names truncate and the level badge never overflows the chip */}
      {normSkills.length > 0 && (
        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {normSkills.map(({ name, level }) => (
            <div
              key={name}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                flexWrap: 'wrap',
                maxWidth: '100%',
                overflow: 'hidden',
              }}
            >
              {/* Skill chip: min-width:0 allows truncation inside flex */}
              <div style={{ minWidth: 0, flexShrink: 1 }}>
                <SkillTag skill={name} variant={variant} onRemove={removeSkill} />
              </div>

              {/* Level badge: shrink-0 ensures it never collapses or overflows */}
              <SkillLevelBadge level={level} onClick={() => cycleLevel(name)} />
            </div>
          ))}
        </div>
      )}

      <p className="text-xs mt-2 font-mono" style={{ color: '#2d4a70' }}>
        500+ skills · type to search ·{' '}
        <span style={{ color: '#fbbf24' }}>○ Beginner</span>{' → '}
        <span style={{ color: '#60a5fa' }}>◑ Intermediate</span>{' → '}
        <span style={{ color: '#34d399' }}>● Advanced</span>
        {' '}— click badge to cycle
      </p>

      {validationError && (
        <div style={{
          marginTop: 6, padding: '7px 12px', borderRadius: 8,
          background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.25)',
          color: '#f87171', fontSize: 12, fontFamily: 'JetBrains Mono',
        }}>
          ⚠ {validationError}
        </div>
      )}
    </div>
  );
}
