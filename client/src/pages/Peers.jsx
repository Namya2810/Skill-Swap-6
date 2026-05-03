import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getRecommendations, sendMentorshipRequest, getSessions, endorseSkill } from '../api';
import Layout from '../components/Layout';
import SkillTag from '../components/SkillTag';
import { useAuth } from '../context/AuthContext';

const LEVEL_COLORS = { Beginner: '#fbbf24', Intermediate: '#60a5fa', Advanced: '#34d399' };
const LEVEL_SYMBOLS = { Beginner: '○', Intermediate: '◑', Advanced: '●' };

function SkillChip({ skill, variant }) {
  const name  = typeof skill === 'string' ? skill : skill?.name;
  const level = typeof skill === 'object' ? skill?.level : null;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      <SkillTag skill={name} variant={variant} />
      {level && (
        <span style={{ fontSize: 10, color: LEVEL_COLORS[level], fontFamily: 'JetBrains Mono', fontWeight: 600 }} title={level}>
          {LEVEL_SYMBOLS[level]} {level}
        </span>
      )}
    </span>
  );
}

function ScoreBreakdown({ score, scoreBreakdown, maxScore = 15 }) {
  if (!scoreBreakdown) {
    const pct = Math.min((score / maxScore) * 100, 100);
    const color = pct >= 60 ? '#10b981' : pct >= 30 ? '#3b82f6' : '#f59e0b';
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, alignItems: 'center' }}>
          <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono', color: 'var(--text-muted)' }}>Match score</span>
          <span style={{ fontSize: 12, fontWeight: 700, color, fontFamily: 'JetBrains Mono' }}>{score} pts</span>
        </div>
        <div style={{ height: 5, borderRadius: 99, background: 'var(--bg-elevated)', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, borderRadius: 99, background: color, transition: 'width 0.7s ease' }} />
        </div>
      </div>
    );
  }
  const { skillMatch = 0, communityBonus = 0, categoryBonus = 0 } = scoreBreakdown;
  const pct   = Math.min((score / maxScore) * 100, 100);
  const color = pct >= 60 ? '#10b981' : pct >= 30 ? '#3b82f6' : '#f59e0b';
  const label = pct >= 60 ? 'Strong match' : pct >= 30 ? 'Good match' : 'Partial match';
  const Chip = ({ value, label, color, icon }) => value > 0 ? (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 99, background: `${color}18`, border: `1px solid ${color}40`, fontSize: 11, fontFamily: 'JetBrains Mono', color }}>
      <span>{icon}</span><span style={{ fontWeight: 700 }}>{value}</span><span style={{ opacity: 0.8 }}>{label}</span>
    </div>
  ) : null;
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, alignItems: 'center' }}>
        <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono', color: 'var(--text-muted)' }}>{label}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color, fontFamily: 'JetBrains Mono' }}>{score} pts</span>
      </div>
      <div style={{ height: 5, borderRadius: 99, background: 'var(--bg-elevated)', overflow: 'hidden', marginBottom: 10 }}>
        <div style={{ height: '100%', width: `${pct}%`, borderRadius: 99, background: `linear-gradient(90deg, ${color}99, ${color})`, transition: 'width 0.7s ease' }} />
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        <Chip value={skillMatch}    label="skill pts"       color="#3b82f6" icon="⚡" />
        <Chip value={communityBonus} label="community bonus" color="#8b5cf6" icon="◈" />
        <Chip value={categoryBonus}  label="category bonus"  color="#10b981" icon="🏷" />
      </div>
    </div>
  );
}

function MatchExplanation({ matchedSkills, canTeach, isConnected }) {
  const rows = [];
  if (matchedSkills.length > 0) rows.push({ icon: '🎓', label: 'They can teach you:', skills: matchedSkills, variant: 'emerald' });
  if (canTeach.length > 0)      rows.push({ icon: '💡', label: 'You can teach them:', skills: canTeach, variant: 'blue' });
  if (isConnected)              rows.push({ icon: '◈', label: 'Same community', skills: [], note: '+2 bonus', variant: 'violet' });
  if (matchedSkills.length > 0 && canTeach.length > 0) rows.push({ icon: '⇌', label: 'Mutual exchange', skills: [], note: 'You both have something to offer', variant: 'amber' });
  if (rows.length === 0) return null;
  return (
    <div className="match-explanation">
      <div className="match-explanation-title">💬 Why this match?</div>
      {rows.map((row, i) => (
        <div key={i} className="match-row">
          <span className="match-row-icon">{row.icon}</span>
          <span className="match-row-label">{row.label}</span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, flex: 1 }}>
            {row.skills.map((s, idx) => <SkillChip key={idx} skill={s} variant={row.variant} />)}
            {row.note && <span style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>{row.note}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}

// Endorse button shown when there's a completed session with this peer
function EndorsePanel({ peer, completedSessions }) {
  const session = completedSessions.find(s =>
    s.host?._id === peer._id || s.requester?._id === peer._id
  );
  const [endorsed, setEndorsed] = useState(new Set());
  const [msg, setMsg] = useState('');

  if (!session) return null;

  const skills = [...(peer.skillsOffered || [])].map(s => typeof s === 'string' ? s : s.name).filter(Boolean);
  if (skills.length === 0) return null;

  const handleEndorse = async (skill) => {
    try {
      await endorseSkill({ toUserId: peer._id, skill, sessionId: session._id });
      setEndorsed(prev => new Set([...prev, skill]));
      setMsg(`Endorsed "${skill}" ✓`);
      setTimeout(() => setMsg(''), 2500);
    } catch (err) {
      setMsg(err.response?.data?.message || 'Already endorsed');
      setTimeout(() => setMsg(''), 2500);
    }
  };

  return (
    <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 10, background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)' }}>
      <div style={{ fontSize: 11, fontFamily: 'JetBrains Mono', color: '#34d399', marginBottom: 8 }}>✓ Session completed — endorse their skills:</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {skills.slice(0, 4).map(skill => (
          <button key={skill} onClick={() => handleEndorse(skill)} disabled={endorsed.has(skill)}
            style={{
              fontSize: 12, padding: '4px 10px', borderRadius: 99, cursor: endorsed.has(skill) ? 'default' : 'pointer',
              border: `1px solid ${endorsed.has(skill) ? 'rgba(16,185,129,0.5)' : 'rgba(16,185,129,0.3)'}`,
              background: endorsed.has(skill) ? 'rgba(16,185,129,0.15)' : 'transparent',
              color: endorsed.has(skill) ? '#34d399' : 'var(--text-muted)',
              transition: 'all 0.2s', fontFamily: 'JetBrains Mono',
            }}>
            {endorsed.has(skill) ? '✓ ' : '+ '}{skill}
          </button>
        ))}
      </div>
      {msg && <div style={{ marginTop: 6, fontSize: 11, color: '#34d399', fontFamily: 'JetBrains Mono' }}>{msg}</div>}
    </div>
  );
}

export default function Peers() {
  const navigate = useNavigate();
  const [peers, setPeers]             = useState([]);
  const [loading, setLoading]         = useState(true);
  const [sendingId, setSendingId]     = useState(null);
  const [messageMap, setMessageMap]   = useState({});
  const [expandedId, setExpandedId]   = useState(null);
  const [sentIds, setSentIds]         = useState(new Set());
  const [completedSessions, setCompletedSessions] = useState([]);
  const [roleFilter, setRoleFilter]   = useState('All');
  const [search, setSearch]           = useState('');

  useEffect(() => {
    Promise.all([getRecommendations(), getSessions()])
      .then(([recRes, sessRes]) => {
        setPeers(recRes.data);
        setCompletedSessions((sessRes.data || []).filter(s => s.status === 'Completed'));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSendRequest = async (receiverId) => {
    setSendingId(receiverId);
    try {
      await sendMentorshipRequest({ receiverId, message: messageMap[receiverId] || '', skillsRequested: [] });
      setSentIds(prev => new Set([...prev, receiverId]));
      setExpandedId(null);
    } catch (err) { alert(err.response?.data?.message || 'Failed to send request'); }
    finally { setSendingId(null); }
  };

  const filtered = peers.filter(({ user: peer }) => {
    const matchesRole = roleFilter === 'All' || peer.role === roleFilter;
    const q = search.toLowerCase();
    const matchesSearch = !q || peer.name?.toLowerCase().includes(q) ||
      [...(peer.skillsOffered || []), ...(peer.skillsWanted || [])].some(s => (typeof s === 'string' ? s : s?.name || '').toLowerCase().includes(q));
    return matchesRole && matchesSearch;
  });

  return (
    <Layout>
      <div style={{ marginBottom: 20 }}>
        <h1 className="page-title">Peer Recommendations</h1>
        <p style={{ color: 'var(--text-muted)', marginTop: 6, fontSize: 14 }}>Matched by skill overlap, category alignment, and community bonus</p>
      </div>

      {/* Filter bar */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or skill..."
          className="input" style={{ flex: 1, minWidth: 200, maxWidth: 320, padding: '9px 14px', fontSize: 13 }} />
        <div style={{ display: 'flex', gap: 6 }}>
          {['All', 'Mentor', 'Learner'].map(r => (
            <button key={r} onClick={() => setRoleFilter(r)}
              style={{
                padding: '8px 16px', borderRadius: 99, fontSize: 12, cursor: 'pointer', fontWeight: 600,
                border: `1px solid ${roleFilter === r ? 'var(--accent)' : 'var(--border)'}`,
                background: roleFilter === r ? 'rgba(59,130,246,0.15)' : 'transparent',
                color: roleFilter === r ? 'var(--accent-text)' : 'var(--text-muted)',
                transition: 'all 0.15s',
              }}>
              {r}
            </button>
          ))}
        </div>
        <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono', marginLeft: 4 }}>
          {filtered.length} match{filtered.length !== 1 ? 'es' : ''}
        </span>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', height: 180, alignItems: 'center' }}>
          <div style={{ width: 32, height: 32, border: '2px solid var(--accent)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">🔍</div>
            <div className="empty-state-title">{peers.length === 0 ? 'No matches found yet' : 'No results for this filter'}</div>
            <p className="empty-state-desc">{peers.length === 0 ? 'Add skills to your profile to get matched with peers.' : 'Try a different role or search term.'}</p>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {filtered.map(({ user: peer, score, matchedSkills, canTeach, isConnected, scoreBreakdown }) => (
            <div key={peer._id} className="card card-hover" style={{ padding: 24 }}>
              <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                {/* Avatar */}
                <div style={{ width: 50, height: 50, borderRadius: 14, flexShrink: 0, background: 'linear-gradient(135deg, var(--accent), var(--accent-2))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Outfit', fontWeight: 700, color: 'white', fontSize: 21, boxShadow: '0 2px 10px rgba(37,99,235,0.3)' }}>
                  {peer.name?.charAt(0).toUpperCase()}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2, flexWrap: 'wrap' }}>
                    <span style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: 18, color: 'var(--text-white)' }}>{peer.name}</span>
                    <span className={`tag ${peer.role === 'Mentor' ? 'tag-amber' : 'tag-slate'}`}>{peer.role}</span>
                    {isConnected     && <span className="conn-pill conn-pill-connected">● Connected</span>}
                    {sentIds.has(peer._id) && !isConnected && <span className="conn-pill conn-pill-pending">⏳ Pending</span>}
                  </div>

                  {/* Bio */}
                  {peer.bio && (
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 10px', lineHeight: 1.6, fontStyle: 'italic', maxWidth: 520 }}>
                      "{peer.bio}"
                    </p>
                  )}

                  <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono', marginBottom: 14 }}>{peer.email}</div>

                  <ScoreBreakdown score={score} scoreBreakdown={scoreBreakdown} />
                  <MatchExplanation matchedSkills={matchedSkills} canTeach={canTeach} isConnected={isConnected} />
                  <EndorsePanel peer={peer} completedSessions={completedSessions} />
                </div>

                {/* Action — show Connect only if peer can teach me something I want to learn */}
                <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
                  {isConnected ? (
                    <button onClick={() => navigate(`/messages?with=${peer._id}`)} className="btn-primary" style={{ fontSize: 13, padding: '10px 18px', whiteSpace: 'nowrap' }}>✉ Message</button>
                  ) : sentIds.has(peer._id) ? (
                    <button disabled className="btn-primary" style={{ fontSize: 13, padding: '10px 18px', opacity: 0.6, cursor: 'default' }}>⏳ Pending</button>
                  ) : matchedSkills.length === 0 && canTeach.length > 0 ? (
                    /* I can teach them but they can't teach me — they should request me */
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono', padding: '10px 14px', borderRadius: 10, background: 'var(--bg-elevated)', border: '1px solid var(--border)', textAlign: 'center', maxWidth: 170 }}>
                      <div style={{ fontSize: 15, marginBottom: 4 }}>📢</div>
                      They can request you
                    </div>
                  ) : matchedSkills.length === 0 ? (
                    /* No useful skill overlap */
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono', padding: '10px 14px', borderRadius: 10, background: 'var(--bg-elevated)', border: '1px solid var(--border)', textAlign: 'center', maxWidth: 170 }}>
                      <div style={{ fontSize: 15, marginBottom: 4 }}>🤝</div>
                      Connect via community
                    </div>
                  ) : expandedId === peer._id ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 210 }}>
                      <textarea rows={2} placeholder="Add a note (optional)..." value={messageMap[peer._id] || ''}
                        onChange={e => setMessageMap(p => ({ ...p, [peer._id]: e.target.value }))}
                        className="input" style={{ fontSize: 13, resize: 'none' }} />
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => handleSendRequest(peer._id)} disabled={sendingId === peer._id}
                          className="btn-primary" style={{ flex: 1, fontSize: 13, padding: 9 }}>
                          {sendingId === peer._id ? 'Sending...' : 'Send Request →'}
                        </button>
                        <button onClick={() => setExpandedId(null)} className="btn-ghost" style={{ fontSize: 13 }}>✕</button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => setExpandedId(peer._id)} className="btn-primary" style={{ fontSize: 13, padding: '10px 18px', whiteSpace: 'nowrap' }}>Connect →</button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </Layout>
  );
}
