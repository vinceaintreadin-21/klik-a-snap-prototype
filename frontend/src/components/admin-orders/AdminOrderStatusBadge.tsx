interface Config {
  bg: string; border: string; text: string; dot: string
}

const statusConfig: Record<string, Config> = {
  PENDING:    { bg: '#1a1a2e', border: '#6366f1', text: '#818cf8', dot: '#6366f1' },
  PROCESSING: { bg: '#1a1a2e', border: '#a855f7', text: '#c084fc', dot: '#a855f7' },
  PROOFING:   { bg: '#1e1a2e', border: '#8b5cf6', text: '#a78bfa', dot: '#8b5cf6' },
  APPROVED:   { bg: '#0d2218', border: '#22c55e', text: '#4ade80', dot: '#22c55e' },
  PRINTING:   { bg: '#1f1a0d', border: '#f97316', text: '#fb923c', dot: '#f97316' },
  COMPLETED:  { bg: '#0d2218', border: '#22c55e', text: '#4ade80', dot: '#22c55e' },
  CANCELLED:  { bg: '#2d1515', border: '#ef4444', text: '#f87171', dot: '#ef4444' },
}

const AdminOrderStatusBadge = ({ status }: { status: string }) => {
  const cfg = statusConfig[status] ?? { bg: '#1e1e2e', border: '#4b5563', text: '#9ca3af', dot: '#4b5563' }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      background: cfg.bg, border: `1px solid ${cfg.border}`,
      borderRadius: 20, padding: '3px 10px', fontSize: 11, color: cfg.text, fontWeight: 600,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.dot, display: 'inline-block' }} />
      {status}
    </span>
  )
}

export default AdminOrderStatusBadge
