import { useState, useEffect } from 'react';
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

// Mobile bottom nav shows only top 5 items
const MOBILE_NAV = NAV.slice(0, 5);

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
    </div>
  );
}

// ── Desktop Sidebar ──────────────────────────────────────────
function DesktopSidebar({ badges }) {
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [hoveredItem, setHoveredItem] = useState(null);
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
      <div style={{
        height: 60, padding: '0 14px', borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between',
        flexShrink: 0, gap: 8,
      }}>
        {!collapsed && <SkillLinkLogo size={30} showText={true} />}
        {collapsed  && <SkillLinkLogo size={26} showText={false} />}
        <button onClick={() => setCollapsed(c => !c)} style={{
          width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'var(--bg-elevated)', border: '1px solid var(--border)',
          borderRadius: 8, cursor: 'pointer', color: 'var(--text-muted)', fontSize: 13, flexShrink: 0,
        }}>
          {collapsed ? '→' : '←'}
        </button>
      </div>

      {user && (
        <div style={{ padding: collapsed ? '10px 6px' : '10px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: collapsed ? 0 : 10,
            padding: collapsed ? '7px' : '8px 10px', borderRadius: 10,
            background: 'var(--bg-elevated)', justifyContent: collapsed ? 'center' : 'flex-start',
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: 9, flexShrink: 0,
              background: 'linear-gradient(135deg, var(--accent), var(--accent-2))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 700, color: 'white',
            }}>
              {user.name?.charAt(0).toUpperCase()}
            </div>
            {!collapsed && (
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-white)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name}</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>{user.role}</div>
              </div>
            )}
          </div>
        </div>
      )}

      <nav style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '8px' }}>
        {NAV.map(item => {
          const badgeCount = item.badge ? badges[item.badge] : 0;
          return (
            <div key={item.path} style={{ position: 'relative', marginBottom: 2 }}
              onMouseEnter={() => collapsed && setHoveredItem(item.path)}
              onMouseLeave={() => setHoveredItem(null)}>
              <NavLink to={item.path} style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: collapsed ? 0 : 10,
                padding: collapsed ? '11px' : '10px 12px', borderRadius: 10,
                textDecoration: 'none', justifyContent: collapsed ? 'center' : 'flex-start',
                color: isActive ? 'var(--accent-text)' : 'var(--text-muted)',
                background: isActive ? 'rgba(59,130,246,0.1)' : 'transparent',
                borderLeft: isActive ? '2.5px solid var(--accent)' : '2.5px solid transparent',
                fontWeight: isActive ? 600 : 400, position: 'relative',
              })}>
                <span style={{ fontSize: 17, flexShrink: 0 }}>{item.icon}</span>
                {!collapsed && <span style={{ fontSize: 13, flex: 1 }}>{item.label}</span>}
                {badgeCount > 0 && (
                  <span style={{
                    position: collapsed ? 'absolute' : 'relative',
                    top: collapsed ? 5 : undefined, right: collapsed ? 5 : undefined,
                    minWidth: 18, height: 18, borderRadius: 99,
                    background: '#ef4444', color: 'white',
                    fontSize: 9, fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px',
                  }}>
                    {badgeCount > 9 ? '9+' : badgeCount}
                  </span>
                )}
              </NavLink>
              {collapsed && <Tooltip label={item.label} visible={hoveredItem === item.path} />}
            </div>
          );
        })}
      </nav>

      <div style={{ padding: '8px', borderTop: '1px solid var(--border)', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <ThemeToggle collapsed={collapsed} />
        <button onClick={handleLogout} style={{
          width: '100%', display: 'flex', alignItems: 'center',
          gap: collapsed ? 0 : 10, justifyContent: collapsed ? 'center' : 'flex-start',
          padding: collapsed ? '11px' : '10px 12px', borderRadius: 10,
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--text-muted)', fontSize: 13,
        }}>
          <span style={{ fontSize: 17 }}>⊗</span>
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}

// ── Mobile Bottom Nav ────────────────────────────────────────
function MobileBottomNav({ badges }) {
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();

  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      background: 'var(--sidebar-bg)', borderTop: '1px solid var(--border)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-around',
      padding: '8px 4px 12px', zIndex: 200,
    }}>
      {MOBILE_NAV.map(item => {
        const badgeCount = item.badge ? badges[item.badge] : 0;
        return (
          <NavLink key={item.path} to={item.path} style={({ isActive }) => ({
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
            padding: '6px 10px', borderRadius: 10, textDecoration: 'none',
            color: isActive ? 'var(--accent)' : 'var(--text-muted)',
            position: 'relative', minWidth: 48,
          })}>
            <span style={{ fontSize: 20 }}>{item.icon}</span>
            <span style={{ fontSize: 9, fontWeight: 600 }}>{item.label}</span>
            {badgeCount > 0 && (
              <span style={{
                position: 'absolute', top: 2, right: 6,
                minWidth: 16, height: 16, borderRadius: 99,
                background: '#ef4444', color: 'white',
                fontSize: 8, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {badgeCount}
              </span>
            )}
          </NavLink>
        );
      })}
      {/* More button */}
      <button onClick={() => navigate('/feedback')} style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
        padding: '6px 10px', borderRadius: 10, background: 'none', border: 'none',
        color: 'var(--text-muted)', cursor: 'pointer', minWidth: 48,
      }}>
        <span style={{ fontSize: 20 }}>◆</span>
        <span style={{ fontSize: 9, fontWeight: 600 }}>More</span>
      </button>
    </nav>
  );
}

// ── Main Export ──────────────────────────────────────────────
export default function Sidebar() {
  const [badges, setBadges] = useState({ mentorship: 0, messages: 0 });
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  if (isMobile) return <MobileBottomNav badges={badges} />;
  return <DesktopSidebar badges={badges} />;
}