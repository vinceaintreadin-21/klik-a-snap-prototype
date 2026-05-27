import { useNavigate } from 'react-router-dom'

function IDLayoutIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="2" /><line x1="3" y1="9" x2="21" y2="9" />
      <line x1="9" y1="21" x2="9" y2="9" />
    </svg>
  )
}
function ReviewIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  )
}
function AnalyticsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  )
}
function InstitutionIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  )
}

export default function QuickActionCards() {
  const navigate = useNavigate()

  const cards = [
    {
      icon: <IDLayoutIcon />,
      title: 'ID Layout Builder',
      description: 'Design biometric cards and credential templates.',
      onClick: () => navigate('/'),
    },
    {
      icon: <ReviewIcon />,
      title: 'Review Queue',
      description: 'Inspect flagged batches and error logs.',
      onClick: () => navigate('/admin/logs'),
    },
    {
      icon: <AnalyticsIcon />,
      title: 'Analytics',
      description: 'View order trends and AI processing metrics.',
      onClick: () => navigate('/admin/analytics'),
    },
    {
      icon: <InstitutionIcon />,
      title: 'Institutions',
      description: 'Manage registered institutions and their access.',
      onClick: () => navigate('/admin/institutions'),
    },
  ]

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 16 }}>
      {cards.map(card => (
        <div
          key={card.title}
          onClick={card.onClick}
          style={{
            background: '#16162a', border: '1px solid #1e1e2e', borderRadius: 14,
            padding: 20, display: 'flex', alignItems: 'flex-start', gap: 14,
            cursor: 'pointer', transition: 'all 0.2s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = '#7c3aed'
            e.currentTarget.style.background = '#1a1a2e'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = '#1e1e2e'
            e.currentTarget.style.background = '#16162a'
          }}
        >
          <div style={{
            width: 42, height: 42, borderRadius: 10, background: '#1e1e2e',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#a855f7', flexShrink: 0,
          }}>
            {card.icon}
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9', marginBottom: 4 }}>{card.title}</div>
            <div style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.5 }}>{card.description}</div>
          </div>
        </div>
      ))}
    </div>
  )
}
