import { useEffect, useState } from 'react';
import { getMyCommunity, getAllCommunities, getRecommendedCommunities, joinCommunity, createCommunity } from '../api';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import SkillTag from '../components/SkillTag';
import UserCard from '../components/UserCard';

// ── Similarity Chips ──────────────────────────────────────────────────────
const CHIP_STYLES = {
  'skill-offered': { bg: 'rgba(16,185,129,0.12)',  border: 'rgba(16,185,129,0.35)',  color: '#34d399' },
  'skill-wanted':  { bg: 'rgba(99,102,241,0.12)',  border: 'rgba(99,102,241,0.35)',  color: '#a5b4fc' },
  'category':      { bg: 'rgba(59,130,246,0.12)',  border: 'rgba(59,130,246,0.35)',  color: '#60a5fa' },
  'role':          { bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.35)',  color: '#fbbf24' },
};

function SimilarityChip({ label, type }) {
  const s = CHIP_STYLES[type] || CHIP_STYLES['category'];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      fontSize: 11, fontFamily: 'JetBrains Mono', fontWeight: 600,
      padding: '3px 9px', borderRadius: 99,
      background: s.bg, border: `1px solid ${s.border}`, color: s.color,
      whiteSpace: 'nowrap',
    }}>
      {label}
    </span>
  );
}

function WhyThisMatch({ chips }) {
  if (!chips || chips.length === 0) return null;
  return (
    <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 10, background: 'rgba(59,130,246,0.05)', border: '1px solid var(--border)' }}>
      <div style={{ fontSize: 10, fontFamily: 'JetBrains Mono', color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        💬 Why this match?
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
        {chips.map((chip, i) => (
          <SimilarityChip key={i} label={chip.label} type={chip.type} />
        ))}
      </div>
    </div>
  );
}

// ── Score bar with correct 0–1.3 range ───────────────────────────────────
// FIX: score is in 0–1.3 range (weighted Jaccard + bonuses), not 0–1
// Clamp display percentage to 100%, but show accurate % text
const ScoreBar = ({ score, matchQuality }) => {
  // Normalize for display: cap at 100% visually but score can exceed 1.0
  const displayPct = Math.min((score / 1.3) * 100, 100);
  const humanPct   = Math.round(score * 100);

  let color, label;
  if (matchQuality === 'best')   { color = '#10b981'; label = 'Strong match'; }
  else if (matchQuality === 'strong') { color = '#3b82f6'; label = 'Good match'; }
  else if (matchQuality === 'weak')   { color = '#f59e0b'; label = 'Low match'; }
  else                                { color = '#6b7280'; label = 'Very low match'; }

  // FIX: if score is effectively 0, show "Low match" instead of 0%
  const displayText = humanPct === 0 ? 'Low match' : `${humanPct}% similarity`;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
        <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono', color: 'var(--text-muted)' }}>{label}</span>
        <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono', color, fontWeight: 700 }}>{displayText}</span>
      </div>
      <div style={{ height: 4, borderRadius: 99, background: 'var(--bg-elevated)' }}>
        <div style={{ height: '100%', width: `${Math.max(displayPct, 2)}%`, borderRadius: 99, background: color, transition: 'width 0.5s' }} />
      </div>
    </div>
  );
};

// ── Match Quality Badge ────────────────────────────────────────────────────
// FIX: Only show "Best Match" badge when score actually qualifies
function MatchBadge({ matchQuality, isFirst }) {
  // Show "Best Match" only if score is >= BEST_MATCH_THRESHOLD (set in backend)
  if (matchQuality === 'best') {
    return (
      <div style={{
        position: 'absolute', top: 14, right: 14,
        background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
        color: 'white',
        fontSize: 10, fontFamily: 'JetBrains Mono', fontWeight: 700,
        padding: '4px 12px', borderRadius: 99,
        boxShadow: '0 2px 8px rgba(59,130,246,0.4)',
      }}>
        ★ Best Match
      </div>
    );
  }
  // For strong matches that happen to be #1 but below best threshold
  if (matchQuality === 'strong' && isFirst) {
    return (
      <div style={{
        position: 'absolute', top: 14, right: 14,
        background: 'rgba(59,130,246,0.15)',
        border: '1px solid rgba(59,130,246,0.35)',
        color: '#60a5fa',
        fontSize: 10, fontFamily: 'JetBrains Mono',
        padding: '3px 10px', borderRadius: 99,
      }}>
        Top Result
      </div>
    );
  }
  return null;
}

function suggestCommunityName(skills) {
  if (!skills || skills.length === 0) return '';
  const s = skills.map(x => x.toLowerCase());
  if (s.some(x => ['python','pytorch','tensorflow','machine learning','deep learning','langchain','pandas','numpy','fastapi'].includes(x))) return 'AI / ML Builders';
  if (s.some(x => ['react','vue','angular','css','html','typescript','sass','three.js','scss'].includes(x))) return 'Frontend Developers';
  if (s.some(x => ['node','express','java','mongodb','postgresql','redis','spring','graphql'].includes(x))) return 'Backend Engineers';
  if (s.some(x => ['unreal engine','unity','c++','game','blender','webgl','opengl'].includes(x))) return 'Game Dev & Graphics';
  if (s.some(x => ['docker','kubernetes','aws','ci/cd','terraform','linux','devops'].includes(x))) return 'DevOps & Cloud';
  if (s.some(x => ['cybersecurity','ethical hacking','cryptography','penetration testing','owasp'].includes(x))) return 'Security Community';
  if (s.some(x => ['react native','flutter','swift','kotlin','android','ios'].includes(x))) return 'Mobile Developers';
  if (s.some(x => ['sql','tableau','power bi','excel','r','data analysis','analytics'].includes(x))) return 'Data Analytics';
  const top = skills.slice(0, 2).map(sk => sk.charAt(0).toUpperCase() + sk.slice(1)).join(' & ');
  return `${top} Community`;
}

// ── Create Community Modal ────────────────────────────────────────────────
function CreateCommunityModal({ onClose, onCreated, userSkills }) {
  const [name, setName] = useState(() => suggestCommunityName(userSkills));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async () => {
    if (!name.trim()) { setError('Please enter a community name.'); return; }
    setLoading(true); setError('');
    try {
      const res = await createCommunity({ name: name.trim() });
      onCreated(res.data.community);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create community');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div className="card" style={{ maxWidth: 440, width: '100%', padding: 30, boxShadow: '0 24px 64px rgba(0,0,0,0.5)' }}>
        <div style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: 20, color: 'var(--text-white)', marginBottom: 6 }}>Create New Community</div>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: 20 }}>
          Your skills will be used as community tags. You'll be the founding member.
        </p>

        {userSkills.length > 0 && (
          <div style={{ marginBottom: 16, padding: '10px 14px', borderRadius: 10, background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 10, fontFamily: 'JetBrains Mono', color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase' }}>Auto-tags from your skills</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {userSkills.slice(0, 8).map(s => <SkillTag key={s} skill={s} variant="slate" />)}
            </div>
          </div>
        )}

        {error && (
          <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171', fontSize: 13, marginBottom: 14 }}>
            {error}
          </div>
        )}

        <label className="label">Community Name</label>
        <input
          className="input"
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleCreate()}
          placeholder="e.g. Python ML Builders, React Enthusiasts..."
          style={{ marginBottom: 16 }}
        />

        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-primary" style={{ flex: 2 }} onClick={handleCreate} disabled={loading}>
            {loading ? 'Creating...' : '✦ Create Community'}
          </button>
          <button className="btn-secondary" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

export default function Community() {
  const { user, refreshUser } = useAuth();
  const [myCommunity, setMyCommunity]         = useState(null);
  const [members, setMembers]                 = useState([]);
  const [allCommunities, setAllCommunities]   = useState([]);
  const [recommended, setRecommended]         = useState([]);
  const [weakSuggestions, setWeakSuggestions] = useState([]);
  const [canCreate, setCanCreate]             = useState(false);
  const [noStrongMatch, setNoStrongMatch]     = useState(false);
  const [tab, setTab]               = useState('mine');
  const [loading, setLoading]       = useState(true);
  const [joining, setJoining]       = useState(null);
  const [confirmJoin, setConfirmJoin] = useState(null);
  const [joinMsg, setJoinMsg]       = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  // FIX: track if user has viewed the recommended tab — clears the notification dot
  const [recommendedViewed, setRecommendedViewed] = useState(false);

  const handleTabChange = (key) => {
    setTab(key);
    if (key === 'recommend') setRecommendedViewed(true); // clear dot on view
  };

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [myRes, allRes, recRes] = await Promise.all([
        getMyCommunity(),
        getAllCommunities(),
        getRecommendedCommunities(),
      ]);
      setMyCommunity(myRes.data.community);
      setMembers(myRes.data.members || []);
      setAllCommunities(allRes.data);
      setRecommended(recRes.data.recommendations || []);
      setWeakSuggestions(recRes.data.weakSuggestions || []);
      setCanCreate(recRes.data.canCreate || false);
      setNoStrongMatch(recRes.data.noStrongMatch || false);
      // Reset viewed state whenever recommendations change (e.g. after profile update)
      if ((recRes.data.recommendations || []).length > 0) setRecommendedViewed(false);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleJoin = async (communityId) => {
    setJoining(communityId);
    try {
      await joinCommunity({ communityId });
      await refreshUser();
      setJoinMsg('Community joined! 🎉');
      await fetchAll();
      setTab('mine');
      setTimeout(() => setJoinMsg(''), 3000);
    } catch (err) {
      setJoinMsg(err.response?.data?.message || 'Failed to join');
    } finally { setJoining(null); }
  };

  const handleCreated = async (newComm) => {
    setShowCreateModal(false);
    await refreshUser();
    await fetchAll();
    setTab('mine');
    setJoinMsg(`"${newComm.name}" created and you've been added! 🎉`);
    setTimeout(() => setJoinMsg(''), 4000);
  };

  // Derive user skills for create modal
  const userSkills = [
    ...((user?.skillsOffered || []).map(s => typeof s === 'string' ? s : s?.name).filter(Boolean)),
    ...((user?.skillsWanted  || []).map(s => typeof s === 'string' ? s : s?.name).filter(Boolean)),
  ];

  const tabStyle = (key) => ({
    padding: '11px 18px', fontSize: 13, fontWeight: 500, cursor: 'pointer',
    border: 'none', background: 'none', marginBottom: -1,
    borderBottom: `2px solid ${tab === key ? 'var(--accent)' : 'transparent'}`,
    color: tab === key ? 'var(--accent-text)' : 'var(--text-muted)',
    transition: 'all 0.2s', fontFamily: 'Space Grotesk, sans-serif',
  });

  return (
    <Layout>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {showCreateModal && (
        <CreateCommunityModal
          onClose={() => setShowCreateModal(false)}
          onCreated={handleCreated}
          userSkills={userSkills}
        />
      )}

      <div style={{ marginBottom: 28 }}>
        <h1 className="page-title">Community</h1>
        <p style={{ color: 'var(--text-muted)', marginTop: 6, fontSize: 14 }}>
          Explore your learning community and discover others
        </p>
      </div>

      {joinMsg && (
        <div style={{
          marginBottom: 16, padding: '12px 16px', borderRadius: 12, fontSize: 14,
          background: joinMsg.includes('!') ? 'rgba(16,185,129,0.1)' : 'rgba(220,38,38,0.1)',
          border: `1px solid ${joinMsg.includes('!') ? 'rgba(16,185,129,0.3)' : 'rgba(220,38,38,0.3)'}`,
          color: joinMsg.includes('!') ? '#10b981' : '#f87171',
        }}>
          {joinMsg}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: 22, gap: 2, alignItems: 'flex-end' }}>
        <button style={tabStyle('mine')} onClick={() => handleTabChange('mine')}>My Community</button>
        <button style={tabStyle('recommend')} onClick={() => handleTabChange('recommend')}>
          Recommended
          {/* FIX: only show dot if there are recommendations AND user hasn't viewed yet */}
          {recommended.length > 0 && !recommendedViewed && (
            <span style={{ marginLeft: 6, background: 'var(--accent)', color: 'white', borderRadius: 99, padding: '1px 7px', fontSize: 11 }}>
              {recommended.length}
            </span>
          )}
        </button>
        <button style={tabStyle('all')} onClick={() => handleTabChange('all')}>Browse All</button>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary"
          style={{ marginLeft: 'auto', fontSize: 12, padding: '7px 16px', marginBottom: 4 }}
        >
          + Create Community
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', height: 160, alignItems: 'center' }}>
          <div style={{ width: 32, height: 32, border: '2px solid var(--accent)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        </div>

      ) : tab === 'mine' ? (
        /* ── MY COMMUNITY ── */
        myCommunity ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div className="card" style={{ padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: 10, fontFamily: 'JetBrains Mono', color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Your Community</div>
                  <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 22, fontWeight: 700, marginBottom: 12, color: 'var(--text-white)' }} className="text-gradient">
                    {myCommunity.name}
                  </h2>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {myCommunity.tags?.map(t => <SkillTag key={t} skill={t} variant="slate" />)}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 20 }}>
                  <div style={{ fontFamily: 'Outfit', fontSize: 40, fontWeight: 800, color: 'var(--accent)', lineHeight: 1 }}>{myCommunity.memberCount}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>members</div>
                </div>
              </div>
              <div style={{ paddingTop: 14, borderTop: '1px solid var(--border)', display: 'flex', gap: 10 }}>
                <button onClick={() => setTab('recommend')} className="btn-secondary" style={{ fontSize: 13 }}>
                  ⟡ Find Better Match
                </button>
                <button onClick={() => setShowCreateModal(true)} className="btn-ghost" style={{ fontSize: 13 }}>
                  + Create New
                </button>
              </div>
            </div>

            <div className="section-title" style={{ marginBottom: 4 }}>Community Members</div>
            {members.length === 0 ? (
              <div className="card" style={{ padding: 36, textAlign: 'center' }}>
                <div style={{ fontSize: 32, marginBottom: 10, opacity: 0.25 }}>👥</div>
                <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>You're the only member so far.</div>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>Invite peers or check Recommended to grow your community.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {members.map(m => <UserCard key={m._id} user={m} />)}
              </div>
            )}
          </div>
        ) : (
          <div className="card" style={{ padding: 56, textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 14, opacity: 0.3 }}>◈</div>
            <div className="section-title" style={{ marginBottom: 8 }}>No Community Yet</div>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 20 }}>
              Check the Recommended tab to find your best match, or create a new community based on your skills.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={() => setTab('recommend')} className="btn-primary">See Recommendations →</button>
              <button onClick={() => setShowCreateModal(true)} className="btn-secondary">+ Create Community</button>
            </div>
          </div>
        )

      ) : tab === 'recommend' ? (
        /* ── RECOMMENDED (with threshold logic) ── */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* FIX: No strong match state — show message + create CTA */}
          {noStrongMatch && (
            <div style={{
              padding: '20px 24px', borderRadius: 16,
              background: 'linear-gradient(135deg, rgba(245,158,11,0.08), rgba(245,158,11,0.03))',
              border: '1px solid rgba(245,158,11,0.25)',
              marginBottom: 4,
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                <div style={{ fontSize: 28, flexShrink: 0 }}>⟡</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: 16, color: 'var(--text-white)', marginBottom: 6 }}>
                    No strong community match found
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: 14 }}>
                    None of the existing communities closely match your skills. You can either join a partial match below, or start a new community built around your expertise.
                  </p>
                  <button onClick={() => setShowCreateModal(true)} className="btn-primary" style={{ fontSize: 13 }}>
                    ✦ Create a community based on your skills →
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Strong matches */}
          {recommended.length > 0 && (
            <>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono', marginBottom: 4 }}>
                Matched using Jaccard similarity + category alignment + role balance · threshold ≥ 30%
              </p>
              {recommended.map((comm, i) => {
                const isAlreadyJoined = myCommunity?._id?.toString() === comm._id?.toString();
                return (
                  <div key={comm._id}>
                    {isAlreadyJoined && i === 0 && (
                      <div style={{
                        padding: '10px 16px', borderRadius: 10, marginBottom: 8,
                        background: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(16,185,129,0.04))',
                        border: '1px solid rgba(16,185,129,0.3)',
                        display: 'flex', alignItems: 'center', gap: 10,
                        fontSize: 13, color: '#10b981', fontFamily: 'JetBrains Mono',
                      }}>
                        <span>✓</span>
                        <span>You're already in your best match community!</span>
                      </div>
                    )}
                    <CommunityCard
                      comm={comm}
                      isFirst={i === 0}
                      user={user}
                      myCommunity={myCommunity}
                      joining={joining}
                      onJoin={handleJoin}
                      onConfirmJoin={setConfirmJoin}
                    />
                  </div>
                );
              })}
            </>
          )}

          {/* Weak suggestions (shown only when no strong match) */}
          {noStrongMatch && weakSuggestions.length > 0 && (
            <>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono', marginTop: 8, marginBottom: 4, padding: '6px 0', borderTop: '1px solid var(--border)' }}>
                ─ Partial matches (low similarity) ─
              </div>
              {weakSuggestions.map((comm, i) => (
                <CommunityCard
                  key={comm._id}
                  comm={comm}
                  isFirst={false}
                  user={user}
                  myCommunity={myCommunity}
                  joining={joining}
                  onJoin={handleJoin}
                  onConfirmJoin={setConfirmJoin}
                  isWeak
                />
              ))}
            </>
          )}

          {/* Completely empty — no communities at all */}
          {recommended.length === 0 && weakSuggestions.length === 0 && (
            <div className="card" style={{ padding: 48, textAlign: 'center' }}>
              <div style={{ fontSize: 36, marginBottom: 12, opacity: 0.3 }}>⟡</div>
              <div className="section-title" style={{ marginBottom: 8 }}>No Communities Exist Yet</div>
              <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 16 }}>Be the first! Create a community around your skills.</p>
              <button onClick={() => setShowCreateModal(true)} className="btn-primary">+ Create Community →</button>
            </div>
          )}
        </div>

      ) : (
        /* ── BROWSE ALL ── */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {allCommunities.length === 0 ? (
            <div className="card" style={{ padding: 48, textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 10, opacity: 0.25 }}>🌐</div>
              <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 14 }}>No communities exist yet.</div>
              <button onClick={() => setShowCreateModal(true)} className="btn-primary" style={{ fontSize: 13 }}>+ Create the first one →</button>
            </div>
          ) : (
            allCommunities.map(comm => (
              <div key={comm._id} className="card" style={{ padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <h3 style={{ fontFamily: 'Outfit', fontWeight: 600, color: 'var(--text-white)', fontSize: 16, marginBottom: 8 }}>{comm.name}</h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                      {comm.tags?.map(t => <SkillTag key={t} skill={t} variant="slate" />)}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 16 }}>
                    <div style={{ fontFamily: 'Outfit', fontSize: 24, fontWeight: 800, color: 'var(--text-primary)' }}>{comm.members?.length}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>members</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  {comm.members?.slice(0, 6).map(m => (
                    <div key={m._id} title={m.name} style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--bg-elevated)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)' }}>
                      {m.name?.charAt(0).toUpperCase()}
                    </div>
                  ))}
                  {comm.members?.length > 6 && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>+{comm.members.length - 6}</span>}
                  {user?.community?._id === comm._id && <span className="tag-blue" style={{ marginLeft: 'auto' }}>Your Community</span>}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Confirm community switch modal */}
      {confirmJoin && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div className="card" style={{ maxWidth: 400, width: '100%', padding: 28 }}>
            <div style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: 18, color: 'var(--text-white)', marginBottom: 10 }}>Switch Community?</div>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: 20 }}>
              {/* FIX: only show current community name if it's DIFFERENT from the one being joined */}
              {myCommunity && myCommunity._id !== confirmJoin._id ? (
                <>
                  You're currently in <strong style={{ color: 'var(--text-secondary)' }}>{myCommunity.name}</strong>.{' '}
                  Joining <strong style={{ color: 'var(--accent-text)' }}>{confirmJoin.name}</strong> will remove you from your current community.
                </>
              ) : (
                <>Join <strong style={{ color: 'var(--accent-text)' }}>{confirmJoin.name}</strong>?</>
              )}
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn-primary" style={{ flex: 1 }} onClick={() => { handleJoin(confirmJoin._id); setConfirmJoin(null); }}>Yes, Switch</button>
              <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setConfirmJoin(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

// ── Extracted Community Card component ────────────────────────────────────
function CommunityCard({ comm, isFirst, user, myCommunity, joining, onJoin, onConfirmJoin, isWeak = false }) {
  return (
    <div className="card" style={{
      padding: 22, position: 'relative',
      border: !isWeak && isFirst && comm.matchQuality !== 'none'
        ? '1px solid rgba(59,130,246,0.4)'
        : '1px solid var(--border)',
      opacity: isWeak ? 0.85 : 1,
    }}>
      <MatchBadge matchQuality={comm.matchQuality} isFirst={isFirst} />

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 8 }}>
            <div style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: 17, color: 'var(--text-white)' }}>
              {comm.name}
            </div>
            {isWeak && (
              <span style={{ fontSize: 10, fontFamily: 'JetBrains Mono', color: '#f59e0b', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', padding: '2px 8px', borderRadius: 99 }}>
                Partial Match
              </span>
            )}
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 14 }}>
            {comm.tags?.slice(0, 6).map(t => <SkillTag key={t} skill={t} variant="slate" />)}
          </div>

          {/* FIX: Use ScoreBar with correct scale and matchQuality */}
          <ScoreBar score={comm.score} matchQuality={comm.matchQuality} />

          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6, fontFamily: 'JetBrains Mono' }}>
            {comm.memberCount} member{comm.memberCount !== 1 ? 's' : ''}
            {comm.sharedSkillCount > 0 && ` · ${comm.sharedSkillCount} shared skill${comm.sharedSkillCount !== 1 ? 's' : ''}`}
          </div>

          {/* Why this match */}
          {comm.similarityChips?.length > 0 && !isWeak && (
            <WhyThisMatch chips={comm.similarityChips} />
          )}
        </div>

        <div style={{ flexShrink: 0 }}>
          {myCommunity?._id?.toString() === comm._id?.toString() ? (
            <span style={{ fontSize: 12, color: '#10b981', fontFamily: 'JetBrains Mono', padding: '8px 14px', borderRadius: 99, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)' }}>✓ Your Community</span>
          ) : (
            <button
              onClick={() => myCommunity ? onConfirmJoin(comm) : onJoin(comm._id)}
              disabled={joining === comm._id}
              className="btn-primary"
              style={{ fontSize: 13, padding: '10px 18px' }}
            >
              {joining === comm._id ? 'Joining...' : 'Join →'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
