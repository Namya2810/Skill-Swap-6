import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import SkillLinkLogo from '../components/SkillLinkLogo';

const FEATURES = [
  { icon: '⇌', title: 'Peer Mentorship',  desc: 'Exchange skills directly with people who need what you know — and know what you need.' },
  { icon: '⟡', title: 'Smart Matching',   desc: 'Our algorithm finds your ideal peers using skill overlap, community fit, and role balance.' },
  { icon: '⬡', title: 'Community Groups', desc: 'Join topic-based communities, share resources, ask questions, celebrate achievements.' },
  { icon: '◈', title: 'Session Booking',  desc: 'Request structured learning sessions and track your progress over time.' },
];

const STATS = [
  { value: '500+', label: 'Skills in dataset' },
  { value: '87%',  label: 'Match accuracy' },
  { value: '∞',    label: 'Connections possible' },
];

const ORBIT_SKILLS = [
  { label: '🐍 Python',    angle: 0,   radius: 210, dur: 18, color: '#3b82f6' },
  { label: '⚛️ React',     angle: 60,  radius: 225, dur: 22, color: '#06b6d4' },
  { label: '🤖 ML',        angle: 120, radius: 215, dur: 15, color: '#8b5cf6' },
  { label: '🗄️ MongoDB',   angle: 180, radius: 220, dur: 20, color: '#10b981' },
  { label: '🎯 PyTorch',   angle: 240, radius: 210, dur: 17, color: '#f59e0b' },
  { label: '☁️ Cloud',     angle: 300, radius: 230, dur: 25, color: '#6366f1' },
];

// Testimonials replacing the live matching engine
const TESTIMONIALS = [
  { name: 'Pranav S.', role: 'Mentor', text: 'Found my learning partner in 2 days. Taught React, learned ML. Best swap ever.', avatar: 'P', color: '#8b5cf6' },
  { name: 'Riya K.',   role: 'Learner', text: 'The community placement algo is scary good — it knew exactly where I belonged.', avatar: 'R', color: '#06b6d4' },
  { name: 'Arjun M.',  role: 'Mentor', text: 'Zero fluff. Real skill exchange. I levelled up my Node.js while teaching Cloud basics.', avatar: 'A', color: '#f59e0b' },
  { name: 'Namya J.',  role: 'Learner', text: 'Booked my first session in 10 minutes. The matching actually makes sense unlike other platforms.', avatar: 'N', color: '#3b82f6' },
];

export default function Landing() {
  const navigate = useNavigate();
  const [exiting, setExiting] = useState(false);
  const [particleAngle, setParticleAngle] = useState(0);
  const [testimonialIdx, setTestimonialIdx] = useState(0);
  const rafRef = useRef(null);
  const lastRef = useRef(null);
  const testimTimer = useRef(null);

  useEffect(() => {
    let angle = 0;
    const animate = (ts) => {
      if (lastRef.current != null) {
        const dt = ts - lastRef.current;
        angle = (angle + dt * 0.012) % 360;
        setParticleAngle(angle);
      }
      lastRef.current = ts;
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  useEffect(() => {
    testimTimer.current = setInterval(() => setTestimonialIdx(i => (i + 1) % TESTIMONIALS.length), 3500);
    return () => clearInterval(testimTimer.current);
  }, []);

  const go = (path) => { setExiting(true); setTimeout(() => navigate(path), 440); };

  const polar = (cx, cy, r, deg) => {
    const rad = (deg - 90) * Math.PI / 180;
    return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
  };

  const CX = 300, CY = 300;
  const NODE_ANGLES = [0, 52, 115, 180, 240, 305];
  const NODE_R = 138;
  const nodes = NODE_ANGLES.map((a, i) => {
    const [x, y] = polar(CX, CY, NODE_R, a);
    return { x, y, label: ['N','M','H','P','R','A'][i], color: ['#3b82f6','#6366f1','#3b82f6','#8b5cf6','#06b6d4','#6366f1'][i] };
  });

  const t = TESTIMONIALS[testimonialIdx];

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', flexDirection: 'column',
      position: 'relative', overflowX: 'hidden', overflowY: 'auto', transition: 'background 0.3s',
    }}>
      <style>{`
        @keyframes orbDrift  { 0%{transform:translate(0,0) scale(1)} 100%{transform:translate(30px,20px) scale(1.08)} }
        @keyframes orbDrift2 { 0%{transform:translate(0,0) scale(1.05)} 100%{transform:translate(-25px,15px) scale(1)} }
        @keyframes orbDrift3 { 0%{transform:translate(0,0) scale(1)} 100%{transform:translate(20px,-25px) scale(1.06)} }
        @keyframes fadeUp  { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn  { from{opacity:0} to{opacity:1} }
        @keyframes exitLeft { from{opacity:1;transform:translateX(0)} to{opacity:0;transform:translateX(-60px)} }
        @keyframes netPulse { 0%,100%{opacity:0.45} 50%{opacity:1} }
        @keyframes hubGlow  { 0%,100%{filter:drop-shadow(0 0 8px #3b82f688)} 50%{filter:drop-shadow(0 0 20px #3b82f6cc)} }
        @keyframes testimSlide { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes scanLine { 0%{transform:translateY(-100%)} 100%{transform:translateY(400%)} }
        .l-in1 { animation: fadeUp 0.7s cubic-bezier(.22,1,.36,1) both; }
        .l-in2 { animation: fadeUp 0.7s cubic-bezier(.22,1,.36,1) 0.12s both; }
        .l-in3 { animation: fadeUp 0.7s cubic-bezier(.22,1,.36,1) 0.22s both; }
        .l-in4 { animation: fadeUp 0.7s cubic-bezier(.22,1,.36,1) 0.32s both; }
        .l-in5 { animation: fadeUp 0.7s cubic-bezier(.22,1,.36,1) 0.42s both; }
        .l-vis  { animation: fadeIn  0.9s ease 0.3s both; }
        .l-exit { animation: exitLeft 0.44s cubic-bezier(.55,0,1,.45) forwards !important; }
        .feat-card { padding:18px; border-radius:14px; background:var(--bg-elevated); border:1px solid var(--border); transition:all 0.25s; }
        .feat-card:hover { border-color:var(--border-hover); transform:translateY(-3px); box-shadow:0 10px 28px rgba(0,0,0,0.18); }
        .cta-p { padding:13px 30px; border-radius:12px; background:linear-gradient(135deg,var(--accent),var(--accent-2)); color:white; border:none; cursor:pointer; font-family:'Outfit',sans-serif; font-weight:700; font-size:15px; transition:all 0.2s; box-shadow:0 4px 20px rgba(59,130,246,0.3); }
        .cta-p:hover { transform:translateY(-2px); box-shadow:0 8px 28px rgba(59,130,246,0.45); }
        .cta-s { padding:13px 24px; border-radius:12px; background:var(--bg-elevated); color:var(--text-secondary); border:1px solid var(--border); cursor:pointer; font-family:'Outfit',sans-serif; font-weight:600; font-size:15px; transition:all 0.2s; }
        .cta-s:hover { border-color:var(--border-hover); color:var(--text-white); transform:translateY(-2px); }
        html.light .l-orb { opacity: 0.15 !important; }
        html.light .l-nav { background:rgba(255,255,255,0.95) !important; border-bottom:1px solid #dde5f2 !important; }
        html.light .feat-card { background:#f2f4f9 !important; }
        .pill-orbit { pointer-events:none; position:absolute; padding:5px 13px; border-radius:99px; font-size:11.5px; font-family:'JetBrains Mono',monospace; white-space:nowrap; backdrop-filter:blur(6px); }
        .hub-glow { animation: hubGlow 3s ease-in-out infinite; }
        .stat-card { padding:20px 24px; border-radius:16px; background:var(--bg-elevated); border:1px solid var(--border); transition:all 0.25s; }
        .stat-card:hover { border-color:var(--border-hover); transform:translateY(-2px); }
      `}</style>

      {/* BG orbs */}
      <div className="l-orb" style={{ position:'absolute', borderRadius:'50%', pointerEvents:'none', width:450, height:450, top:'5%', left:'3%', background:'radial-gradient(circle,#3b82f6,transparent)', filter:'blur(80px)', opacity:0.38, animation:'orbDrift 22s ease-in-out infinite alternate' }} />
      <div className="l-orb" style={{ position:'absolute', borderRadius:'50%', pointerEvents:'none', width:400, height:400, bottom:'10%', right:'5%', background:'radial-gradient(circle,#8b5cf6,transparent)', filter:'blur(80px)', opacity:0.32, animation:'orbDrift2 28s ease-in-out infinite alternate' }} />
      <div className="l-orb" style={{ position:'absolute', borderRadius:'50%', pointerEvents:'none', width:320, height:320, bottom:'30%', left:'5%', background:'radial-gradient(circle,#06b6d4,transparent)', filter:'blur:80px', opacity:0.28, animation:'orbDrift3 19s ease-in-out infinite alternate' }} />

      {/* ── Nav: logo left, CTA right, NO separate top bar ── */}
      <nav className="l-nav" style={{
        padding:'0 48px', height:64, display:'flex', alignItems:'center', justifyContent:'space-between',
        position:'sticky', top:0, zIndex:20, borderBottom:'1px solid var(--border)',
        background:'rgba(8,14,28,0.88)', backdropFilter:'blur(14px)', flexShrink:0,
      }}>
        <SkillLinkLogo size={36} showText={true} textSize="xl" />
        <div style={{ display:'flex', gap:10, alignItems:'center' }}>
          <button onClick={() => go('/login')}    className="cta-s" style={{ padding:'8px 20px', fontSize:14 }}>Sign In</button>
          <button onClick={() => go('/register')} className="cta-p" style={{ padding:'8px 20px', fontSize:14 }}>Get Started →</button>
        </div>
      </nav>

      {/* ── Hero: two-column ── */}
      <div className={exiting ? 'l-exit' : ''} style={{
        flex:1, display:'grid', gridTemplateColumns:'1fr 1fr', position:'relative', zIndex:1,
      }}>

        {/* LEFT */}
        <div style={{ padding:'56px 48px 56px 52px', display:'flex', flexDirection:'column', justifyContent:'flex-start', gap:24, borderRight:'1px solid var(--border)' }}>

          {/* Badge */}
          <div className="l-in1">
            <div style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'6px 14px', borderRadius:99, background:'rgba(59,130,246,0.1)', border:'1px solid rgba(59,130,246,0.2)', fontSize:12, fontFamily:'JetBrains Mono', color:'var(--accent-text)', marginBottom:20 }}>
              ✦ Peer-to-peer skill exchange platform
            </div>
            <h1 style={{ fontFamily:'Outfit,sans-serif', fontSize:52, fontWeight:800, lineHeight:1.08, letterSpacing:'-0.03em', color:'var(--text-white)', marginBottom:18 }}>
              Learn together,<br /><span className="text-gradient">grow faster.</span>
            </h1>
          </div>

          <div className="l-in2">
            <p style={{ color:'var(--text-secondary)', fontSize:16, lineHeight:1.75, maxWidth:440 }}>
              Connect with peers who complement your skills. Teach what you know, learn what you need — powered by smart matching and real community.
            </p>
          </div>

          <div className="l-in3" style={{ display:'flex', alignItems:'center', gap:16, flexWrap:'wrap' }}>
            <button onClick={() => go('/register')} className="cta-p">Start Learning Free →</button>
            <span style={{ fontSize:13, color:'var(--text-muted)', fontFamily:'JetBrains Mono' }}>
              Already a member?{' '}
              <button onClick={() => go('/login')} style={{ background:'none', border:'none', padding:0, color:'var(--accent-text)', cursor:'pointer', fontSize:13, fontFamily:'JetBrains Mono', textDecoration:'underline', textUnderlineOffset:3 }}>
                Sign in →
              </button>
            </span>
          </div>

          {/* Stats row */}
          <div className="l-in4" style={{ display:'flex', gap:28, paddingTop:20, borderTop:'1px solid var(--border)' }}>
            {STATS.map(s => (
              <div key={s.label}>
                <div style={{ fontFamily:'Outfit', fontSize:26, fontWeight:800, color:'var(--text-white)', letterSpacing:'-0.02em', lineHeight:1, marginBottom:4 }}>{s.value}</div>
                <div style={{ fontSize:11, fontFamily:'JetBrains Mono', color:'var(--text-muted)' }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Feature cards */}
          <div className="l-in5" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            {FEATURES.map(f => (
              <div key={f.title} className="feat-card">
                <div style={{ fontSize:20, marginBottom:7 }}>{f.icon}</div>
                <div style={{ fontFamily:'Outfit', fontWeight:700, fontSize:13, color:'var(--text-white)', marginBottom:5 }}>{f.title}</div>
                <div style={{ fontSize:11, color:'var(--text-muted)', lineHeight:1.6 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT — bigger animation + testimonials */}
        <div className="l-vis" style={{ position:'relative', overflow:'hidden', background:'radial-gradient(ellipse at 60% 40%, rgba(59,130,246,0.06) 0%, transparent 70%)', display:'flex', flexDirection:'column', minHeight:700 }}>

          {/* Scanline overlay */}
          <div style={{ position:'absolute', inset:0, pointerEvents:'none', zIndex:2, overflow:'hidden', opacity:0.04 }}>
            <div style={{ position:'absolute', width:'100%', height:120, background:'linear-gradient(to bottom, transparent, rgba(255,255,255,0.8), transparent)', animation:'scanLine 6s linear infinite' }} />
          </div>

          {/* Grid dot pattern */}
          <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', opacity:0.035 }} xmlns="http://www.w3.org/2000/svg">
            <defs><pattern id="grid" width="28" height="28" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill="#60a5fa"/></pattern></defs>
            <rect width="100%" height="100%" fill="url(#grid)"/>
          </svg>

          {/* ── Central network SVG — BIGGER ── */}
          <div style={{ position:'absolute', top:'46%', left:'50%', transform:'translate(-50%,-52%)', width:600, height:600 }}>
            <svg width="600" height="600" viewBox="0 0 600 600" style={{ overflow:'visible' }}>
              <defs>
                <radialGradient id="cg2"><stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2"/><stop offset="100%" stopColor="#3b82f6" stopOpacity="0"/></radialGradient>
                <linearGradient id="lg1b" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8"/><stop offset="100%" stopColor="#6366f1" stopOpacity="0.8"/></linearGradient>
                <linearGradient id="lg2b" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#06b6d4" stopOpacity="0.6"/><stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.6"/></linearGradient>
                <filter id="glow1b"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
                <filter id="glow2b"><feGaussianBlur stdDeviation="8" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
              </defs>

              <circle cx={CX} cy={CY} r="155" fill="url(#cg2)" />
              <circle cx={CX} cy={CY} r="138" stroke="#3b82f6" strokeWidth="0.7" strokeOpacity="0.18" fill="none" strokeDasharray="5 9"/>
              <circle cx={CX} cy={CY} r="95"  stroke="#6366f1" strokeWidth="0.5" strokeOpacity="0.12" fill="none" strokeDasharray="3 8"/>

              {nodes.map((n, i) => (
                <line key={i} x1={CX} y1={CY} x2={n.x} y2={n.y}
                  stroke="url(#lg1b)" strokeWidth="1.8"
                  style={{ animation: `netPulse 3s ease-in-out ${i * 0.45}s infinite`, opacity: 0.7 }}/>
              ))}
              {nodes.map((n, i) => {
                const next = nodes[(i + 1) % nodes.length];
                return <line key={i} x1={n.x} y1={n.y} x2={next.x} y2={next.y} stroke="#818cf8" strokeWidth="0.9" strokeOpacity="0.18"/>;
              })}

              {nodes.map((n, i) => (
                <circle key={i} r="3.5" fill={n.color} opacity="0.9" filter="url(#glow1b)">
                  <animateMotion dur={`${2.5 + i * 0.4}s`} repeatCount="indefinite" begin={`${i * 0.5}s`}>
                    <mpath href={`#pathb${i}`}/>
                  </animateMotion>
                </circle>
              ))}
              {nodes.map((n, i) => (
                <path key={i} id={`pathb${i}`} d={`M ${CX} ${CY} L ${n.x} ${n.y}`} fill="none"/>
              ))}

              {nodes.map((n, i) => (
                <g key={n.label} className="hub-glow" style={{ animationDelay: `${i * 0.35}s` }}>
                  <circle cx={n.x} cy={n.y} r="31" fill={n.color} fillOpacity="0.08" stroke={n.color} strokeWidth="1" strokeOpacity="0.3"/>
                  <circle cx={n.x} cy={n.y} r="24" fill="var(--bg-elevated)" stroke={n.color} strokeWidth="2" filter="url(#glow1b)"/>
                  <circle cx={n.x} cy={n.y} r="19" fill="var(--bg-surface)"/>
                  <text x={n.x} y={n.y + 6} textAnchor="middle" style={{ fill:n.color, fontSize:15, fontWeight:700, fontFamily:'Outfit,sans-serif' }}>{n.label}</text>
                  <circle cx={n.x} cy={n.y} r="28" fill="none" stroke={n.color} strokeWidth="1.5" strokeOpacity="0.5">
                    <animate attributeName="r" values="24;36;24" dur={`${2 + i * 0.3}s`} repeatCount="indefinite"/>
                    <animate attributeName="stroke-opacity" values="0.5;0;0.5" dur={`${2 + i * 0.3}s`} repeatCount="indefinite"/>
                  </circle>
                </g>
              ))}

              <g className="hub-glow">
                <circle cx={CX} cy={CY} r="54" fill="var(--bg-elevated)" stroke="url(#lg1b)" strokeWidth="2.5" filter="url(#glow2b)"/>
                <circle cx={CX} cy={CY} r="45" fill="var(--bg-surface)"/>
                <circle cx={CX} cy={CY} r="38" fill="none" stroke="url(#lg2b)" strokeWidth="1" strokeOpacity="0.5" strokeDasharray="3 5"/>
                <text x={CX} y={CY - 5} textAnchor="middle" style={{ fill:'#3b82f6', fontSize:13, fontFamily:'JetBrains Mono', fontWeight:700 }}>SKILL</text>
                <text x={CX} y={CY + 13} textAnchor="middle" style={{ fill:'#6366f1', fontSize:13, fontFamily:'JetBrains Mono', fontWeight:700 }}>LINK</text>
              </g>
            </svg>

            {/* Orbiting pills */}
            {ORBIT_SKILLS.map((pill, i) => {
              const angle = ((pill.angle + particleAngle) % 360);
              const rad = (angle - 90) * Math.PI / 180;
              const r = pill.radius * 0.64;
              const x = 300 + r * Math.cos(rad);
              const y = 300 + r * Math.sin(rad);
              return (
                <div key={pill.label} className="pill-orbit" style={{
                  left: x, top: y,
                  transform: 'translate(-50%,-50%)',
                  background: `${pill.color}18`,
                  border: `1px solid ${pill.color}55`,
                  color: pill.color,
                  zIndex: 3,
                }}>
                  {pill.label}
                </div>
              );
            })}
          </div>

          {/* ── Testimonials panel — replaces Live Matching Engine ── */}
          <div style={{ position:'absolute', bottom:0, left:0, right:0, padding:'0 32px 28px', zIndex:4 }}>
            <div style={{ borderRadius:16, background:'var(--bg-elevated)', border:'1px solid var(--border)', backdropFilter:'blur(12px)', overflow:'hidden', boxShadow:'0 8px 32px rgba(0,0,0,0.25)' }}>
              {/* Header */}
              <div style={{ padding:'10px 18px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between', background:'rgba(99,102,241,0.06)' }}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ fontSize:14 }}>💬</span>
                  <span style={{ fontSize:12, fontFamily:'JetBrains Mono', color:'var(--accent-text)' }}>What people are saying</span>
                </div>
                {/* Dot indicators */}
                <div style={{ display:'flex', gap:5 }}>
                  {TESTIMONIALS.map((_, i) => (
                    <div key={i} onClick={() => setTestimonialIdx(i)} style={{ width: i === testimonialIdx ? 18 : 6, height:6, borderRadius:99, background: i === testimonialIdx ? t.color : 'var(--border)', transition:'all 0.3s', cursor:'pointer' }} />
                  ))}
                </div>
              </div>

              {/* Testimonial */}
              <div key={testimonialIdx} style={{ padding:'16px 18px', display:'flex', alignItems:'flex-start', gap:14, animation:'testimSlide 0.4s ease both' }}>
                <div style={{ width:42, height:42, borderRadius:12, background:`linear-gradient(135deg,${t.color},${t.color}88)`, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Outfit', fontWeight:700, color:'white', fontSize:17, flexShrink:0, boxShadow:`0 4px 12px ${t.color}44` }}>
                  {t.avatar}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                    <span style={{ fontWeight:700, fontSize:14, color:'var(--text-white)' }}>{t.name}</span>
                    <span style={{ fontSize:11, fontFamily:'JetBrains Mono', padding:'2px 8px', borderRadius:99, background:`${t.color}18`, border:`1px solid ${t.color}40`, color:t.color }}>{t.role}</span>
                  </div>
                  <p style={{ fontSize:13, color:'var(--text-secondary)', lineHeight:1.65, margin:0, fontStyle:'italic' }}>"{t.text}"</p>
                </div>
              </div>

              {/* Step flow */}
              <div style={{ padding:'10px 18px', borderTop:'1px solid var(--border)', display:'flex', gap:0 }}>
                {[{step:'01',text:'Add Skills'},{step:'02',text:'Get Matched'},{step:'03',text:'Book Session'}].map((item,i) => (
                  <div key={item.step} style={{ display:'flex', alignItems:'center', flex:1 }}>
                    <div style={{ flex:1 }}>
                      <div style={{ fontFamily:'JetBrains Mono', fontSize:9, color:'var(--accent-text)', marginBottom:1 }}>{item.step}</div>
                      <div style={{ fontFamily:'Outfit', fontSize:12, fontWeight:600, color:'var(--text-white)' }}>{item.text}</div>
                    </div>
                    {i < 2 && <div style={{ fontSize:12, color:'var(--text-faint)', marginRight:6 }}>→</div>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
