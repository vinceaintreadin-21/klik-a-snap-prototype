const STATUS_CFG: Record<string, { bg: string; dot: string; text: string }> = {
  PENDING:    { bg: '#f1f5f9', dot: '#64748b', text: '#475569' },
  PROCESSING: { bg: '#e0f2fe', dot: '#0369a1', text: '#0369a1' },
  PROOFING:   { bg: '#fff7ed', dot: '#c2410c', text: '#c2410c' },
  APPROVED:   { bg: '#dcfce7', dot: '#166534', text: '#166534' },
  PRINTING:   { bg: '#ede9fe', dot: '#6d28d9', text: '#6d28d9' },
  COMPLETED:  { bg: '#dcfce7', dot: '#166534', text: '#166534' },
  CANCELLED:  { bg: '#fee2e2', dot: '#b91c1c', text: '#b91c1c' },
}

const AdminOrderStatusBadge = ({ status }: { status: string }) => {
  const cfg = STATUS_CFG[status] ?? STATUS_CFG['PENDING']
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-semibold whitespace-nowrap"
      style={{ background: cfg.bg, color: cfg.text }}
    >
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: cfg.dot }} />
      {status}
    </span>
  )
}

export default AdminOrderStatusBadge
export { STATUS_CFG }
