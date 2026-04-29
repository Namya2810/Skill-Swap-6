import { useEffect, useState } from 'react';
import { getPosts, createPost, reactToPost, addComment, deletePost, getMyCommunity } from '../api';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';

const POST_TYPES = ['General', 'Achievement', 'Question', 'Resource'];
const TYPE_ICONS = { General: '📝', Achievement: '🏆', Question: '❓', Resource: '📚' };
const TYPE_COLORS = { General: 'tag-slate', Achievement: 'tag-amber', Question: 'tag-cyan', Resource: 'tag-emerald' };
const EMOJI_OPTIONS = ['👍', '🔥', '❤️', '🎉', '💡', '👏'];

function PostCard({ post, currentUser, onReact, onComment, onDelete, myCommunityId }) {
  const [showCommentBox, setShowCommentBox] = useState(false);
  const [commentText, setCommentText]       = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [showAllComments, setShowAllComments] = useState(false);
  const [showEmojis, setShowEmojis]         = useState(false);

  // Reaction summary: { '👍': 3, '🔥': 1 }
  const reactionSummary = {};
  if (post.reactions) {
    const entries = post.reactions instanceof Map
      ? [...post.reactions.values()]
      : Object.values(post.reactions);
    entries.forEach(e => { reactionSummary[e] = (reactionSummary[e] || 0) + 1; });
  }

  const handleComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setSubmittingComment(true);
    try {
      await onComment(post._id, commentText.trim());
      setCommentText('');
      setShowCommentBox(false);
    } finally { setSubmittingComment(false); }
  };

  const visibleComments = showAllComments ? post.comments : post.comments?.slice(-2);

  return (
    <div className="card" style={{ padding: 22 }}>
      {/* Author row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
        <div style={{ width: 38, height: 38, borderRadius: 11, background: 'linear-gradient(135deg, var(--accent), var(--accent-2))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Outfit', fontWeight: 700, color: 'white', fontSize: 16, flexShrink: 0 }}>
          {post.author?.name?.charAt(0).toUpperCase()}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontWeight: 600, color: 'var(--text-white)', fontSize: 14 }}>{post.author?.name}</span>
            <span className={`tag ${TYPE_COLORS[post.type]}`}>{TYPE_ICONS[post.type]} {post.type}</span>
            {myCommunityId && (post.author?.community === myCommunityId || post.author?.community?._id === myCommunityId) && (
              <span style={{ fontSize: 10, background: 'rgba(139,92,246,0.12)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.25)', padding: '2px 8px', borderRadius: 99, fontFamily: 'JetBrains Mono' }}>◈ Your Community</span>
            )}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono', marginTop: 2 }}>
            {new Date(post.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            {' · '}{post.views} view{post.views !== 1 ? 's' : ''}
          </div>
        </div>
        {/* Delete button — only for post author */}
        {(post.author?._id === currentUser?._id || post.author?._id === currentUser?.id) && (
          <button
            onClick={() => { if (window.confirm('Delete this post?')) onDelete(post._id); }}
            title="Delete post"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-faint)', fontSize: 14, padding: '4px 6px', borderRadius: 6, transition: 'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#f87171'; e.currentTarget.style.background = 'rgba(220,38,38,0.1)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-faint)'; e.currentTarget.style.background = 'none'; }}>
            🗑
          </button>
        )}
      </div>

      {/* Content */}
      <p style={{ fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.7, marginBottom: 16, whiteSpace: 'pre-wrap' }}>{post.content}</p>

      {/* Reactions summary */}
      {Object.keys(reactionSummary).length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
          {Object.entries(reactionSummary).map(([emoji, count]) => (
            <button key={emoji} onClick={() => onReact(post._id, emoji)}
              style={{ padding: '4px 10px', borderRadius: 99, background: 'var(--bg-elevated)', border: '1px solid var(--border)', cursor: 'pointer', fontSize: 13, color: 'var(--text-primary)', fontFamily: 'Space Grotesk', transition: 'all 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
              {emoji} {count}
            </button>
          ))}
        </div>
      )}

      {/* Action bar */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', paddingTop: 12, borderTop: '1px solid var(--border)', position: 'relative' }}>
        <button onClick={() => setShowEmojis(p => !p)} className="btn-ghost"
          style={{ fontSize: 13, padding: '6px 12px' }}>
          😊 React
        </button>
        <button onClick={() => setShowCommentBox(p => !p)} className="btn-ghost"
          style={{ fontSize: 13, padding: '6px 12px' }}>
          💬 {post.comments?.length > 0 ? post.comments.length : ''} Comment{post.comments?.length !== 1 ? 's' : ''}
        </button>

        {/* Emoji picker */}
        {showEmojis && (
          <div style={{ position: 'absolute', bottom: '100%', left: 0, marginBottom: 6, background: 'var(--autocomplete-bg)', border: '1px solid var(--border)', borderRadius: 12, padding: '8px 10px', display: 'flex', gap: 6, boxShadow: 'var(--card-shadow)', zIndex: 10 }}>
            {EMOJI_OPTIONS.map(e => (
              <button key={e} onClick={() => { onReact(post._id, e); setShowEmojis(false); }}
                style={{ fontSize: 20, background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', borderRadius: 6, transition: 'transform 0.1s' }}
                onMouseEnter={el => el.currentTarget.style.transform = 'scale(1.25)'}
                onMouseLeave={el => el.currentTarget.style.transform = 'scale(1)'}>
                {e}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Comments */}
      {post.comments?.length > 0 && (
        <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {post.comments.length > 2 && !showAllComments && (
            <button onClick={() => setShowAllComments(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--accent-text)', fontFamily: 'JetBrains Mono', textAlign: 'left', padding: 0 }}>
              View {post.comments.length - 2} earlier comment{post.comments.length - 2 !== 1 ? 's' : ''}
            </button>
          )}
          {visibleComments?.map(c => (
            <div key={c._id} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <div style={{ width: 26, height: 26, borderRadius: 8, background: 'var(--bg-elevated)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', flexShrink: 0 }}>
                {c.author?.name?.charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1, background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '10px 10px 10px 4px', padding: '8px 12px' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 3 }}>{c.author?.name}</div>
                <div style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.5 }}>{c.text}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Comment box */}
      {showCommentBox && (
        <form onSubmit={handleComment} style={{ marginTop: 12, display: 'flex', gap: 8 }}>
          <input value={commentText} onChange={e => setCommentText(e.target.value)}
            placeholder="Write a comment..." className="input" style={{ flex: 1, padding: '9px 14px', fontSize: 13 }} />
          <button type="submit" disabled={submittingComment || !commentText.trim()} className="btn-primary" style={{ padding: '9px 14px', fontSize: 13 }}>
            {submittingComment ? '...' : 'Post'}
          </button>
        </form>
      )}
    </div>
  );
}

export default function Feed() {
  const { user } = useAuth();
  const [posts, setPosts]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [content, setContent]   = useState('');
  const [type, setType]         = useState('General');
  const [submitting, setSubmitting] = useState(false);
  const [filterType, setFilterType] = useState('All');
  const [myCommunityId, setMyCommunityId] = useState(null);

  const fetchPosts = async () => {
    try {
      const res = await getPosts();
      setPosts(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchPosts();
    getMyCommunity().then(res => {
      setMyCommunityId(res.data?.community?._id || null);
    }).catch(() => {});
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    setSubmitting(true);
    try {
      await createPost({ content, type });
      setContent(''); setType('General');
      await fetchPosts();
    } catch (err) { alert(err.response?.data?.message || 'Failed to post'); }
    finally { setSubmitting(false); }
  };

  const handleReact = async (postId, emoji) => {
    try {
      await reactToPost(postId, emoji);
      await fetchPosts();
    } catch (err) { console.error(err); }
  };

  const handleComment = async (postId, text) => {
    await addComment(postId, text);
    await fetchPosts();
  };

  const handleDelete = async (postId) => {
    try {
      await deletePost(postId);
      setPosts(prev => prev.filter(p => p._id !== postId));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete post');
    }
  };

  const typeFiltered = filterType === 'All' ? posts : posts.filter(p => p.type === filterType);
  // Community posts first, then others
  const filtered = myCommunityId
    ? [
        ...typeFiltered.filter(p => p.author?.community === myCommunityId || p.author?.community?._id === myCommunityId),
        ...typeFiltered.filter(p => p.author?.community !== myCommunityId && p.author?.community?._id !== myCommunityId),
      ]
    : typeFiltered;

  return (
    <Layout>
      <div style={{ marginBottom: 24 }}>
        <h1 className="page-title">Community Feed</h1>
        <p style={{ color: 'var(--text-muted)', marginTop: 6, fontSize: 14 }}>Share achievements, ask questions, and post resources</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: 20 }}>
        {/* Feed column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Create post */}
          <div className="card" style={{ padding: 20 }}>
            <form onSubmit={handleCreate}>
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder={`What's on your mind, ${user?.name?.split(' ')[0]}?`}
                className="input"
                rows={3}
                style={{ resize: 'none', marginBottom: 12, fontSize: 14 }}
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ display: 'flex', gap: 6 }}>
                  {POST_TYPES.map(t => (
                    <button key={t} type="button" onClick={() => setType(t)}
                      style={{
                        padding: '5px 10px', borderRadius: 8, border: `1px solid ${type === t ? 'var(--accent)' : 'var(--border)'}`,
                        background: type === t ? 'rgba(59,130,246,0.12)' : 'var(--bg-elevated)',
                        color: type === t ? 'var(--accent-text)' : 'var(--text-muted)',
                        fontSize: 12, cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'Space Grotesk',
                      }}>
                      {TYPE_ICONS[t]} {t}
                    </button>
                  ))}
                </div>
                <button type="submit" disabled={submitting || !content.trim()} className="btn-primary"
                  style={{ marginLeft: 'auto', padding: '8px 18px', fontSize: 13 }}>
                  {submitting ? 'Posting...' : 'Post'}
                </button>
              </div>
            </form>
          </div>

          {/* Posts */}
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', height: 160, alignItems: 'center' }}>
              <div style={{ width: 32, height: 32, border: '2px solid var(--accent)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            </div>
          ) : filtered.length === 0 ? (
            <div className="card" style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
              No posts yet. Be the first to share!
            </div>
          ) : (
            filtered.map(post => (
              <PostCard key={post._id} post={post} currentUser={user} onReact={handleReact} onComment={handleComment} onDelete={handleDelete} myCommunityId={myCommunityId} />
            ))
          )}
        </div>

        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Filter */}
          <div className="card" style={{ padding: 18 }}>
            <div className="section-title" style={{ fontSize: 14, marginBottom: 12 }}>Filter by Type</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {['All', ...POST_TYPES].map(t => (
                <button key={t} onClick={() => setFilterType(t)}
                  style={{
                    padding: '8px 12px', borderRadius: 9, border: 'none', cursor: 'pointer', textAlign: 'left',
                    background: filterType === t ? 'var(--bg-elevated)' : 'transparent',
                    borderLeft: `3px solid ${filterType === t ? 'var(--accent)' : 'transparent'}`,
                    color: filterType === t ? 'var(--text-white)' : 'var(--text-muted)',
                    fontSize: 13, fontFamily: 'Space Grotesk', transition: 'all 0.15s',
                  }}>
                  {t === 'All' ? '📋 All Posts' : `${TYPE_ICONS[t]} ${t}`}
                  {t !== 'All' && <span style={{ marginLeft: 6, fontSize: 11, color: 'var(--text-faint)' }}>({posts.filter(p => p.type === t).length})</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="card" style={{ padding: 18 }}>
            <div className="section-title" style={{ fontSize: 14, marginBottom: 12 }}>Feed Stats</div>
            {[
              { label: 'Total Posts', value: posts.length },
              { label: 'Total Views', value: posts.reduce((s, p) => s + p.views, 0) },
              { label: 'Comments', value: posts.reduce((s, p) => s + (p.comments?.length || 0), 0) },
            ].map(s => (
              <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{s.label}</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-white)', fontFamily: 'Outfit' }}>{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </Layout>
  );
}
