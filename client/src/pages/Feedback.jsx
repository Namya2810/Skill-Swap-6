import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { getFeedback, submitFeedback, getMentorshipRequests } from '../api';
import Layout from '../components/Layout';

function StarRating({ rating, onChange }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {[1,2,3,4,5].map(star => (
        <button key={star} type="button"
          onClick={() => onChange && onChange(star)}
          onMouseEnter={() => onChange && setHovered(star)}
          onMouseLeave={() => onChange && setHovered(0)}
          style={{ fontSize: 24, background: 'none', border: 'none', cursor: onChange ? 'pointer' : 'default', color: star <= (hovered || rating) ? '#f59e0b' : 'var(--border)', transition: 'color 0.15s, transform 0.1s', transform: (onChange && star <= hovered) ? 'scale(1.15)' : 'scale(1)' }}>★</button>
      ))}
    </div>
  );
}

export default function Feedback() {
  const [received, setReceived] = useState([]);
  const [given, setGiven] = useState([]);
  const [avgRating, setAvgRating] = useState(null);
  const [acceptedPeers, setAcceptedPeers] = useState([]);
  const [givenToIds, setGivenToIds] = useState(new Set());
  const [form, setForm] = useState({ toUserId: '', message: '', rating: 0 });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [tab, setTab] = useState('received');

  const fetchAll = async () => {
    try {
      const [feedRes, mentRes] = await Promise.all([getFeedback(), getMentorshipRequests()]);
      setReceived(feedRes.data.received); setGiven(feedRes.data.given); setAvgRating(feedRes.data.avgRating);
      setGivenToIds(new Set(feedRes.data.given.map(f => f.toUser._id)));
      const accepted = [
        ...mentRes.data.sent.filter(r => r.status === 'Accepted').map(r => r.receiver),
        ...mentRes.data.received.filter(r => r.status === 'Accepted').map(r => r.sender),
      ];
      const seen = new Set();
      setAcceptedPeers(accepted.filter(p => { if (seen.has(p._id)) return false; seen.add(p._id); return true; }));
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const location = useLocation();

  useEffect(() => { fetchAll(); }, []);

  // Auto-select user from ?userId= query param (set after completing a session)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const uid = params.get('userId');
    if (uid) {
      setForm(f => ({ ...f, toUserId: uid }));
      setTab('given');
    }
  }, [location.search]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.toUserId || !form.message || form.rating === 0) { setError('Please fill all fields and select a rating.'); return; }
    setSubmitting(true); setError('');
    try {
      await submitFeedback(form);
      setSuccess('Feedback submitted!');
      setForm({ toUserId: '', message: '', rating: 0 });
      await fetchAll();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) { setError(err.response?.data?.message || 'Failed'); }
    finally { setSubmitting(false); }
  };

  const eligiblePeers = acceptedPeers.filter(p => !givenToIds.has(p._id));

  const tabStyle = (key) => ({
    padding: '12px 20px', fontSize: 14, fontWeight: 500, cursor: 'pointer',
    border: 'none', background: 'none', marginBottom: -1,
    borderBottom: `2px solid ${tab === key ? 'var(--accent)' : 'transparent'}`,
    color: tab === key ? 'var(--accent-text)' : 'var(--text-muted)',
    transition: 'all 0.2s',
  });

  return (
    <Layout>
      <div style={{ marginBottom: 32 }}>
        <h1 className="page-title">Feedback</h1>
        <p style={{ color: 'var(--text-muted)', marginTop: 6 }}>Share and view peer feedback from your mentorship sessions</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 24 }}>
        {/* Left */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Avg rating */}
          <div className="card" style={{ padding: 28, textAlign: 'center', background: 'linear-gradient(135deg, rgba(245,158,11,0.08), rgba(245,158,11,0.03))', border: '1px solid rgba(245,158,11,0.2)' }}>
            <div style={{ fontSize: 11, fontFamily: 'JetBrains Mono', color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Your Avg Rating</div>
            {avgRating ? (
              <>
                <div style={{ fontFamily: 'Outfit', fontSize: 48, fontWeight: 800, color: '#f59e0b', lineHeight: 1, marginBottom: 10 }}>{avgRating.toFixed(1)}</div>
                <StarRating rating={Math.round(avgRating)} />
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>from {received.length} review{received.length !== 1 ? 's' : ''}</div>
              </>
            ) : <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>No feedback yet</div>}
          </div>

          {/* Give feedback */}
          <div className="card" style={{ padding: 24 }}>
            <div className="section-title" style={{ marginBottom: 16 }}>Give Feedback</div>
            {eligiblePeers.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.6 }}>Accept a mentorship request first to give feedback.</p>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {success && <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', color: '#10b981', fontSize: 13 }}>{success}</div>}
                {error && <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.25)', color: '#f87171', fontSize: 13 }}>{error}</div>}
                <div>
                  <label className="label">Select Peer</label>
                  <select value={form.toUserId} onChange={e => setForm({...form, toUserId: e.target.value})} className="input" required>
                    <option value="">Choose a peer...</option>
                    {eligiblePeers.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                  </select>
                </div>
                <div><label className="label">Rating</label><StarRating rating={form.rating} onChange={r => setForm({...form, rating: r})} /></div>
                <div><label className="label">Message</label><textarea value={form.message} onChange={e => setForm({...form, message: e.target.value})} rows={3} placeholder="Share your experience..." className="input" style={{ resize: 'none' }} required /></div>
                <button type="submit" disabled={submitting} className="btn-primary" style={{ width: '100%' }}>{submitting ? 'Submitting...' : 'Submit Feedback'}</button>
              </form>
            )}
          </div>
        </div>

        {/* Right */}
        <div>
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: 20, gap: 4 }}>
            <button style={tabStyle('received')} onClick={() => setTab('received')}>Received ({received.length})</button>
            <button style={tabStyle('given')} onClick={() => setTab('given')}>Given ({given.length})</button>
          </div>

          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 160 }}>
              <div style={{ width: 32, height: 32, border: '2px solid var(--accent)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {(tab === 'received' ? received : given).length === 0
                ? <div className="card" style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>No {tab} feedback yet.</div>
                : (tab === 'received' ? received : given).map(fb => {
                  const person = tab === 'received' ? fb.fromUser : fb.toUser;
                  return (
                    <div key={fb._id} className="card" style={{ padding: 20 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, var(--accent), var(--accent-2))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'white', fontSize: 14 }}>
                            {person?.name?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--text-white)', fontSize: 14 }}>{person?.name}</div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{person?.email}</div>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <StarRating rating={fb.rating} />
                          <div style={{ fontSize: 11, fontFamily: 'JetBrains Mono', color: 'var(--text-muted)', marginTop: 4 }}>{new Date(fb.createdAt).toLocaleDateString()}</div>
                        </div>
                      </div>
                      <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, padding: '12px 16px', borderRadius: 10, background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>{fb.message}</p>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </Layout>
  );
}
