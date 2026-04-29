export default function SkillLinkLogo({ size = 36, showText = true }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="sl-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#6366f1" />
          </linearGradient>
          <filter id="sl-glow">
            <feGaussianBlur stdDeviation="1" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>
        <circle cx="20" cy="20" r="19" fill="url(#sl-grad)" opacity="0.12"/>
        <circle cx="20" cy="20" r="19" stroke="url(#sl-grad)" strokeWidth="1" opacity="0.4"/>
        <line x1="20" y1="20" x2="10" y2="10" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" opacity="0.7"/>
        <line x1="20" y1="20" x2="30" y2="10" stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round" opacity="0.7"/>
        <line x1="20" y1="20" x2="30" y2="30" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" opacity="0.7"/>
        <line x1="20" y1="20" x2="10" y2="30" stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round" opacity="0.7"/>
        <line x1="10" y1="10" x2="30" y2="10" stroke="#818cf8" strokeWidth="1" opacity="0.35"/>
        <line x1="30" y1="10" x2="30" y2="30" stroke="#818cf8" strokeWidth="1" opacity="0.35"/>
        <circle cx="10" cy="10" r="3.5" fill="#0d1830" stroke="#3b82f6" strokeWidth="1.5" filter="url(#sl-glow)"/>
        <circle cx="30" cy="10" r="3.5" fill="#0d1830" stroke="#6366f1" strokeWidth="1.5" filter="url(#sl-glow)"/>
        <circle cx="30" cy="30" r="3.5" fill="#0d1830" stroke="#3b82f6" strokeWidth="1.5" filter="url(#sl-glow)"/>
        <circle cx="10" cy="30" r="3.5" fill="#0d1830" stroke="#818cf8" strokeWidth="1.5" filter="url(#sl-glow)"/>
        <circle cx="20" cy="20" r="5" fill="url(#sl-grad)" filter="url(#sl-glow)"/>
        <circle cx="20" cy="20" r="2" fill="white" opacity="0.9"/>
      </svg>

      {showText && (
        <div>
          <div style={{
            fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 19, lineHeight: 1,
            background: 'linear-gradient(135deg, #60a5fa, #818cf8)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>
            SkillLink
          </div>
          <div style={{
            fontSize: 9.5, fontFamily: 'JetBrains Mono',
            color: 'var(--text-secondary)',
            fontWeight: 500,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            marginTop: 2,
          }}>
            peer learning
          </div>
        </div>
      )}
    </div>
  );
}
