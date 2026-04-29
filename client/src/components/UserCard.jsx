import SkillTag from './SkillTag';

// Helper: extract skill name from string or {name,level}
const sname = s => (typeof s === 'string' ? s : s?.name || '');

export default function UserCard({ user, action, children, avgRating, ratingCount }) {
  return (
    <div className="card" style={{ padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 12, flexShrink: 0,
            background: 'linear-gradient(135deg, var(--accent), var(--accent-2))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, fontFamily: 'Outfit', fontWeight: 700, color: 'white',
          }}>
            {user.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ fontWeight: 600, color: 'var(--text-white)', fontSize: 15 }}>{user.name}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{user.email}</div>
            {/* Rating display */}
            {avgRating != null && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 3 }}>
                <span style={{ color: '#fbbf24', fontSize: 12 }}>{'★'.repeat(Math.round(avgRating))}{'☆'.repeat(5 - Math.round(avgRating))}</span>
                <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono', color: 'var(--text-muted)' }}>
                  {avgRating.toFixed(1)}{ratingCount != null ? ` (${ratingCount})` : ''}
                </span>
              </div>
            )}
          </div>
        </div>
        <span className={`tag ${user.role === 'Mentor' ? 'tag-amber' : 'tag-slate'}`}>{user.role}</span>
      </div>

      {user.skillsOffered?.length > 0 && (
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 10, fontFamily: 'JetBrains Mono', color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Offers</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {user.skillsOffered.slice(0, 3).map((s, i) => {
              const name = typeof s === 'string' ? s : (s?.name || '');
              return name ? <SkillTag key={i} skill={s} variant="emerald" /> : null;
            })}
            {user.skillsOffered.length > 3 && <span className="tag-slate">+{user.skillsOffered.length - 3}</span>}
          </div>
        </div>
      )}

      {user.skillsWanted?.length > 0 && (
        <div>
          <div style={{ fontSize: 10, fontFamily: 'JetBrains Mono', color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Wants to Learn</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {user.skillsWanted.slice(0, 3).map((s, i) => {
              const name = typeof s === 'string' ? s : (s?.name || '');
              return name ? <SkillTag key={i} skill={s} variant="cyan" /> : null;
            })}
            {user.skillsWanted.length > 3 && <span className="tag-slate">+{user.skillsWanted.length - 3}</span>}
          </div>
        </div>
      )}

      {(action || children) && (
        <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
          {action}{children}
        </div>
      )}
    </div>
  );
}
