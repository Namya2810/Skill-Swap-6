import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMyCommunity, getMentorshipRequests, getFeedback, getRecommendations, getPosts, getSessions } from '../api';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import SkillTag from '../components/SkillTag';
import SkillNetworkGraph from '../components/SkillNetworkGraph';

function StatCard({ label, value, sub, accentColor, icon }) {
  return (
    <div
      style={{
        padding: '22px 24px', borderRadius: 16,
        background: 'var(--bg-surface)', border: '1px solid var(--border)',
        boxShadow: 'var(--card-shadow)', position: 'relative', overflow: 'hidden',
        transition: 'all 0.22s ease', cursor: 'default',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = `0 16px 36px rgba(0,0,0,0.28), var(--card-shadow)`;
        e.currentTarget.style.borderColor = 'var(--border-hover)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = '';
        e.currentTarget.style.boxShadow = 'var(--card-shadow)';
        e.currentTarget.style.borderColor = 'var(--border)';
      }}
    >
      {/* Subtle accent glow top-right */}
      <div style={{ position:'absolute', top:-30, right:-30, width:80, height:80, borderRadius:'50%', background:accentColor, opacity:0.06, pointerEvents:'none' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div style={{ fontSize: 22 }}>{icon}</div>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: accentColor, boxShadow: `0 0 8px ${accentColor}` }} />
      </div>
      <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: 34, fontWeight: 800, color: accentColor, lineHeight: 1, marginBottom: 6 }}>{value}</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3, fontFamily: 'JetBrains Mono' }}>{sub}</div>}
    </div>
  );
}

function ActivityGraph({ connections, posts, feedback }) {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const getActivityData = () => {
    const today = new Date();
    return days.map((day, i) => {
      const date = new Date(today);
      date.setDate(today.getDate() - (6 - i));
      const dateStr = date.toDateString();
      const connCount = connections.filter(c => new Date(c.updatedAt || c.createdAt).toDateString() === dateStr).length;
      const postCount = posts.filter(p => new Date(p.createdAt).toDateString() === dateStr).length;
      const fbCount   = feedback.filter(f => new Date(f.createdAt).toDateString() === dateStr).length;
      return { day, value: connCount + postCount + fbCount, connCount, postCount, fbCount };
    });
  };
  const data   = getActivityData();
  const maxVal = Math.max(...data.map(d => d.value), 1);
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 80, marginBottom: 8 }}>
        {data.map((d, i) => {
          const heightPct = (d.value / maxVal) * 100;
          const isToday   = i === 6;
          return (
            <div key={d.day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}
              title={`${d.day}: ${d.connCount} connections, ${d.postCount} posts, ${d.fbCount} feedback`}>
              <div style={{
                width: '100%', borderRadius: '4px 4px 0 0',
                height: `${Math.max(heightPct, 4)}%`, minHeight: 4,
                background: isToday
                  ? 'linear-gradient(180deg, #3b82f6, #6366f1)'
                  : d.value > 0
                    ? 'linear-gradient(180deg, rgba(59,130,246,0.6), rgba(99,102,241,0.6))'
                    : 'var(--bg-elevated)',
                border: isToday ? '1px solid rgba(99,102,241,0.5)' : '1px solid var(--border)',
                transition: 'height 0.3s ease',
                boxShadow: isToday ? '0 0 8px rgba(99,102,241,0.3)' : 'none',
              }} />
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        {data.map((d, i) => (
          <div key={d.day} style={{
            flex: 1, textAlign: 'center', fontSize: 9,
            color: i === 6 ? 'var(--accent-text)' : 'var(--text-faint)',
            fontFamily: 'JetBrains Mono', fontWeight: i === 6 ? 700 : 400,
          }}>{d.day}</div>
        ))}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [community,        setCommunity]        = useState(null);
  const [pendingReceived,  setPendingReceived]  = useState([]);
  const [allConnections,   setAllConnections]   = useState([]);
  const [avgRating,        setAvgRating]        = useState(null);
  const [recommendCount,   setRecommendCount]   = useState(0);
  const [myPosts,          setMyPosts]          = useState([]);
  const [myFeedback,       setMyFeedback]       = useState([]);
  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [loading,          setLoading]          = useState(true);

  useEffect(() => {
    Promise.all([getMyCommunity(), getMentorshipRequests(), getFeedback(), getRecommendations(), getPosts(), getSessions()])
      .then(([commRes, mentRes, feedRes, peerRes, postsRes, sessRes]) => {
        setCommunity(commRes.data.community);
        setPendingReceived(mentRes.data.received.filter(r => r.status === 'Pending'));
        const accepted = [
          ...mentRes.data.sent.filter(r => r.status === 'Accepted'),
          ...mentRes.data.received.filter(r => r.status === 'Accepted'),
        ];
        setAllConnections(accepted);
        setAvgRating(feedRes.data.avgRating);
        setMyFeedback(feedRes.data.received || []);
        setRecommendCount(peerRes.data.length);
        const uid = user?._id || user?.id;
        setMyPosts((postsRes.data || []).filter(p => p.author?._id === uid));
        setUpcomingSessions((sessRes.data || []).filter(s => s.status === 'Accepted'));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const hour     = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const totalConnections = allConnections.length;
  const totalPosts       = myPosts.length;
  const weekActivity     = allConnections.length + myPosts.length + myFeedback.length;

  return (
    <Layout>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .dash-card {
          border-radius: 16px;
          background: var(--bg-surface);
          border: 1px solid var(--border);
          box-shadow: var(--card-shadow);
          transition: all 0.22s ease;
        }
        .dash-card:hover {
          border-color: var(--border-hover);
          box-shadow: 0 12px 32px rgba(0,0,0,0.18), var(--card-shadow);
          transform: translateY(-2px);
        }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 12, fontFamily: 'JetBrains Mono', color: 'var(--text-muted)', marginBottom: 6 }}>{greeting},</div>
        <h1 className="page-title" style={{ marginBottom: 8 }}>
          {user?.name} <span className="text-gradient">✦</span>
        </h1>
        {user?.bio && <p style={{ color: 'var(--text-muted)', maxWidth: 520, lineHeight: 1.6 }}>{user.bio}</p>}
      </div>

      {/* Onboarding banner */}
      {!loading && (!user?.skillsOffered?.length && !user?.skillsWanted?.length) && (
        <div style={{
          marginBottom: 24, padding: '20px 24px', borderRadius: 16,
          background: 'linear-gradient(135deg, rgba(37,99,235,0.12), rgba(79,70,229,0.08))',
          border: '1px solid rgba(59,130,246,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap',
        }}>
          <div>
            <div style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: 16, color: 'var(--text-white)', marginBottom: 6 }}>🚀 Welcome to SkillLink! Let's set up your profile.</div>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0, lineHeight: 1.6 }}>Complete 3 steps to unlock peer matches, community placement, and session booking.</p>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {[{ step: '1', label: 'Add Skills', to: '/profile' }, { step: '2', label: 'Find Peers', to: '/peers' }, { step: '3', label: 'Join Community', to: '/community' }].map(s => (
              <Link key={s.step} to={s.to} style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', padding: '8px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600, background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-secondary)', transition: 'all 0.2s' }}>
                <span style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--accent)', color: 'white', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{s.step}</span>
                {s.label}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* 4 stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <StatCard icon="⟡" label="Peer Matches"  value={loading ? '—' : recommendCount}  sub="based on your skills"   accentColor="#3b82f6" />
        <StatCard icon="⇌" label="Sessions"      value={loading ? '—' : upcomingSessions.length} sub="accepted sessions" accentColor="#10b981" />
        <StatCard icon="◆" label="Avg Rating"    value={loading ? '—' : avgRating ? avgRating.toFixed(1) + ' ★' : 'None'} sub="from peer feedback" accentColor="#f59e0b" />
        <StatCard icon="◈" label="Community"     value={loading ? '—' : community?.memberCount ?? '—'} sub={community?.name ?? 'Not assigned yet'} accentColor="#8b5cf6" />
      </div>

      {/* ── Main 2-col grid: left | right ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16, alignItems: 'start' }}>

        {/* ── LEFT COL: Skills ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Skills You Offer */}
          <div className="dash-card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div className="section-title" style={{ fontSize: 13 }}>Skills You Offer</div>
              <Link to="/profile" style={{ fontSize: 11, color: 'var(--accent-text)', textDecoration: 'none', fontFamily: 'JetBrains Mono' }}>Edit →</Link>
            </div>
            {user?.skillsOffered?.length > 0
              ? <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>{user.skillsOffered.slice(0,8).map((s,i) => <SkillTag key={i} skill={s} variant="emerald" />)}</div>
              : <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No skills added. <Link to="/profile" style={{ color: 'var(--accent-text)' }}>Add some →</Link></p>}
          </div>

          {/* Skills to Learn */}
          <div className="dash-card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div className="section-title" style={{ fontSize: 13 }}>Skills to Learn</div>
              <Link to="/profile" style={{ fontSize: 11, color: 'var(--accent-text)', textDecoration: 'none', fontFamily: 'JetBrains Mono' }}>Edit →</Link>
            </div>
            {user?.skillsWanted?.length > 0
              ? <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>{user.skillsWanted.slice(0,8).map((s,i) => <SkillTag key={i} skill={s} variant="cyan" />)}</div>
              : <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No goals added. <Link to="/profile" style={{ color: 'var(--accent-text)' }}>Add some →</Link></p>}
          </div>

          {/* Pending requests */}
          {pendingReceived.length > 0 && (
            <div className="dash-card" style={{ padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div className="section-title" style={{ fontSize: 13 }}>Pending Requests</div>
                <Link to="/mentorship" style={{ fontSize: 11, color: 'var(--accent-text)', textDecoration: 'none', fontFamily: 'JetBrains Mono' }}>All →</Link>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {pendingReceived.slice(0, 2).map(req => (
                  <div key={req._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: 10, background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--text-white)', fontSize: 13 }}>{req.sender?.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{req.message?.slice(0,30) || 'No message'}</div>
                    </div>
                    <Link to="/mentorship" className="btn-primary" style={{ fontSize: 11, padding: '5px 10px', textDecoration: 'none' }}>Respond</Link>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT COL: Sessions + Community ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Upcoming Sessions */}
          <div className="dash-card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div className="section-title" style={{ fontSize: 13 }}>Upcoming Sessions</div>
              <Link to="/mentorship" style={{ fontSize: 11, color: 'var(--accent-text)', textDecoration: 'none', fontFamily: 'JetBrains Mono' }}>View all →</Link>
            </div>
            {loading ? (
              <div style={{ height: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: 18, height: 18, border: '2px solid var(--accent)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              </div>
            ) : upcomingSessions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '14px 0' }}>
                <div style={{ fontSize: 20, marginBottom: 6 }}>📅</div>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>No upcoming sessions yet.</p>
                <Link to="/mentorship" style={{ fontSize: 11, color: 'var(--accent-text)', textDecoration: 'none', fontFamily: 'JetBrains Mono', marginTop: 8, display: 'inline-block' }}>Go to Mentorship →</Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {upcomingSessions.slice(0, 3).map(s => {
                  const other = s.host?._id === (user?._id || user?.id) ? s.requester : s.host;
                  return (
                    <div key={s._id} style={{ padding: '10px 12px', borderRadius: 10, background: 'var(--bg-elevated)', border: '1px solid rgba(16,185,129,0.2)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                        <div style={{ width: 26, height: 26, borderRadius: 7, background: 'linear-gradient(135deg,#10b981,#3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 11, fontWeight: 700 }}>
                          {other?.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-white)' }}>{other?.name}</div>
                          <div style={{ fontSize: 11, color: '#10b981', fontFamily: 'JetBrains Mono' }}>{s.topic}</div>
                        </div>
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono' }}>📅 {s.date}{s.time && ` · ${s.time}`}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Community */}
          <div className="dash-card" style={{ padding: 20 }}>
            <div className="section-title" style={{ marginBottom: 12, fontSize: 13 }}>Your Community</div>
            {community ? (
              <>
                <div style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: 16, marginBottom: 4 }} className="text-gradient">{community.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10, fontFamily: 'JetBrains Mono' }}>{community.memberCount} members</div>
                {community.tags?.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 12 }}>
                    {community.tags.slice(0, 4).map(t => <SkillTag key={t} skill={t} variant="slate" />)}
                  </div>
                )}
                <Link to="/community" className="btn-secondary" style={{ display: 'block', textAlign: 'center', fontSize: 12, textDecoration: 'none' }}>View Community</Link>
              </>
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.6 }}>Add skills to your profile to be placed in a community.</p>
            )}
          </div>
        </div>
      </div>

      {/* ── FULL-WIDTH Activity Card ── */}
      <div className="dash-card" style={{ padding: 24, marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <div className="section-title" style={{ fontSize: 14 }}>Your Activity</div>
          <span style={{ fontSize: 10, color: 'var(--text-faint)', fontFamily: 'JetBrains Mono' }}>last 7 days</span>
        </div>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 16, fontFamily: 'JetBrains Mono' }}>connections · posts · feedback</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 32, alignItems: 'start' }}>
          {/* Graph + stats */}
          <div>
            {loading ? (
              <div style={{ height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: 18, height: 18, border: '2px solid var(--accent)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              </div>
            ) : (
              <ActivityGraph connections={allConnections} posts={myPosts} feedback={myFeedback} />
            )}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginTop: 16 }}>
              {[
                { label: 'Connections', value: totalConnections, color: '#3b82f6' },
                { label: 'Posts',       value: totalPosts,       color: '#10b981' },
                { label: 'This week',   value: weekActivity,     color: '#f59e0b' },
                { label: 'Skills',      value: (user?.skillsOffered?.length || 0) + (user?.skillsWanted?.length || 0), color: '#8b5cf6' },
              ].map(s => (
                <div key={s.label} style={{ padding: '10px 12px', borderRadius: 10, background: 'var(--bg-elevated)', border: '1px solid var(--border)', textAlign: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: s.color, fontFamily: 'Outfit' }}>{s.value}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono', marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
          {/* Quick tips */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: 12, fontFamily: 'JetBrains Mono', color: 'var(--text-muted)', marginBottom: 4 }}>Quick Actions</div>
            {[
              { icon: '⟡', label: 'Find new peers', to: '/peers', color: '#3b82f6' },
              { icon: '⇌', label: 'Book a session', to: '/mentorship', color: '#10b981' },
              { icon: '◈', label: 'Visit community', to: '/community', color: '#8b5cf6' },
              { icon: '◆', label: 'Give feedback', to: '/feedback', color: '#f59e0b' },
            ].map(a => (
              <Link key={a.label} to={a.to} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 10, background: 'var(--bg-elevated)', border: '1px solid var(--border)', textDecoration: 'none', fontSize: 13, color: 'var(--text-secondary)', transition: 'all 0.18s', fontWeight: 500 }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-hover)'; e.currentTarget.style.color = 'var(--text-white)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
              >
                <span style={{ color: a.color, fontSize: 15 }}>{a.icon}</span>
                {a.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ── Full-width Skill Network Graph (100% data-driven) ── */}
      <div className="dash-card" style={{ padding: 24 }}>
        <SkillNetworkGraph
          skillsOffered={user?.skillsOffered || []}
          skillsWanted={user?.skillsWanted   || []}
        />
      </div>
    </Layout>
  );
}
