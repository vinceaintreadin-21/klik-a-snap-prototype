import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

// ─── Icons ────────────────────────────────────────────────────────────────────

function DashboardIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  )
}
function BatchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" />
    </svg>
  )
}
function ClientIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  )
}
function AnalyticsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  )
}
function UserIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}
function LogsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" /><line x1="2" y1="20" x2="22" y2="20" />
    </svg>
  )
}
function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}
function SupportIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  )
}
function SignOutIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  )
}

// ─── Nav config ───────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { icon: <DashboardIcon />, label: 'Dashboard',    path: '/admin/orders' },
  { icon: <BatchIcon />,     label: 'Orders',       path: '/admin/orders' },
  { icon: <ClientIcon />,    label: 'Institutions', path: '/admin/institutions' },
  { icon: <UserIcon />,      label: 'Operators',    path: '/admin/operators' },
  { icon: <AnalyticsIcon />, label: 'Analytics',    path: '/admin/analytics' },
  { icon: <LogsIcon />,      label: 'Logs',         path: '/admin/logs' },
]

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminSidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { logout } = useAuth()

  const isActive = (path: string) => location.pathname === path

  return (
    <aside style={{
      width: 230, minWidth: 230, height: '100vh', background: '#13131f',
      display: 'flex', flexDirection: 'column', padding: '0 0 16px 0',
      borderRight: '1px solid #1e1e2e', position: 'fixed', left: 0, top: 0, zIndex: 10,
    }}>
      {/* Logo */}
      <div style={{ padding: '20px 16px 24px', borderBottom: '1px solid #1e1e2e' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, background: '#7c3aed', borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, fontWeight: 800, color: '#fff',
          }}>Q</div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', letterSpacing: '-0.3px' }}>QueueBits</div>
            <div style={{ fontSize: 10, color: '#6b7280', marginTop: 1 }}>ID Management System</div>
          </div>
        </div>
      </div>

      {/* New Batch Button */}
      <div style={{ padding: '16px 12px 8px' }}>
        <button
          onClick={() => navigate('/')}
          style={{
            width: '100%', padding: '10px 0', background: '#7c3aed',
            border: 'none', borderRadius: 10, color: '#fff', fontWeight: 600,
            fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center',
            justifyContent: 'center', gap: 6, transition: 'background 0.2s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = '#6d28d9')}
          onMouseLeave={e => (e.currentTarget.style.background = '#7c3aed')}
        >
          <PlusIcon /> New Batch Upload
        </button>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {NAV_ITEMS.map(item => (
          <button
            key={item.label}
            onClick={() => navigate(item.path)}
            style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px',
              borderRadius: 8, border: 'none', cursor: 'pointer', textAlign: 'left',
              background: isActive(item.path) ? '#7c3aed' : 'transparent',
              color: isActive(item.path) ? '#fff' : '#9ca3af',
              fontSize: 13, fontWeight: 500, transition: 'all 0.15s', width: '100%',
            }}
            onMouseEnter={e => { if (!isActive(item.path)) e.currentTarget.style.background = '#1e1e2e' }}
            onMouseLeave={e => { if (!isActive(item.path)) e.currentTarget.style.background = 'transparent' }}
          >
            {item.icon} {item.label}
          </button>
        ))}
      </nav>

      {/* Bottom */}
      <div style={{ padding: '0 12px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        <div style={{ height: 1, background: '#1e1e2e', margin: '8px 0' }} />
        <button style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px',
          borderRadius: 8, border: 'none', cursor: 'pointer',
          background: 'transparent', color: '#6b7280', fontSize: 13, fontWeight: 500,
          transition: 'all 0.15s', width: '100%',
        }}
          onMouseEnter={e => { e.currentTarget.style.background = '#1e1e2e'; e.currentTarget.style.color = '#9ca3af' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#6b7280' }}
        >
          <SupportIcon /> Support
        </button>
        <button
          onClick={() => logout()}
          style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px',
            borderRadius: 8, border: 'none', cursor: 'pointer',
            background: 'transparent', color: '#6b7280', fontSize: 13, fontWeight: 500,
            transition: 'all 0.15s', width: '100%',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#1e1e2e'; e.currentTarget.style.color = '#9ca3af' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#6b7280' }}
        >
          <SignOutIcon /> Sign Out
        </button>
      </div>
    </aside>
  )
}
