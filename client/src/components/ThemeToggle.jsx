import { useTheme } from '../context/ThemeContext';

export default function ThemeToggle({ compact = false }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: compact ? 0 : 8,
        padding: compact ? '6px' : '6px 12px',
        borderRadius: 10,
        border: isDark
          ? '1px solid rgba(56,100,220,0.25)'
          : '1px solid rgba(100,130,200,0.3)',
        background: isDark
          ? 'rgba(14,26,50,0.7)'
          : 'rgba(240,245,255,0.8)',
        cursor: 'pointer',
        transition: 'all 0.2s',
        fontSize: 13,
        fontWeight: 500,
        color: isDark ? '#7ba3d4' : '#3b5998',
        fontFamily: 'Space Grotesk, sans-serif',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = isDark
          ? 'rgba(99,130,255,0.5)'
          : 'rgba(59,89,152,0.5)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = isDark
          ? 'rgba(56,100,220,0.25)'
          : 'rgba(100,130,200,0.3)';
      }}
    >
      {/* Track */}
      <div style={{
        width: 36,
        height: 20,
        borderRadius: 99,
        background: isDark
          ? 'linear-gradient(135deg, #1e3060, #0d1830)'
          : 'linear-gradient(135deg, #bfdbfe, #dbeafe)',
        border: isDark
          ? '1px solid rgba(56,100,220,0.3)'
          : '1px solid rgba(147,197,253,0.6)',
        position: 'relative',
        transition: 'all 0.3s',
        flexShrink: 0,
      }}>
        {/* Thumb */}
        <div style={{
          position: 'absolute',
          top: 2,
          left: isDark ? 2 : 16,
          width: 14,
          height: 14,
          borderRadius: '50%',
          background: isDark
            ? 'linear-gradient(135deg, #60a5fa, #818cf8)'
            : 'linear-gradient(135deg, #f59e0b, #fbbf24)',
          boxShadow: isDark
            ? '0 0 6px rgba(96,165,250,0.6)'
            : '0 0 6px rgba(251,191,36,0.6)',
          transition: 'left 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 8,
        }}>
          {isDark ? '🌙' : '☀️'}
        </div>
      </div>

      {/* Label */}
      {!compact && (
        <span style={{ fontSize: 12, whiteSpace: 'nowrap' }}>
          {isDark ? 'Dark' : 'Light'}
        </span>
      )}
    </button>
  );
}
