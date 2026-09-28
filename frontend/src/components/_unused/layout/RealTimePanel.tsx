import { useManualReviewRate } from '../../hooks/useAnalytics'
import { useAnalyticsOverview } from '../../hooks/useAnalytics'

function ChartBarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" /><line x1="2" y1="20" x2="22" y2="20" />
    </svg>
  )
}

function AIProgressBar({ value }: { value: number }) {
  return (
    <div style={{ height: 4, background: '#2a2a3a', borderRadius: 99, overflow: 'hidden' }}>
      <div style={{
        width: `${Math.min(value, 100)}%`, height: '100%', borderRadius: 99,
        background: 'linear-gradient(90deg, #a855f7, #7c3aed)',
        transition: 'width 1.2s ease',
      }} />
    </div>
  )
}

export default function RealTimePanel() {
  const { data: reviewData } = useManualReviewRate()
  const { data: overview } = useAnalyticsOverview()

  const metrics = [
    {
      label: 'Manual Review Rate',
      value: reviewData?.rate ?? 0,
      subtitle: reviewData ? `${reviewData.manual_review_count} of ${reviewData.total_students} students flagged` : 'Loading...',
    },
    {
      label: 'Orders In Progress',
      value: overview && overview.total_orders > 0
        ? Math.round(((overview.pending_orders) / overview.total_orders) * 100)
        : 0,
      subtitle: overview ? `${overview.pending_orders} pending of ${overview.total_orders} total` : 'Loading...',
    },
    {
      label: 'Active Operators',
      value: overview && overview.active_operators > 0
        ? Math.min(overview.active_operators * 10, 99)
        : 0,
      subtitle: overview ? `${overview.active_operators} operators online` : 'Loading...',
    },
  ]

  return (
    <div style={{
      width: 280, minWidth: 280, background: '#16162a',
      border: '1px solid #1e1e2e', borderRadius: 14, padding: 22,
      flexShrink: 0,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
        <ChartBarIcon />
        <span style={{ fontSize: 16, fontWeight: 700, color: '#f1f5f9' }}>Real-time AI</span>
        <div style={{
          width: 8, height: 8, borderRadius: '50%', background: '#22c55e',
          boxShadow: '0 0 6px #22c55e', marginLeft: 'auto',
          animation: 'kas-pulse 2s ease-in-out infinite',
        }} />
      </div>

      {/* Metrics */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
        {metrics.map(m => (
          <div key={m.label}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 13, color: '#d1d5db', fontWeight: 500 }}>{m.label}</span>
              <span style={{ fontSize: 13, color: '#a855f7', fontWeight: 700 }}>{m.value}%</span>
            </div>
            <AIProgressBar value={m.value} />
            {m.subtitle && (
              <p style={{ margin: '5px 0 0', fontSize: 10, color: '#4b5563', fontStyle: 'italic' }}>{m.subtitle}</p>
            )}
          </div>
        ))}
      </div>

      {/* Stats Row */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8,
        padding: 16, background: '#0f0f1a', borderRadius: 10,
        border: '1px solid #1e1e2e', marginBottom: 20,
      }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#f1f5f9' }}>
            {overview?.total_ids ?? '—'}
          </div>
          <div style={{ fontSize: 10, color: '#6b7280', fontWeight: 600, letterSpacing: '0.5px', marginTop: 2 }}>
            IDS PRODUCED
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#f97316' }}>
            {overview?.pending_orders ?? '—'}
          </div>
          <div style={{ fontSize: 10, color: '#6b7280', fontWeight: 600, letterSpacing: '0.5px', marginTop: 2 }}>
            PENDING
          </div>
        </div>
      </div>

      {/* System Health */}
      <div>
        <div style={{ fontSize: 10, color: '#6b7280', fontWeight: 700, letterSpacing: '1px', marginBottom: 12 }}>
          SYSTEM HEALTH
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { label: 'Active Institutions', value: String(overview?.active_institutions ?? '—'), color: '#22c55e' },
            { label: 'Active Operators',    value: String(overview?.active_operators ?? '—'),    color: '#f1f5f9', bold: true },
            { label: 'Total Orders',        value: String(overview?.total_orders ?? '—'),        color: '#d1d5db' },
          ].map(item => (
            <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: '#9ca3af' }}>{item.label}</span>
              <span style={{ fontSize: 13, color: item.color, fontWeight: item.bold ? 700 : 500 }}>{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
