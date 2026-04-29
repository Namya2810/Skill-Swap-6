import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register } from '../api';
import { useAuth } from '../context/AuthContext';
import SkillInput from '../components/SkillInput';
import SkillLinkLogo from '../components/SkillLinkLogo';

const ROLES = [
  { value: 'Learner', icon: '📖', title: 'Learner', desc: 'I want to learn from experienced peers and mentors' },
  { value: 'Mentor',  icon: '🎯', title: 'Mentor',  desc: 'I want to teach, guide, and share my expertise' },
];

export default function Register() {
  const navigate = useNavigate();
  const { loginUser } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'Learner', bio: '' });
  const [skillsOffered, setSkillsOffered] = useState([]);
  const [skillsWanted, setSkillsWanted] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const selectRole = (role) => setForm({ ...form, role });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Fix 5: Clear warning if no skill at all
    if (!skillsOffered.length && !skillsWanted.length) {
      setError('Please add at least one skill — either a skill you can offer or a skill you want to learn.');
      return;
    }
    // Fix 6: Role-based skill validation
    if (form.role === 'Mentor' && !skillsOffered.length) {
      setError('As a Mentor, you must add at least one skill you can offer/teach.');
      return;
    }
    if (form.role === 'Learner' && !skillsWanted.length) {
      setError('As a Learner, you must add at least one skill you want to learn.');
      return;
    }

    setLoading(true);
    try {
      const res = await register({ ...form, skillsOffered, skillsWanted });
      const { token, ...userData } = res.data;
      loginUser(userData, token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally { setLoading(false); }
  };

  const stepStyle = { width: 24, height: 24, borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent), var(--accent-2))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'white', flexShrink: 0 };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', justifyContent: 'center', padding: '40px 24px', transition: 'background 0.3s', overflowY: 'auto' }}>
      <div style={{ width: '100%', maxWidth: 720 }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ display: 'inline-flex', marginBottom: 20 }}><SkillLinkLogo size={42} showText={true} textSize="2xl" /></div>
          <h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 30, fontWeight: 700, color: 'var(--text-white)', marginBottom: 6 }}>Create your account</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Join the community and start learning from peers</p>
        </div>

        {error && <div style={{ marginBottom: 20, padding: '14px 16px', borderRadius: 12, background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.25)', color: '#f87171', fontSize: 14 }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          {/* Step 1 */}
          <div className="card" style={{ padding: 28, marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <div style={stepStyle}>1</div>
              <span className="section-title" style={{ fontSize: 15 }}>Basic Information</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div><label className="label">Full Name</label><input name="name" required value={form.name} onChange={handleChange} placeholder="Jane Doe" className="input" /></div>
              <div><label className="label">Email Address</label><input name="email" type="email" required value={form.email} onChange={handleChange} placeholder="jane@example.com" className="input" /></div>
            </div>
            <div style={{ marginBottom: 16 }}><label className="label">Password</label><input name="password" type="password" required minLength={6} value={form.password} onChange={handleChange} placeholder="Minimum 6 characters" className="input" /></div>
            <div><label className="label">Bio <span style={{ color: 'var(--text-faint)' }}>(optional)</span></label><textarea name="bio" value={form.bio} onChange={handleChange} rows={2} placeholder="Tell the community about yourself..." className="input" style={{ resize: 'none' }} /></div>
          </div>

          {/* Step 2 — Role cards (no hardcoded colors) */}
          <div className="card" style={{ padding: 28, marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <div style={stepStyle}>2</div>
              <span className="section-title" style={{ fontSize: 15 }}>Choose Your Role</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {ROLES.map((r) => {
                const isSelected = form.role === r.value;
                return (
                  <button key={r.value} type="button" onClick={() => selectRole(r.value)} style={{
                    padding: '18px 20px', borderRadius: 14, textAlign: 'left', cursor: 'pointer',
                    border: isSelected ? '2px solid var(--accent)' : '2px solid var(--border)',
                    background: isSelected ? 'var(--bg-elevated)' : 'var(--bg-surface-2)',
                    transition: 'all 0.2s',
                    boxShadow: isSelected ? '0 4px 20px rgba(79,70,229,0.15)' : 'none',
                  }}>
                    <div style={{ fontSize: 28, marginBottom: 10 }}>{r.icon}</div>
                    <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 16, color: isSelected ? 'var(--accent-text)' : 'var(--text-secondary)', marginBottom: 6 }}>{r.title}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>{r.desc}</div>
                    {isSelected && <div style={{ marginTop: 10, fontSize: 11, color: 'var(--accent-text)', fontFamily: 'JetBrains Mono' }}>✓ Selected</div>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 3 */}
          <div className="card" style={{ padding: 28, marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <div style={stepStyle}>3</div>
              <span className="section-title" style={{ fontSize: 15 }}>Your Skill Portfolio</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
              <SkillInput label="Skills I Can Offer / Teach" skills={skillsOffered} onChange={setSkillsOffered} variant="emerald" placeholder="e.g. Python, React, Machine Learning..." />
              <SkillInput label="Skills I Want to Learn" skills={skillsWanted} onChange={setSkillsWanted} variant="cyan" placeholder="e.g. TypeScript, Docker, System Design..." />
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', padding: 15, fontSize: 15 }}>
            {loading ? 'Creating account...' : 'Create Account & Join SkillLink →'}
          </button>
        </form>

        <p style={{ marginTop: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--accent-text)', fontWeight: 600, textDecoration: 'none' }}>Sign in →</Link>
        </p>
      </div>
    </div>
  );
}
