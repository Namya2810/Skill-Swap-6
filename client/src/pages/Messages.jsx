import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getInbox, getConversation, sendMessage, getMentorshipRequests, deleteMessage } from '../api';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';

export default function Messages() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  // FIX: store connected user OBJECTS (not just IDs) so we always have name/email
  const [connectedUsers, setConnectedUsers] = useState([]); // [{_id, name, email, role}]
  const [inbox, setInbox]               = useState([]);     // [{partner, lastMessage}]
  const [activeUserId, setActiveUserId] = useState(null);
  const [activeUser, setActiveUser]     = useState(null);
  const [messages, setMessages]         = useState([]);
  const [text, setText]                 = useState('');
  const [loading, setLoading]           = useState(true);
  const [sending, setSending]           = useState(false);
  const [error, setError]               = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState(null); // custom delete modal
  const [attachToast, setAttachToast]   = useState(false);      // attach info toast
  const messagesEndRef = useRef(null);
  const pollRef        = useRef(null);

  useEffect(() => {
    const init = async () => {
      try {
        const [inboxRes, mentRes] = await Promise.all([getInbox(), getMentorshipRequests()]);

        // ── FIX A: Collect full user objects from accepted mentorships ──────────
        // mentRes.data.sent[].receiver and mentRes.data.received[].sender are
        // populated objects with { _id, name, email, role } — use them directly.
        const fromSent     = mentRes.data.sent
          .filter(r => r.status === 'Accepted')
          .map(r => r.receiver);   // full user object

        const fromReceived = mentRes.data.received
          .filter(r => r.status === 'Accepted')
          .map(r => r.sender);     // full user object

        const all = [...fromSent, ...fromReceived];

        // Deduplicate by _id (a user could appear in both sent and received)
        const seenIds = new Set();
        const unique = all.filter(u => {
          const id = u._id?.toString() || u._id;
          if (seenIds.has(id)) return false;
          seenIds.add(id);
          return true;
        });

        setConnectedUsers(unique);   // [{_id, name, email, role}, ...]
        setInbox(inboxRes.data);     // [{partner: {_id,name,email}, lastMessage}, ...]

        // Auto-open conversation if ?with= param is set
        const withId = searchParams.get('with');
        if (withId) {
          // Find the full user object for this ID
          const partner = unique.find(u => (u._id?.toString() || u._id) === withId)
            || { _id: withId, name: 'User', email: '' };
          openConversation(withId, partner);
        }
      } catch (err) {
        console.error('Messages init error:', err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  // Cleanup poll on unmount
  useEffect(() => () => clearInterval(pollRef.current), []);

  const openConversation = async (userId, partnerUser) => {
    setActiveUserId(userId);
    setActiveUser(partnerUser);
    setError('');

    try {
      const res = await getConversation(userId);
      setMessages(res.data);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (err) {
      setError(err.response?.data?.message || 'Cannot load conversation');
    }

    // Poll for new messages every 5 seconds
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const r = await getConversation(userId);
        setMessages(r.data);
      } catch { /* silent poll failure */ }
    }, 5000);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() || !activeUserId) return;
    setSending(true);
    setError('');
    try {
      await sendMessage({ receiverId: activeUserId, text: text.trim() });
      setText('');
      const r = await getConversation(activeUserId);
      setMessages(r.data);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 80);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send');
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (msgId) => {
    try {
      await deleteMessage(msgId);
      setMessages(prev => prev.filter(m => m._id !== msgId));
    } catch (err) {
      console.error('Failed to delete message:', err);
    }
  };

  const fmt = (d) =>
    new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

  // C: Date grouping label — "Today", "Yesterday", or formatted date
  const dateDividerLabel = (dateStr) => {
    const d = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (d.toDateString() === today.toDateString()) return 'Today';
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
  };

  // Group messages by calendar date
  const groupedMessages = () => {
    const groups = [];
    let lastDate = null;
    for (const msg of messages) {
      const dateKey = new Date(msg.createdAt).toDateString();
      if (dateKey !== lastDate) {
        groups.push({ type: 'divider', label: dateDividerLabel(msg.createdAt), key: dateKey });
        lastDate = dateKey;
      }
      groups.push({ type: 'message', msg });
    }
    return groups;
  };

  // ── FIX B: Get display name — always use the stored user object name ─────────
  // For each connected user, check inbox for last message preview.
  // Partner name comes from the full user object, NEVER from ObjectId.
  const getPartnerForUser = (connUser) => {
    const uid = connUser._id?.toString() || connUser._id;
    // Try to find a richer object from inbox (has lastMessage)
    const inboxEntry = inbox.find(e => {
      const partnerId = e.partner?._id?.toString() || e.partner?._id;
      return partnerId === uid;
    });
    return {
      user: inboxEntry?.partner || connUser,  // prefer inbox partner (already populated)
      lastMessage: inboxEntry?.lastMessage || null,
    };
  };

  return (
    <Layout>
      <div style={{ marginBottom: 20 }}>
        <h1 className="page-title">Messages</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>
          Chat with your connected peers. Connect via Mentorship first.
        </p>
      </div>

      <div className="card" style={{ display: 'flex', height: 560, overflow: 'hidden', padding: 0 }}>

        {/* ── Inbox sidebar ── */}
        <div style={{ width: 240, borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', fontFamily: 'Outfit, sans-serif' }}>
            Conversations
          </div>

          {loading ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: 24, height: 24, border: '2px solid var(--accent)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            </div>
          ) : connectedUsers.length === 0 ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20, textAlign: 'center' }}>
              <div style={{ fontSize: 28, marginBottom: 8, opacity: 0.3 }}>✉</div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                No connections yet.<br />Accept a mentorship request to start chatting.
              </p>
            </div>
          ) : (
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {connectedUsers.map(connUser => {
                const uid = connUser._id?.toString() || connUser._id;
                const { user: partner, lastMessage } = getPartnerForUser(connUser);
                const isActive = activeUserId === uid;

                // ── FIX: always show .name — never show raw ObjectId ──────────
                const displayName = partner?.name || connUser?.name || 'Unknown User';
                const initial = displayName.charAt(0).toUpperCase();

                return (
                  <button
                    key={uid}
                    onClick={() => openConversation(uid, partner || connUser)}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                      padding: '12px 14px', border: 'none', cursor: 'pointer', textAlign: 'left',
                      background: isActive ? 'var(--bg-elevated)' : 'transparent',
                      borderLeft: `3px solid ${isActive ? 'var(--accent)' : 'transparent'}`,
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--bg-hover)'; }}
                    onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}>

                    {/* Avatar with correct initial */}
                    <div style={{
                      width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                      background: 'linear-gradient(135deg, var(--accent), var(--accent-2))',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: 'Outfit, sans-serif', fontWeight: 700, color: 'white', fontSize: 14,
                    }}>
                      {initial}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      {/* Display real name, never ObjectId */}
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-white)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {displayName}
                      </div>
                      {/* Last message preview if exists */}
                      {lastMessage && (
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {lastMessage.text}
                        </div>
                      )}
                      {!lastMessage && (
                        <div style={{ fontSize: 11, color: 'var(--text-faint)', fontFamily: 'JetBrains Mono' }}>
                          No messages yet
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Conversation panel ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          {!activeUserId ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.2 }}>✉</div>
              <p style={{ fontSize: 14 }}>Select a conversation to start chatting</p>
            </div>
          ) : (
            <>
              {/* Conversation header */}
              <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 34, height: 34, borderRadius: 10,
                  background: 'linear-gradient(135deg, var(--accent), var(--accent-2))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'Outfit, sans-serif', fontWeight: 700, color: 'white', fontSize: 14,
                }}>
                  {(activeUser?.name || 'U').charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-white)' }}>
                    {activeUser?.name || 'User'}
                  </div>
                  <div style={{ fontSize: 11, color: '#10b981', fontFamily: 'JetBrains Mono' }}>● Connected</div>
                </div>
              </div>

              {/* Messages list */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                {error && (
                  <div style={{ padding: '12px 14px', borderRadius: 10, background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.2)', color: '#f87171', fontSize: 13, textAlign: 'center' }}>
                    {error}
                  </div>
                )}

                {/* F: Empty state */}
                {messages.length === 0 && !error && (
                  <div className="empty-state" style={{ flex: 1 }}>
                    <div className="empty-state-icon">💬</div>
                    <div className="empty-state-title">No messages yet</div>
                    <p className="empty-state-desc">Say hello to {activeUser?.name?.split(' ')[0] || 'your peer'}!</p>
                  </div>
                )}

                {/* C: Grouped messages with date dividers */}
                {groupedMessages().map((item, idx) => {
                  if (item.type === 'divider') {
                    return (
                      <div key={item.key} className="chat-date-divider">
                        {item.label}
                      </div>
                    );
                  }

                  const msg = item.msg;
                  const senderId = msg.sender?._id?.toString() || msg.sender?._id;
                  const myId     = user?._id?.toString() || user?.id;
                  const isMine   = senderId === myId;

                  return (
                    <div key={msg._id} style={{ display: 'flex', flexDirection: isMine ? 'row-reverse' : 'row', gap: 8, alignItems: 'flex-end', marginBottom: 2 }}
                      className="msg-row">
                      {!isMine && (
                        <div style={{
                          width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                          background: 'linear-gradient(135deg, var(--accent), var(--accent-2))',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 11, fontWeight: 700, color: 'white',
                        }}>
                          {(msg.sender?.name || 'U').charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div style={{ maxWidth: '68%', position: 'relative' }} className="msg-bubble-wrap">
                        <div style={{
                          padding: '10px 14px',
                          borderRadius: isMine ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                          background: isMine
                            ? 'linear-gradient(135deg, var(--accent), var(--accent-2))'
                            : 'var(--bg-elevated)',
                          color: isMine ? 'white' : 'var(--text-primary)',
                          border: isMine ? 'none' : '1px solid var(--border)',
                          fontSize: 14, lineHeight: 1.55,
                          boxShadow: isMine ? '0 2px 8px rgba(37,99,235,0.25)' : 'none',
                        }}>
                          {msg.text}
                        </div>
                        <div style={{
                          fontSize: 10, color: 'var(--text-faint)', marginTop: 4,
                          textAlign: isMine ? 'right' : 'left',
                          fontFamily: 'JetBrains Mono', letterSpacing: '0.02em',
                          display: 'flex', alignItems: 'center', justifyContent: isMine ? 'flex-end' : 'flex-start', gap: 6,
                        }}>
                          {fmt(msg.createdAt)}
                          {isMine && (
                            <button
                              onClick={() => setDeleteConfirmId(msg._id)}
                              className="msg-delete-btn"
                              title="Delete message"
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-faint)', fontSize: 11, padding: '0 2px', opacity: 0, transition: 'opacity 0.15s' }}>
                              🗑
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Message input */}
              <form onSubmit={handleSend} style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', display: 'flex', gap: 10, alignItems: 'center' }}>
                {/* Attachment button */}
                <button
                  type="button"
                  title="Share a file link"
                  onClick={() => { setAttachToast(true); setTimeout(() => setAttachToast(false), 3500); }}
                  style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 12px', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 16, flexShrink: 0, transition: 'all 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent-text)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)'; }}>
                  📎
                </button>
                <input
                  value={text}
                  onChange={e => setText(e.target.value)}
                  placeholder="Type a message..."
                  className="input"
                  style={{ flex: 1, padding: '10px 14px' }}
                  disabled={sending}
                />
                <button type="submit" disabled={sending || !text.trim()} className="btn-primary" style={{ padding: '10px 18px', whiteSpace: 'nowrap' }}>
                  {sending ? '...' : 'Send →'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
      {/* ── Custom delete confirm modal ── */}
      {deleteConfirmId && (
        <div style={{ position:'fixed', inset:0, zIndex:999, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,0.55)', backdropFilter:'blur(4px)' }}
          onClick={() => setDeleteConfirmId(null)}>
          <div style={{ background:'var(--bg-elevated)', border:'1px solid var(--border)', borderRadius:18, padding:'28px 32px', maxWidth:340, width:'90%', boxShadow:'0 20px 60px rgba(0,0,0,0.4)', animation:'fadeScaleIn 0.2s ease both' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ fontSize:28, marginBottom:12, textAlign:'center' }}>🗑️</div>
            <div style={{ fontFamily:'Outfit', fontWeight:700, fontSize:17, color:'var(--text-white)', textAlign:'center', marginBottom:8 }}>Delete message?</div>
            <p style={{ fontSize:13, color:'var(--text-muted)', textAlign:'center', lineHeight:1.6, marginBottom:22 }}>This message will be permanently removed. This action cannot be undone.</p>
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={() => setDeleteConfirmId(null)} style={{ flex:1, padding:'10px', borderRadius:10, background:'var(--bg-surface)', border:'1px solid var(--border)', color:'var(--text-secondary)', cursor:'pointer', fontFamily:'Outfit', fontWeight:600, fontSize:14, transition:'all 0.2s' }}>Cancel</button>
              <button onClick={() => { handleDelete(deleteConfirmId); setDeleteConfirmId(null); }} style={{ flex:1, padding:'10px', borderRadius:10, background:'rgba(220,38,38,0.15)', border:'1px solid rgba(220,38,38,0.4)', color:'#f87171', cursor:'pointer', fontFamily:'Outfit', fontWeight:700, fontSize:14, transition:'all 0.2s' }}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Attach toast ── */}
      {attachToast && (
        <div style={{ position:'fixed', bottom:28, left:'50%', transform:'translateX(-50%)', zIndex:999, background:'var(--bg-elevated)', border:'1px solid var(--border)', borderRadius:12, padding:'12px 20px', display:'flex', alignItems:'center', gap:10, boxShadow:'0 8px 28px rgba(0,0,0,0.3)', animation:'slideUpFade 0.3s ease both', whiteSpace:'nowrap' }}>
          <span style={{ fontSize:18 }}>📎</span>
          <span style={{ fontSize:13, color:'var(--text-secondary)' }}>Paste a <strong style={{ color:'var(--text-white)' }}>Google Drive, Dropbox</strong>, or any file link directly in your message to share resources.</span>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeScaleIn { from{opacity:0;transform:scale(0.92)} to{opacity:1;transform:scale(1)} }
        @keyframes slideUpFade { from{opacity:0;transform:translateX(-50%) translateY(12px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }
        .msg-bubble-wrap:hover .msg-delete-btn { opacity: 1 !important; }
      `}</style>
    </Layout>
  );
}
