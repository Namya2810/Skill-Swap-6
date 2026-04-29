import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { login } from '../api';
import { useAuth } from '../context/AuthContext';
import SkillLinkLogo from '../components/SkillLinkLogo';

export default function Login() {
  const navigate = useNavigate();
  const { loginUser } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await login(form);
      const { token, ...userData } = res.data;
      loginUser(userData, token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally { setLoading(false); }
  };

  const orbStyle = (color1, color2, top, left, size, duration) => ({
    position: 'absolute', borderRadius: '50%', pointerEvents: 'none',
    width: size, height: size, top, left,
    background: `radial-gradient(circle, ${color1}, ${color2})`,
    filter: 'blur(72px)',
    animation: `orbDrift ${duration}s ease-in-out infinite alternate`,
    opacity: 0.45,
  });

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--bg-base)', transition: 'background 0.3s', position: 'relative', overflow: 'hidden' }}>

      {/* Entrance animation */}
      <style>{`
        @keyframes orbDrift {
          0%   { transform: translate(0, 0) scale(1); }
          100% { transform: translate(30px, 20px) scale(1.08); }
        }
        @keyframes orbDrift2 {
          0%   { transform: translate(0, 0) scale(1.05); }
          100% { transform: translate(-25px, 15px) scale(1); }
        }
        @keyframes orbDrift3 {
          0%   { transform: translate(0, 0) scale(1); }
          100% { transform: translate(20px, -25px) scale(1.06); }
        }
        html.light .login-orb { opacity: 0.28 !important; }
        @keyframes loginSlideIn {
          from { opacity: 0; transform: translateX(60px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes loginLeftIn {
          from { opacity: 0; transform: translateX(-40px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .login-left-panel  { animation: loginLeftIn  0.55s cubic-bezier(0.22,1,0.36,1) forwards; }
        .login-right-panel { animation: loginSlideIn 0.55s cubic-bezier(0.22,1,0.36,1) forwards; }
      `}</style>
      <div className="login-orb" style={{ ...orbStyle('#3b82f6','#818cf800','8%','5%','420px','22'), animationName:'orbDrift' }} />
      <div className="login-orb" style={{ ...orbStyle('#8b5cf6','#818cf800','60%','75%','380px','28'), animationName:'orbDrift2' }} />
      <div className="login-orb" style={{ ...orbStyle('#06b6d4','#818cf800','75%','10%','300px','19'), animationName:'orbDrift3' }} />
      <div className="login-orb" style={{ ...orbStyle('#10b981','#818cf800','30%','85%','260px','25'), animationName:'orbDrift2' }} />
      <div className="login-orb" style={{ ...orbStyle('#4f46e5','#818cf800','-5%','60%','350px','25'), animationName:'orbDrift' }} />

      {/* Left panel */}
      <div className="login-left-panel" style={{
        width: '50%', position: 'relative', zIndex: 1,
        background: 'var(--bg-surface)',
        borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        padding: 48,
      }}>
        <SkillLinkLogo size={44} showText={true} textSize="2xl" />
        <div>
          <div style={{ marginBottom: 32, opacity: 0.3 }}>
            <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
              <circle cx="40" cy="40" r="39" stroke="var(--accent)" strokeWidth="1"/>
              <circle cx="40" cy="14" r="5" fill="var(--accent)"/>
              <circle cx="62" cy="54" r="5" fill="var(--accent-2)"/>
              <circle cx="18" cy="54" r="5" fill="var(--accent)"/>
              <circle cx="40" cy="40" r="8" fill="var(--accent-2)" fillOpacity="0.5" stroke="var(--accent-text)" strokeWidth="1.5"/>
              <line x1="40" y1="14" x2="40" y2="40" stroke="var(--accent)" strokeWidth="1.5"/>
              <line x1="62" y1="54" x2="40" y2="40" stroke="var(--accent)" strokeWidth="1.5"/>
              <line x1="18" y1="54" x2="40" y2="40" stroke="var(--accent)" strokeWidth="1.5"/>
            </svg>
          </div>
          <h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 46, fontWeight: 800, lineHeight: 1.1, marginBottom: 16, color: 'var(--text-white)' }}>
            Learn together,<br />
            <span className="text-gradient">grow faster.</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 16, lineHeight: 1.7, maxWidth: 380 }}>
            Connect with peers who complement your skills. Community-powered mentorship built on real expertise.
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          {[{ icon: '⇌', label: 'Peer Mentorship' }, { icon: '⟡', label: 'Skill Matching' }, { icon: '⬡', label: 'Community Groups' }].map((item) => (
            <div key={item.label} style={{
              padding: '14px', borderRadius: 12, textAlign: 'center',
              background: 'var(--bg-elevated)', border: '1px solid var(--border)',
              fontSize: 11, fontFamily: 'JetBrains Mono', color: 'var(--text-secondary)',
              transition: 'all 0.2s', cursor: 'default',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-hover)'; e.currentTarget.style.background = 'var(--bg-hover)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg-elevated)'; }}
            >
              <div style={{ fontSize: 18, marginBottom: 6 }}>{item.icon}</div>
              {item.label}
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="login-right-panel" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 48, position: 'relative', zIndex: 1 }}>
        <div style={{ width: '100%', maxWidth: 400 }}>
          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 30, fontWeight: 800, color: 'var(--text-white)', marginBottom: 8, letterSpacing: '-0.02em' }}>Welcome back</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>Sign in to your SkillLink account</p>
          </div>

          {error && (
            <div style={{ marginBottom: 20, padding: '14px 16px', borderRadius: 12, background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.25)', color: '#f87171', fontSize: 14 }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <label className="label" style={{ fontWeight: 600 }}>Email address</label>
              <input name="email" type="email" required value={form.email} onChange={handleChange} placeholder="you@example.com" className="input" />
            </div>
            <div>
              <label className="label" style={{ fontWeight: 600 }}>Password</label>
              <input name="password" type="password" required value={form.password} onChange={handleChange} placeholder="••••••••" className="input" />
            </div>
            <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', padding: 14, fontSize: 15, marginTop: 4, borderRadius: 12 }}>
              {loading ? 'Signing in...' : 'Sign In →'}
            </button>
          </form>

          <p style={{ marginTop: 28, textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: 'var(--accent-text)', fontWeight: 700, textDecoration: 'none' }}>Create one →</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
