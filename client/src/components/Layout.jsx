import Sidebar from './Sidebar';

export default function Layout({ children }) {
  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg-base)' }}>
      <Sidebar />
      <main style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', background: 'var(--bg-base)' }}>
        <div className="layout-content" style={{ maxWidth: 1080, margin: '0 auto', padding: '28px 32px' }}>
          {children}
        </div>
      </main>
    </div>
  );
}
