import { useState, useEffect } from 'react';
import { updateProfile, getFeedback, getEndorsements } from '../api';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import SkillInput from '../components/SkillInput';
import SkillTag from '../components/SkillTag';

const LEVEL_STYLES = {
  Beginner:     { color: '#fbbf24', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)' },
  Intermediate: { color: '#60a5fa', bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.3)' },
  Advanced:     { color: '#34d399', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)' },
};

function SkillWithLevel({ skill }) {
  const name  = typeof skill === 'string' ? skill : skill?.name;
  const level = typeof skill === 'object' ? (skill?.level || 'Beginner') : 'Beginner';
  const ls = LEVEL_STYLES[level] || LEVEL_STYLES.Beginner;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      <SkillTag skill={name} />
      <span style={{ fontSize: 10, fontFamily: 'JetBrains Mono', fontWeight: 600, padding: '1px 6px', borderRadius: 99, background: ls.bg, border: `1px solid ${ls.border}`, color: ls.color }}>
        {level}
      </span>
    </div>
  );
}

function StarDisplay({ rating, count }) {
  const full = Math.round(rating);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ color: '#fbbf24', fontSize: 18, letterSpacing: 2 }}>
        {'★'.repeat(full)}{'☆'.repeat(5 - full)}
      </span>
      <span style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: 20, color: '#fbbf24' }}>{rating.toFixed(1)}</span>
      {count != null && <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono' }}>({count} review{count !== 1 ? 's' : ''})</span>}
    </div>
  );
}

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const [form, setForm] = useState({ name: '', bio: '', role: 'Learner' });
  const [skillsOffered, setSkillsOffered] = useState([]);
  const [skillsWanted,  setSkillsWanted]  = useState([]);
  const [success, setSuccess] = useState('');
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback,     setFeedback]    = useState({ received: [], avgRating: null });
  const [endorsements, setEndorsements] = useState([]);

  useEffect(() => {
    if (user) {
      setForm({ name: user.name || '', bio: user.bio || '', role: user.role || 'Learner' });
      setSkillsOffered(user.skillsOffered || []);
      setSkillsWanted(user.skillsWanted   || []);
      // Fetch feedback and endorsements
      getFeedback().then(r => setFeedback(r.data)).catch(()=>{});
      getEndorsements(user._id).then(r => setEndorsements(r.data || [])).catch(()=>{});
    }
  }, [user]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess(''); setLoading(false);
    if (form.role === 'Mentor'  && skillsOffered.length === 0) { setError('Mentors must add at least one skill they can offer/teach.'); return; }
    if (form.role === 'Learner' && skillsWanted.length  === 0) { setError('Learners must add at least one skill they want to learn.'); return; }
    if (skillsOffered.length === 0 && skillsWanted.length === 0) { setError('Please add at least one skill.'); return; }
    setLoading(true);
    try {
      await updateProfile({ ...form, skillsOffered, skillsWanted });
      await refreshUser();
      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Update failed');
    } finally { setLoading(false); }
  };

  return (
    <Layout>
      <div style={{ marginBottom: 32 }}>
        <h1 className="page-title">Profile</h1>
        <p style={{ color: 'var(--text-muted)', marginTop: 6 }}>Manage your identity and skill portfolio</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 24 }}>
        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Avatar card */}
          <div className="card" style={{ padding: 24, textAlign: 'center' }}>
            <div style={{ width: 72, height: 72, borderRadius: 18, background: 'linear-gradient(135deg, var(--accent), var(--accent-2))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, fontFamily: 'Outfit', fontWeight: 700, color: 'white', margin: '0 auto 16px' }}>
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div style={{ fontFamily: 'Outfit', fontWeight: 600, color: 'var(--text-white)', fontSize: 17 }}>{user?.name}</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>{user?.email}</div>
            <span className={`tag ${user?.role === 'Mentor' ? 'tag-amber' : 'tag-blue'}`} style={{ marginTop: 10, display: 'inline-flex' }}>{user?.role}</span>

            {/* Session rating */}
            {feedback.avgRating != null && (
              <div style={{ marginTop: 14, padding: '12px', borderRadius: 10, background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 10, fontFamily: 'JetBrains Mono', color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Session Rating</div>
                <StarDisplay rating={feedback.avgRating} count={feedback.received?.length} />
              </div>
            )}

            {user?.community && (
              <div style={{ marginTop: 14, padding: '10px 12px', borderRadius: 10, background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 10, fontFamily: 'JetBrains Mono', color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Community</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-white)' }}>{user.community.name}</div>
              </div>
            )}
          </div>

          {/* Endorsements */}
          {endorsements.length > 0 && (
            <div className="card" style={{ padding: 18 }}>
              <div style={{ fontSize: 10, fontFamily: 'JetBrains Mono', color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Endorsements</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {endorsements.map(e => (
                  <div key={e.skill} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <SkillTag skill={e.skill} />
                    <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      +{e.count} endorsement{e.count !== 1 ? 's' : ''}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Skill level summary */}
          {(skillsOffered.length > 0 || skillsWanted.length > 0) && (
            <div className="card" style={{ padding: 18 }}>
              <div style={{ fontSize: 10, fontFamily: 'JetBrains Mono', color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Skill Levels</div>
              {skillsOffered.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 7, fontFamily: 'JetBrains Mono' }}>🎓 Offering</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {skillsOffered.map((s, i) => <SkillWithLevel key={i} skill={s} />)}
                  </div>
                </div>
              )}
              {skillsWanted.length > 0 && (
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 7, fontFamily: 'JetBrains Mono' }}>📚 Learning</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {skillsWanted.map((s, i) => <SkillWithLevel key={i} skill={s} />)}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right column — form + feedback history */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {success && <div style={{ padding: '12px 16px', borderRadius: 12, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', color: '#34d399', fontSize: 14 }}>{success}</div>}
          {error   && <div style={{ padding: '12px 16px', borderRadius: 12, background: 'rgba(220,38,38,0.1)',   border: '1px solid rgba(220,38,38,0.25)',   color: '#f87171', fontSize: 14 }}>{error}</div>}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="card" style={{ padding: 24 }}>
              <div className="section-title" style={{ marginBottom: 18 }}>Basic Information</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div><label className="label">Full Name</label><input name="name" required value={form.name} onChange={handleChange} className="input" /></div>
                <div>
                  <label className="label">Role</label>
                  <select name="role" value={form.role} onChange={handleChange} className="input">
                    <option value="Learner">Learner</option>
                    <option value="Mentor">Mentor</option>
                  </select>
                </div>
              </div>
              <div><label className="label">Bio</label><textarea name="bio" value={form.bio} onChange={handleChange} rows={3} placeholder="Tell the community about yourself..." className="input" style={{ resize: 'none' }} /></div>
            </div>

            <div className="card" style={{ padding: 24 }}>
              <div className="section-title" style={{ marginBottom: 4 }}>Skill Portfolio</div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono', marginBottom: 18 }}>Add skills, then click the level badge to set Beginner / Intermediate / Advanced</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <SkillInput label="Skills I Can Offer / Teach" skills={skillsOffered} onChange={setSkillsOffered} variant="emerald" placeholder="Add a skill you can teach..." />
                <SkillInput label="Skills I Want to Learn"     skills={skillsWanted}  onChange={setSkillsWanted}  variant="cyan"    placeholder="Add a skill you want to learn..." />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" disabled={loading} className="btn-primary" style={{ padding: '12px 32px' }}>
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>

          {/* Feedback History */}
          {feedback.received?.length > 0 && (
            <div className="card" style={{ padding: 24 }}>
              <div className="section-title" style={{ marginBottom: 16 }}>Feedback Received</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {feedback.received.map((f, i) => (
                  <div key={i} style={{ padding: '14px 16px', borderRadius: 12, background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg, var(--accent), var(--accent-2))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'white' }}>
                          {f.fromUser?.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-white)' }}>{f.fromUser?.name}</div>
                          <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono' }}>{f.fromUser?.role}</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ color: '#fbbf24', fontSize: 13 }}>{'★'.repeat(f.rating)}{'☆'.repeat(5 - f.rating)}</span>
                        <span style={{ fontSize: 12, fontFamily: 'JetBrains Mono', color: '#fbbf24', fontWeight: 700 }}>{f.rating}/5</span>
                      </div>
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0, fontStyle: 'italic' }}>"{f.message}"</p>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono', marginTop: 8 }}>
                      {new Date(f.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
