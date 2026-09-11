import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ChevronRight, ChevronLeft, SlidersHorizontal,
  ChevronDown, CalendarDays, RefreshCw,
} from 'lucide-react'
import { useAuditLogs } from '../hooks/useLogs'
import { cn } from '../lib/utils'
import {
  logInitials, logAvatarStyle, fmtDate,
  actionColor, moduleBadge, LOG_PER_PAGE,
} from '../lib/logUtils'

// ── Pager ──────────────────────────────────────────────────────────────────────

function Pager({ total, page, onPage }: { total: number; page: number; onPage: (p: number) => void }) {
  const totalPages = Math.max(1, Math.ceil(total / LOG_PER_PAGE))
  const from = (page - 1) * LOG_PER_PAGE + 1
  const to   = Math.min(page * LOG_PER_PAGE, total)
  return (
    <div className="bg-[#f8fafc] border-t border-[#f1f5f9] flex items-center justify-between px-6 py-3.5">
      <span className="text-[12px] text-[#64748b]">
        Showing <span className="text-[#0b1c30] font-medium">{from}–{to}</span> of{' '}
        <span className="text-[#0b1c30] font-medium">{total}</span>
      </span>
      <div className="flex items-center gap-1.5">
        <button onClick={() => onPage(Math.max(1, page - 1))} disabled={page === 1}
          className="w-7 h-7 flex items-center justify-center rounded border border-[#e2e8f0] disabled:opacity-40 hover:bg-white transition-colors">
          <ChevronLeft size={11} className="text-[#434655]" />
        </button>
        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p) => (
          <button key={p} onClick={() => onPage(p)}
            className={cn('w-7 h-7 flex items-center justify-center rounded text-[12px] font-medium transition-colors',
              page === p ? 'bg-[#004ac6] text-white' : 'text-[#434655] hover:bg-white border border-transparent hover:border-[#e2e8f0]')}>
            {p}
          </button>
        ))}
        {totalPages > 5 && <span className="text-[#94a3b8] text-[12px]">…</span>}
        <button onClick={() => onPage(Math.min(totalPages, page + 1))} disabled={page === totalPages}
          className="w-7 h-7 flex items-center justify-center rounded border border-[#e2e8f0] disabled:opacity-40 hover:bg-white transition-colors">
          <ChevronRight size={11} className="text-[#434655]" />
        </button>
      </div>
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────────

const AuditLogPage = () => {
  const navigate = useNavigate()
  const [search,      setSearch]      = useState('')
  const [actionF,     setActionF]     = useState('')
  const [targetModel, setTargetModel] = useState('')
  const [from,        setFrom]        = useState('')
  const [to,          setTo]          = useState('')
  const [page,        setPage]        = useState(1)

  const { data, loading, error, refetch } = useAuditLogs({
    action:       actionF     || undefined,
    target_model: targetModel || undefined,
    date_from:    from        || undefined,
    date_to:      to          || undefined,
  })

  const filtered = useMemo(() => {
    if (!search) return data
    const q = search.toLowerCase()
    return data.filter((l) =>
      (l.admin_user ?? '').toLowerCase().includes(q) ||
      l.action.toLowerCase().includes(q) ||
      l.target_model.toLowerCase().includes(q) ||
      String(l.target_id).includes(q),
    )
  }, [data, search])

  const pageData = filtered.slice((page - 1) * LOG_PER_PAGE, page * LOG_PER_PAGE)
  const actions  = useMemo(() => [...new Set(data.map((l) => l.action))].sort(), [data])
  const models   = useMemo(() => [...new Set(data.map((l) => l.target_model))].sort(), [data])

  const hasFilter = search || actionF || targetModel || from || to
  const clear = () => { setSearch(''); setActionF(''); setTargetModel(''); setFrom(''); setTo(''); setPage(1) }

  return (
    <div className="flex flex-col gap-5">

      {/* Header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-1.5 text-[12px]">
          <button onClick={() => navigate('/admin/dashboard')} className="text-[#64748b] hover:text-[#004ac6] transition-colors">
            Dashboard
          </button>
          <ChevronRight size={10} className="text-[#94a3b8]" />
          <span className="text-[#64748b]">Logs</span>
          <ChevronRight size={10} className="text-[#94a3b8]" />
          <span className="text-[#004ac6] font-medium">Audit Log</span>
        </div>
        <h1 className="text-[24px] font-bold text-[#0b1c30] tracking-tight">Audit Log</h1>
        <p className="text-[13px] text-[#64748b]">
          Permanent record of all admin actions — overrides, assignments, and account changes.
        </p>
      </div>

      {/* Summary pill */}
      <div className="flex items-center gap-3">
        <span className="px-3 py-1 rounded-full text-[12px] font-semibold bg-[#f1f5f9] text-[#64748b]">
          {data.length} entries
        </span>
      </div>

      {/* Filter bar */}
      <div className="bg-white border border-[#e2e8f0] rounded-xl shadow-sm">
        <div className="flex items-center gap-3 p-4 flex-wrap">
          <div className="relative flex-1 min-w-[220px]">
            <SlidersHorizontal size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8] pointer-events-none" />
            <input
              type="text"
              placeholder="Search by admin, action, model, or ID…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-lg pl-9 pr-4 py-2.5 text-[14px] text-[#0b1c30] placeholder-[#94a3b8] focus:outline-none focus:border-[#004ac6]"
            />
          </div>

          <div className="relative">
            <select value={actionF} onChange={(e) => { setActionF(e.target.value); setPage(1) }}
              className="appearance-none bg-[#f8fafc] border border-[#e2e8f0] rounded-lg pl-3 pr-8 py-2.5 text-[13px] text-[#0b1c30] cursor-pointer focus:outline-none focus:border-[#004ac6]">
              <option value="">Action Type: All</option>
              {actions.map((a) => <option key={a} value={a}>{a.replace(/_/g, ' ')}</option>)}
            </select>
            <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6b7280] pointer-events-none" />
          </div>

          <div className="relative">
            <select value={targetModel} onChange={(e) => { setTargetModel(e.target.value); setPage(1) }}
              className="appearance-none bg-[#f8fafc] border border-[#e2e8f0] rounded-lg pl-3 pr-8 py-2.5 text-[13px] text-[#0b1c30] cursor-pointer focus:outline-none focus:border-[#004ac6]">
              <option value="">Module: All</option>
              {models.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
            <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6b7280] pointer-events-none" />
          </div>

          <div className="flex items-center gap-2 border border-[#e2e8f0] rounded-lg px-3 py-2.5 bg-[#f8fafc]">
            <CalendarDays size={13} className="text-[#94a3b8] shrink-0" />
            <input type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPage(1) }}
              className="text-[13px] text-[#0b1c30] bg-transparent focus:outline-none w-[120px]" />
            <span className="text-[#94a3b8] text-[12px]">–</span>
            <input type="date" value={to} onChange={(e) => { setTo(e.target.value); setPage(1) }}
              className="text-[13px] text-[#0b1c30] bg-transparent focus:outline-none w-[120px]" />
          </div>

          <button onClick={() => refetch()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#e2e8f0] text-[13px] text-[#434655] hover:bg-gray-50 transition-colors">
            <RefreshCw size={13} />
          </button>

          {hasFilter && (
            <button onClick={clear} className="text-[12px] font-semibold text-[#004ac6] hover:underline">
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-[#e2e8f0] rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-14 flex flex-col items-center gap-3">
            <div className="w-7 h-7 border-2 border-[#004ac6] border-t-transparent rounded-full animate-spin" />
            <p className="text-[13px] text-[#64748b]">Loading audit log…</p>
          </div>
        ) : error ? (
          <div className="py-10 text-center text-[13px] text-red-600">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="py-14 text-center text-[14px] text-[#64748b]">No audit entries match your filters.</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] border-collapse">
                <thead>
                  <tr className="bg-[#f8fafc] border-b border-[#f1f5f9]">
                    <th className="text-left px-6 py-3 text-[11px] font-bold text-[#64748b] tracking-[0.55px] uppercase w-[180px]">Timestamp</th>
                    <th className="text-left px-4 py-3 text-[11px] font-bold text-[#64748b] tracking-[0.55px] uppercase w-[200px]">Admin User</th>
                    <th className="text-left px-4 py-3 text-[11px] font-bold text-[#64748b] tracking-[0.55px] uppercase">Action</th>
                    <th className="text-left px-4 py-3 text-[11px] font-bold text-[#64748b] tracking-[0.55px] uppercase w-[120px]">Module</th>
                    <th className="text-left px-4 py-3 text-[11px] font-bold text-[#64748b] tracking-[0.55px] uppercase w-[80px]">Target ID</th>
                    <th className="text-right px-6 py-3 text-[11px] font-bold text-[#64748b] tracking-[0.55px] uppercase w-[80px]">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {pageData.map((log) => {
                    const { date, time } = fmtDate(log.created_at)
                    const aColor  = actionColor(log.action)
                    const mBadge  = moduleBadge(log.target_model)
                    return (
                      <tr key={log.id} className="border-t border-[#f1f5f9] hover:bg-[#f8fafc] transition-colors">
                        <td className="px-6 py-4">
                          <div className="text-[13px] font-semibold text-[#0b1c30]">{date}</div>
                          <div className="text-[11px] text-[#64748b] mt-0.5">{time}</div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white text-[10px] font-bold"
                              style={logAvatarStyle(log.admin_user)}>
                              {logInitials(log.admin_user)}
                            </div>
                            <div>
                              <div className="text-[13px] font-medium text-[#0b1c30]">
                                {log.admin_user ?? 'System'}
                              </div>
                              <span className={cn(
                                'inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide',
                                log.admin_user ? 'bg-[#fee2e2] text-[#b91c1c]' : 'bg-[#e2e8f0] text-[#475569]',
                              )}>
                                {log.admin_user ? 'Admin' : 'System'}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: aColor }} />
                            <span className="text-[13px] text-[#0b1c30]">
                              {log.action.replace(/_/g, ' ')}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium"
                            style={{ background: mBadge.bg, color: mBadge.text }}>
                            {log.target_model}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-[13px] font-mono text-[#64748b]">#{log.target_id}</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {log.details && Object.keys(log.details).length > 0 ? (
                            <button
                              title={JSON.stringify(log.details, null, 2)}
                              className="text-[12px] font-medium text-[#004ac6] hover:underline"
                            >
                              View
                            </button>
                          ) : (
                            <span className="text-[12px] text-[#cbd5e1]">—</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <Pager total={filtered.length} page={page} onPage={setPage} />
          </>
        )}
      </div>
    </div>
  )
}

export default AuditLogPage
