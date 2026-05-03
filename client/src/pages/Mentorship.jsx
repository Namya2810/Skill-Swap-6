import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getMentorshipRequests, respondToRequest,
  getSessions, respondToSession, completeSession, requestSession,
} from '../api';
import Layout from '../components/Layout';
import SkillTag from '../components/SkillTag';

/* ── In-App Toast (replaces all alert() calls) ───────────────────── */
function Toast({ message, type = 'error', onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  const colors = {
    error:   { bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.3)',   text: '#f87171',  icon: '⚠' },
    success: { bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)',  text: '#34d399',  icon: '✓' },
    info:    { bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.3)',  text: '#60a5fa',  icon: 'ℹ' },
  };
  const c = colors[type] || colors.error;

  return (
    <div style={{
      position: 'fixed', top: 24, right: 24, zIndex: 9999,
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '12px 18px', borderRadius: 12,
      background: c.bg, border: `1px solid ${c.border}`,
      color: c.text, fontSize: 14, fontFamily: 'JetBrains Mono',
      boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      animation: 'slideIn 0.2s ease',
      maxWidth: 360,
    }}>
      <span style={{ fontSize: 16 }}>{c.icon}</span>
      <span style={{ flex: 1 }}>{message}</span>
      <button onClick={onClose} style={{ background: 'none', border: 'none', color: c.text, cursor: 'pointer', fontSize: 16, padding: 0, opacity: 0.7 }}>✕</button>
    </div>
  );
}

/* ── Status Pill ─────────────────────────────────────────────────── */
function StatusPill({ status }) {
  const map = {
    Pending:   { bg: 'rgba(245,158,11,0.12)',  color: '#f59e0b', border: 'rgba(245,158,11,0.3)',   icon: '⏳' },
    Accepted:  { bg: 'rgba(16,185,129,0.12)',  color: '#10b981', border: 'rgba(16,185,129,0.3)',   icon: '✓' },
    Rejected:  { bg: 'rgba(239,68,68,0.10)',   color: '#ef4444', border: 'rgba(239,68,68,0.25)',   icon: '✕' },
    Completed: { bg: 'rgba(139,92,246,0.12)',  color: '#a78bfa', border: 'rgba(139,92,246,0.3)',   icon: '★' },
    Cancelled: { bg: 'rgba(100,116,139,0.12)', color: '#94a3b8', border: 'rgba(100,116,139,0.25)', icon: '—' },
    Expired:   { bg: 'rgba(239,68,68,0.08)',   color: '#f87171', border: 'rgba(239,68,68,0.22)',   icon: '⌛' },
  };
  const s = map[status] || map.Pending;
  return (
    <span style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}`, padding: '5px 12px', borderRadius: 99, fontSize: 12, fontFamily: 'JetBrains Mono', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
      {s.icon} {status}
    </span>
  );
}

/* ── Mentorship Request Card ─────────────────────────────────────── */
function RequestCard({ req, isReceived, onRespond, onSchedule }) {
  const [responding, setResponding] = useState(false);
  const other = isReceived ? req.sender : req.receiver;
  const handle = async (status) => { setResponding(true); await onRespond(req._id, status); setResponding(false); };

  return (
    <div className="card" style={{ padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
        <div style={{ width: 42, height: 42, borderRadius: 12, background: 'linear-gradient(135deg, var(--accent), var(--accent-2))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Outfit', fontWeight: 700, color: 'white', fontSize: 17, flexShrink: 0 }}>
          {other?.name?.charAt(0).toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 600, color: 'var(--text-white)', fontSize: 15 }}>{other?.name}</span>
            <StatusPill status={req.status} />
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono', marginBottom: req.message ? 10 : 0 }}>{other?.email}</div>
          {req.message && (
            <div style={{ padding: '10px 14px', borderRadius: 10, background: 'var(--bg-elevated)', border: '1px solid var(--border)', fontSize: 13, color: 'var(--text-secondary)', fontStyle: 'italic', marginBottom: 10 }}>
              "{req.message}"
            </div>
          )}
          {other?.skillsOffered?.length > 0 && (
            <div>
              <div style={{ fontSize: 10, fontFamily: 'JetBrains Mono', color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Their Skills</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>{other.skillsOffered.slice(0, 5).map(s => <SkillTag key={s} skill={s} variant="emerald" />)}</div>
            </div>
          )}
          {req.status === 'Accepted' && other?._id && (
            <button
              onClick={() => onSchedule(other)}
              className="btn-primary"
              style={{ fontSize: 12, padding: '8px 16px', marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              📅 Schedule Session →
            </button>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10, flexShrink: 0 }}>
          <div style={{ fontSize: 11, fontFamily: 'JetBrains Mono', color: 'var(--text-muted)' }}>
            {new Date(req.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </div>
          {isReceived && req.status === 'Pending' && (
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => handle('Rejected')} disabled={responding} className="btn-danger" style={{ fontSize: 13, padding: '8px 14px' }}>Decline</button>
              <button onClick={() => handle('Accepted')} disabled={responding} className="btn-success" style={{ fontSize: 13, padding: '8px 14px' }}>{responding ? '...' : 'Accept ✓'}</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Session Booking Modal ───────────────────────────────────────── */
function SessionModal({ peer, onClose, onSubmit }) {
  const skills = (peer?.skillsOffered || []).map(s => typeof s === 'string' ? s : s?.name).filter(Boolean);
  const [form, setForm] = useState({ topic: skills[0] || '', date: '', hour: '10', minute: '00', ampm: 'AM', note: '' });
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const build24hrTime = () => {
    let h = parseInt(form.hour, 10);
    const m = form.minute.padStart(2, '0');
    if (form.ampm === 'AM') { if (h === 12) h = 0; }
    else { if (h !== 12) h += 12; }
    return `${String(h).padStart(2, '0')}:${m}`;
  };

  // Today's date string in YYYY-MM-DD (local time, not UTC)
  const todayStr = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  })();

  const handleSubmit = async () => {
    setError('');
    if (!form.topic) { setError('Please select a topic.'); return; }
    if (!form.date)  { setError('Please pick a date.'); return; }

    // Block past dates even if typed manually
    if (form.date < todayStr) {
      setError('Please select today or a future date.');
      return;
    }

    // If today, make sure selected time is still in the future
    if (form.date === todayStr) {
      const time24 = build24hrTime();
      const [hh, mm] = time24.split(':').map(Number);
      const now = new Date();
      const selected = new Date();
      selected.setHours(hh, mm, 0, 0);
      if (selected <= now) {
        setError('The selected time has already passed. Please pick a future time.');
        return;
      }
    }

    const time24 = build24hrTime();
    setSending(true);
    await onSubmit({ topic: form.topic, date: form.date, time: time24, note: form.note });
    setSending(false);
  };

  const hourOptions   = ['12','1','2','3','4','5','6','7','8','9','10','11'];
  const minuteOptions = ['00','15','30','45'];

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
      <div className="card" style={{ width: '100%', maxWidth: 440, padding: 30, boxShadow: '0 24px 64px rgba(0,0,0,0.5)', border: '1px solid var(--border-hover)' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <div style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: 20, color: 'var(--text-white)' }}>Schedule a Session</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono', marginTop: 4 }}>
              with <span style={{ color: 'var(--accent-text)', fontWeight: 600 }}>{peer?.name}</span>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: 16, cursor: 'pointer', padding: '4px 10px', borderRadius: 8, transition: 'all 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--text-white)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
            ✕
          </button>
        </div>

        {/* Inline error — no browser alert() */}
        {error && (
          <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171', fontSize: 13, marginBottom: 14, fontFamily: 'JetBrains Mono', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>⚠</span> {error}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label className="label">Topic / Skill</label>
            {skills.length > 0 ? (
              <select value={form.topic} onChange={e => set('topic', e.target.value)} className="input">
                {skills.map(s => <option key={s} value={s}>{s}</option>)}
                <option value="General Discussion">General Discussion</option>
              </select>
            ) : (
              <input value={form.topic} onChange={e => set('topic', e.target.value)} className="input" placeholder="What do you want to learn?" />
            )}
          </div>

          <div>
            <label className="label">Date</label>
            <input
              type="date"
              min={todayStr}
              value={form.date}
              onChange={e => { set('date', e.target.value); setError(''); }}
              className="input"
            />
          </div>

          <div>
            <label className="label">Time</label>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <select value={form.hour} onChange={e => set('hour', e.target.value)} className="input" style={{ flex: '0 0 auto', width: 72 }}>
                {hourOptions.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
              <span style={{ color: 'var(--text-muted)', fontWeight: 700, fontSize: 16 }}>:</span>
              <select value={form.minute} onChange={e => set('minute', e.target.value)} className="input" style={{ flex: '0 0 auto', width: 72 }}>
                {minuteOptions.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              <div style={{ display: 'flex', borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border)', flexShrink: 0 }}>
                {['AM', 'PM'].map(period => (
                  <button key={period} type="button" onClick={() => set('ampm', period)} style={{
                    padding: '9px 14px', border: 'none', cursor: 'pointer', fontFamily: 'JetBrains Mono', fontSize: 12, fontWeight: 700, transition: 'all 0.15s',
                    background: form.ampm === period ? 'var(--accent)' : 'var(--bg-elevated)',
                    color: form.ampm === period ? 'white' : 'var(--text-muted)',
                  }}>
                    {period}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono', marginTop: 6 }}>
              Selected: {form.hour}:{form.minute} {form.ampm}
            </div>
          </div>

          <div>
            <label className="label">Note <span style={{ color: 'var(--text-muted)' }}>(optional)</span></label>
            <textarea rows={2} value={form.note} onChange={e => set('note', e.target.value)} className="input" style={{ resize: 'none' }} placeholder="Anything you want them to know beforehand..." />
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button onClick={onClose} className="btn-ghost" style={{ flex: 1 }}>Cancel</button>
            <button onClick={handleSubmit} disabled={sending} className="btn-primary" style={{ flex: 2, fontSize: 14 }}>
              {sending ? 'Sending...' : '📅 Send Session Request →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Session Card ────────────────────────────────────────────────── */
function SessionCard({ session, currentUserId, onRespond, onComplete }) {
  const navigate = useNavigate();
  const isHost = session.host?._id === currentUserId;
  const other  = isHost ? session.requester : session.host;

  const sessionDateTime = (() => {
    try { return new Date(`${session.date}T${session.time || '00:00'}:00`); }
    catch { return null; }
  })();
  const isPastDue = sessionDateTime && sessionDateTime < new Date();
  const effectiveStatus = session.status === 'Accepted' && isPastDue ? 'Expired' : session.status;

  const formatTime = (time24) => {
    if (!time24) return '';
    const [hStr, mStr] = time24.split(':');
    let h = parseInt(hStr, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    if (h === 0) h = 12;
    else if (h > 12) h -= 12;
    return ` · ${h}:${mStr} ${ampm}`;
  };

  const dateStr = session.date
    ? (() => {
        try {
          const d = new Date(`${session.date}T${session.time || '00:00'}`);
          return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) + formatTime(session.time);
        } catch { return `${session.date}${formatTime(session.time)}`; }
      })()
    : '—';

  return (
    <div className="card" style={{ padding: 20, opacity: effectiveStatus === 'Expired' ? 0.75 : 1, transition: 'opacity 0.2s' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
        <div style={{ width: 42, height: 42, borderRadius: 12, background: 'linear-gradient(135deg, #10b981, #3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Outfit', fontWeight: 700, color: 'white', fontSize: 17, flexShrink: 0 }}>
          {other?.name?.charAt(0).toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 600, color: 'var(--text-white)', fontSize: 15 }}>{other?.name}</span>
            <StatusPill status={effectiveStatus} />
            <span style={{ fontSize: 11, background: 'rgba(59,130,246,0.12)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.25)', padding: '3px 10px', borderRadius: 99, fontFamily: 'JetBrains Mono' }}>
              {session.topic}
            </span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono', marginBottom: 6 }}>
            📅 {dateStr} · {isHost ? 'You are hosting' : 'You requested'}
          </div>
          {session.note && (
            <div style={{ padding: '8px 12px', borderRadius: 8, background: 'var(--bg-elevated)', border: '1px solid var(--border)', fontSize: 12, color: 'var(--text-secondary)', fontStyle: 'italic' }}>
              "{session.note}"
            </div>
          )}
          {session.status === 'Accepted' && !isPastDue && (
            <div style={{ marginTop: 12, padding: '12px 14px', borderRadius: 10, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
              <div style={{ fontSize: 13, color: '#10b981', fontWeight: 600, marginBottom: 4 }}>🎉 Session Confirmed!</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>Share a Google Meet link or coordinate in Messages.</div>
              <button onClick={() => navigate(`/messages?with=${other?._id}`)} className="btn-primary" style={{ fontSize: 12, padding: '7px 16px' }}>
                Open Messages →
              </button>
            </div>
          )}
          {effectiveStatus === 'Expired' && (
            <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 10, background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.22)' }}>
              <div style={{ fontSize: 13, color: '#f87171', fontWeight: 600, marginBottom: 3 }}>⌛ Session Expired</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>This session passed without being marked complete. Did it happen?</div>
              <button
                onClick={() => onComplete(session._id)}
                style={{ fontSize: 12, padding: '7px 14px', background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)', color: '#a78bfa', borderRadius: 8, cursor: 'pointer', fontFamily: 'JetBrains Mono', transition: 'all 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(139,92,246,0.25)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(139,92,246,0.15)'}
              >
                ★ Mark as Completed
              </button>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end', flexShrink: 0 }}>
          {isHost && session.status === 'Pending' && !isPastDue && (
            <>
              <button onClick={() => onRespond(session._id, 'Accepted')} className="btn-success" style={{ fontSize: 12, padding: '7px 14px' }}>Accept ✓</button>
              <button onClick={() => onRespond(session._id, 'Cancelled')} className="btn-danger" style={{ fontSize: 12, padding: '7px 14px' }}>Decline</button>
            </>
          )}
          {isHost && session.status === 'Pending' && isPastDue && (
            <button onClick={() => onRespond(session._id, 'Cancelled')} className="btn-danger" style={{ fontSize: 12, padding: '7px 14px' }}>Decline (Expired)</button>
          )}
          {session.status === 'Accepted' && !isPastDue && (
            <button onClick={() => onComplete(session._id)} className="btn-ghost" style={{ fontSize: 12, padding: '7px 14px' }}>
              Mark Complete ★
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Main Mentorship Page ────────────────────────────────────────── */
export default function Mentorship() {
  const navigate = useNavigate();
  const [sent,     setSent]     = useState([]);
  const [received, setReceived] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [tab,      setTab]      = useState('received');
  const [loading,  setLoading]  = useState(true);
  const [modal,    setModal]    = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [toast, setToast] = useState(null); // { message, type }

  const showToast = (message, type = 'error') => setToast({ message, type });
  const closeToast = () => setToast(null);

  useEffect(() => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setCurrentUserId(payload.id || payload._id);
      }
    } catch {}
  }, []);

  const fetchAll = async () => {
    try {
      const [mentRes, sessRes] = await Promise.all([getMentorshipRequests(), getSessions()]);
      setSent(mentRes.data.sent);
      setReceived(mentRes.data.received);
      setSessions(sessRes.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleRespond = async (id, status) => {
    try { await respondToRequest({ requestId: id, status }); await fetchAll(); }
    catch (err) { showToast(err.response?.data?.message || 'Failed to respond'); }
  };

  const handleSessionRespond = async (id, status) => {
    try { await respondToSession(id, status); await fetchAll(); }
    catch (err) { showToast(err.response?.data?.message || 'Failed to respond'); }
  };

  const handleComplete = async (id) => {
    try {
      await completeSession(id);
      await fetchAll();
      const s = sessions.find(x => x._id === id);
      if (s) {
        const otherId = s.host?._id === currentUserId ? s.requester?._id : s.host?._id;
        if (otherId) navigate(`/feedback?userId=${otherId}`);
      }
    } catch (err) { showToast(err.response?.data?.message || 'Failed to complete session'); }
  };

  const handleSessionSubmit = async (form) => {
    if (!modal) return;
    try {
      await requestSession({ hostId: modal._id, ...form });
      setModal(null);
      await fetchAll();
      setTab('sessions');
      showToast('Session request sent!', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to book session');
    }
  };

  const openModal = (peer) => {
    if (!peer?._id) {
      showToast('Cannot schedule: peer data is incomplete. Try refreshing the page.');
      return;
    }
    setModal(peer);
  };

  const pendingCount        = received.filter(r => r.status === 'Pending').length;
  const pendingSessionCount = sessions.filter(s => s.host?._id === currentUserId && s.status === 'Pending').length;
  const upcomingSessions    = sessions.filter(s => s.status === 'Accepted');
  const hasCompletedSession = sessions.some(s => s.status === 'Completed');

  const stats = [
    { label: 'Pending Requests',   value: pendingCount,                                                              color: '#f59e0b' },
    { label: 'Active Connections', value: [...sent, ...received].filter(r => r.status === 'Accepted').length,        color: '#10b981' },
    { label: 'Upcoming Sessions',  value: upcomingSessions.length,                                                   color: '#3b82f6' },
    { label: 'Total Received',     value: received.length,                                                           color: '#8b5cf6' },
  ];

  const tabStyle = (key) => ({
    padding: '12px 20px', fontSize: 14, fontWeight: 500, cursor: 'pointer',
    border: 'none', background: 'none', marginBottom: -1,
    borderBottom: `2px solid ${tab === key ? 'var(--accent)' : 'transparent'}`,
    color: tab === key ? 'var(--accent-text)' : 'var(--text-muted)',
    transition: 'all 0.2s',
  });

  const currentList = tab === 'received' ? received : sent;

  return (
    <Layout>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideIn { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
      `}</style>

      {toast && <Toast message={toast.message} type={toast.type} onClose={closeToast} />}

      {modal && (
        <SessionModal
          peer={modal}
          onClose={() => setModal(null)}
          onSubmit={handleSessionSubmit}
        />
      )}

      <div style={{ marginBottom: 32 }}>
        <h1 className="page-title">Mentorship</h1>
        <p style={{ color: 'var(--text-muted)', marginTop: 6 }}>Manage your connections, requests, and sessions</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 24 }}>
        {stats.map(s => (
          <div key={s.label} className="card" style={{ padding: '16px 20px' }}>
            <div style={{ fontFamily: 'Outfit', fontSize: 28, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: 20, gap: 4 }}>
        <button style={tabStyle('received')} onClick={() => setTab('received')}>
          Received{pendingCount > 0 ? ` (${pendingCount})` : ''}
        </button>
        <button style={tabStyle('sent')} onClick={() => setTab('sent')}>
          Sent ({sent.length})
        </button>
        <button style={tabStyle('sessions')} onClick={() => setTab('sessions')}>
          Sessions{pendingSessionCount > 0 ? ` (${pendingSessionCount} pending)` : ''}
        </button>
        {hasCompletedSession && (
          <button style={tabStyle('feedback')} onClick={() => setTab('feedback')}>
            Feedback ★
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 160 }}>
          <div style={{ width: 32, height: 32, border: '2px solid var(--accent)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        </div>
      ) : tab === 'sessions' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {sessions.length === 0 ? (
            <div className="card" style={{ padding: 56, textAlign: 'center', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: 40, marginBottom: 14, opacity: 0.3 }}>📅</div>
              <div style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: 16, color: 'var(--text-secondary)', marginBottom: 8 }}>No sessions yet</div>
              <p style={{ fontSize: 14, lineHeight: 1.7, maxWidth: 340, margin: '0 auto' }}>
                Accept a mentorship connection first, then click <strong style={{ color: 'var(--accent-text)' }}>Schedule Session</strong> on the request card.
              </p>
              <button onClick={() => setTab('received')} className="btn-primary" style={{ marginTop: 20, fontSize: 13 }}>
                View Requests →
              </button>
            </div>
          ) : (
            sessions.map(s => (
              <SessionCard
                key={s._id}
                session={s}
                currentUserId={currentUserId}
                onRespond={handleSessionRespond}
                onComplete={handleComplete}
              />
            ))
          )}
        </div>
      ) : tab === 'feedback' ? (
        <div className="card" style={{ padding: 32, textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 14 }}>★</div>
          <div style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: 18, color: 'var(--text-white)', marginBottom: 8 }}>
            Give or View Feedback
          </div>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.7, maxWidth: 380, margin: '0 auto 20px' }}>
            You have completed sessions — share your experience and see what others said about you.
          </p>
          <button onClick={() => navigate('/feedback')} className="btn-primary" style={{ padding: '12px 28px', fontSize: 14 }}>
            Go to Feedback →
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {currentList.length === 0 ? (
            <div className="card" style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
              No {tab === 'received' ? 'incoming' : 'outgoing'} requests yet.
            </div>
          ) : (
            currentList.map(req => (
              <RequestCard
                key={req._id}
                req={req}
                isReceived={tab === 'received'}
                onRespond={handleRespond}
                onSchedule={openModal}
              />
            ))
          )}
        </div>
      )}
    </Layout>
  );
}
