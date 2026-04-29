import { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SkillLinkLogo from './SkillLinkLogo';
import ThemeToggle from './ThemeToggle';
import { getMentorshipRequests, getInbox } from '../api';

const NAV = [
  { path: '/dashboard',  label: 'Dashboard',  icon: '⬡' },
  { path: '/feed',       label: 'Feed',        icon: '◉' },
  { path: '/profile',    label: 'Profile',     icon: '◎' },
  { path: '/community',  label: 'Community',   icon: '◈' },
  { path: '/peers',      label: 'Peer Match',  icon: '⟡' },
  { path: '/mentorship', label: 'Mentorship',  icon: '⇌', badge: 'mentorship' },
  { path: '/messages',   label: 'Messages',    icon: '✉', badge: 'messages' },
  { path: '/feedback',   label: 'Feedback',    icon: '◆' },
];

function Tooltip({ label, visible }) {
  return (
    <div style={{
      position: 'absolute', left: 'calc(100% + 12px)', top: '50%', transform: 'translateY(-50%)',
      background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8,
      padding: '6px 12px', fontSize: 12, fontWeight: 600, color: 'var(--text-white)',
      whiteSpace: 'nowrap', pointerEvents: 'none', zIndex: 200,
      opacity: visible ? 1 : 0, transition: 'opacity 0.15s ease',
      boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
    }}>
      {label}
      <div style={{ position: 'absolute', right: '100%', top: '50%', transform: 'translateY(-50%)', borderWidth: '5px', borderStyle: 'solid', borderColor: 'transparent var(--border) transparent transparent' }} />
    </div>
  );
}

export default function Sidebar() {
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [badges, setBadges] = useState({ mentorship: 0, messages: 0 });
  const [hoveredItem, setHoveredItem] = useState(null);

  useEffect(() => {
    const check = async () => {
      try {
        const [mentRes, msgRes] = await Promise.all([getMentorshipRequests(), getInbox()]);
        const pendingReceived = (mentRes.data?.received || []).filter(r => r.status === 'Pending').length;
        const unreadMsgs = (msgRes.data || []).filter(t => t.unreadCount > 0).length;
        setBadges({ mentorship: pendingReceived, messages: unreadMsgs });
      } catch {}
    };
    check();
    const id = setInterval(check, 30000);
    return () => clearInterval(id);
  }, []);

  const handleLogout = () => { logoutUser(); navigate('/login'); };
  const W = collapsed ? 72 : 230;

  return (
    <aside style={{
      width: W, minWidth: W, height: '100vh', position: 'sticky', top: 0,
      flexShrink: 0, background: 'var(--sidebar-bg)', borderRight: '1px solid var(--sidebar-bdr)',
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
      transition: 'width 0.28s cubic-bezier(0.4,0,0.2,1), min-width 0.28s cubic-bezier(0.4,0,0.2,1)',
      zIndex: 100,
    }}>

      {/* ── Logo + toggle button ── */}
      <div style={{
        height: 60, padding: '0 14px', borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between',
        flexShrink: 0, gap: 8,
      }}>
        {!collapsed && <SkillLinkLogo size={30} showText={true} />}
        {collapsed  && <SkillLinkLogo size={26} showText={false} />}

        {/* Toggle — always visible */}
        <button
          onClick={() => setCollapsed(c => !c)}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          style={{
            width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'var(--bg-elevated)', border: '1px solid var(--border)',
            borderRadius: 8, cursor: 'pointer', color: 'var(--text-muted)',
            fontSize: 13, transition: 'all 0.2s', flexShrink: 0,
          }}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-white)'; e.currentTarget.style.borderColor = 'var(--border-hover)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
        >
          {collapsed ? '→' : '←'}
        </button>
      </div>

      {/* ── User chip ── */}
      {user && (
        <div style={{ padding: collapsed ? '10px 6px' : '10px', borderBottom: '1px solid var(--border)', flexShrink: 0, position: 'relative' }}
          onMouseEnter={() => collapsed && setHoveredItem('__user')}
          onMouseLeave={() => setHoveredItem(null)}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: collapsed ? 0 : 10,
            padding: collapsed ? '7px' : '8px 10px', borderRadius: 10,
            background: 'var(--bg-elevated)', justifyContent: collapsed ? 'center' : 'flex-start',
            transition: 'all 0.2s',
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: 9, flexShrink: 0,
              background: 'linear-gradient(135deg, var(--accent), var(--accent-2))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontFamily: 'Outfit', fontWeight: 700, color: 'white',
              boxShadow: '0 2px 8px rgba(59,130,246,0.35)',
            }}>
              {user.name?.charAt(0).toUpperCase()}
            </div>
            {!collapsed && (
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-white)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name}</div>
                <div style={{ fontSize: 10, fontFamily: 'JetBrains Mono', color: 'var(--text-muted)', marginTop: 1 }}>{user.role}</div>
              </div>
            )}
          </div>
          {collapsed && <Tooltip label={`${user.name} · ${user.role}`} visible={hoveredItem === '__user'} />}
        </div>
      )}

      {/* ── Nav items ── */}
      <nav style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '8px 8px' }}>
        {NAV.map(item => {
          const badgeCount = item.badge ? badges[item.badge] : 0;
          const tooltipId = item.path;
          return (
            <div key={item.path} style={{ position: 'relative', marginBottom: 2 }}
              onMouseEnter={() => collapsed && setHoveredItem(tooltipId)}
              onMouseLeave={() => setHoveredItem(null)}>
              <NavLink to={item.path} style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: collapsed ? 0 : 10,
                padding: collapsed ? '11px' : '10px 12px', borderRadius: 10,
                textDecoration: 'none', justifyContent: collapsed ? 'center' : 'flex-start',
                color: isActive ? 'var(--accent-text)' : 'var(--text-muted)',
                background: isActive ? 'rgba(59,130,246,0.1)' : 'transparent',
                borderLeft: isActive ? '2.5px solid var(--accent)' : '2.5px solid transparent',
                transition: 'all 0.15s', position: 'relative',
                fontWeight: isActive ? 600 : 400,
              })}
                onMouseEnter={e => { if (!e.currentTarget.dataset.active) { e.currentTarget.style.background = 'var(--bg-elevated)'; e.currentTarget.style.color = 'var(--text-white)'; } }}
                onMouseLeave={e => { if (!e.currentTarget.dataset.active) { e.currentTarget.style.background = ''; e.currentTarget.style.color = ''; } }}
              >
                <span style={{ fontSize: 17, flexShrink: 0, lineHeight: 1 }}>{item.icon}</span>
                {!collapsed && (
                  <span style={{ fontSize: 13, fontFamily: 'Space Grotesk, sans-serif', flex: 1 }}>{item.label}</span>
                )}
                {badgeCount > 0 && (
                  <span style={{
                    position: collapsed ? 'absolute' : 'relative',
                    top: collapsed ? 5 : undefined, right: collapsed ? 5 : undefined,
                    marginLeft: collapsed ? 0 : 'auto',
                    minWidth: 18, height: 18, borderRadius: 99,
                    background: '#ef4444', color: 'white',
                    fontSize: 9, fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '0 4px', boxShadow: '0 0 6px rgba(239,68,68,0.5)',
                    animation: 'badgePulse 2s ease-in-out infinite',
                  }}>
                    {badgeCount > 9 ? '9+' : badgeCount}
                  </span>
                )}
              </NavLink>
              {collapsed && <Tooltip label={item.label} visible={hoveredItem === tooltipId} />}
            </div>
          );
        })}
      </nav>

      {/* ── Bottom: Theme + Logout ── */}
      <div style={{ padding: '8px 8px', borderTop: '1px solid var(--border)', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <ThemeToggle collapsed={collapsed} />

        {/* Sign out */}
        <div style={{ position: 'relative' }}
          onMouseEnter={() => collapsed && setHoveredItem('__logout')}
          onMouseLeave={() => setHoveredItem(null)}>
          <button onClick={handleLogout} style={{
            width: '100%', display: 'flex', alignItems: 'center',
            gap: collapsed ? 0 : 10, justifyContent: collapsed ? 'center' : 'flex-start',
            padding: collapsed ? '11px' : '10px 12px', borderRadius: 10,
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--text-muted)', fontSize: 13, transition: 'all 0.15s',
          }}
            onMouseEnter={e => { e.currentTarget.style.color = '#f87171'; e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'none'; }}>
            <span style={{ fontSize: 17 }}>⊗</span>
            {!collapsed && <span style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Sign Out</span>}
          </button>
          {collapsed && <Tooltip label="Sign Out" visible={hoveredItem === '__logout'} />}
        </div>
      </div>

      <style>{`
        @keyframes badgePulse {
          0%,100% { box-shadow: 0 0 6px rgba(239,68,68,0.5); }
          50%      { box-shadow: 0 0 12px rgba(239,68,68,0.8); }
        }
        nav::-webkit-scrollbar { width: 3px; }
        nav::-webkit-scrollbar-thumb { background: var(--border); border-radius: 99px; }
      `}</style>
    </aside>
  );
}
