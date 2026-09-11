import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ChevronRight, ChevronLeft, SlidersHorizontal,
  ChevronDown, CalendarDays, RefreshCw,
} from 'lucide-react'
import { useProcessingLogs } from '../hooks/useLogs'
import { cn } from '../lib/utils'
import {
  logInitials, logAvatarStyle, fmtDate,
  LEVEL_CFG, LOG_PER_PAGE,
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

const ProcessingLogsPage = () => {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [level,  setLevel]  = useState('')
  const [from,   setFrom]   = useState('')
  const [to,     setTo]     = useState('')
  const [page,   setPage]   = useState(1)

  const { data: allData, loading, error, refetch } = useProcessingLogs({
    level:     level || undefined,
    date_from: from  || undefined,
    date_to:   to    || undefined,
  })

  const filtered = useMemo(() => {
    if (!search) return allData
    const q = search.toLowerCase()
    return allData.filter((l) =>
      String(l.order_id).includes(q) ||
      l.message.toLowerCase().includes(q) ||
      (l.created_by ?? '').toLowerCase().includes(q),
    )
  }, [allData, search])

  const pageData     = filtered.slice((page - 1) * LOG_PER_PAGE, page * LOG_PER_PAGE)
  const errorCount   = allData.filter((l) => l.level === 'ERROR' || l.level === 'CRITICAL').length
  const warningCount = allData.filter((l) => l.level === 'WARNING').length

  const hasFilter = search || level || from || to
  const clear = () => { setSearch(''); setLevel(''); setFrom(''); setTo(''); setPage(1) }

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
          <span className="text-[#004ac6] font-medium">Processing Logs</span>
        </div>
        <h1 className="text-[24px] font-bold text-[#0b1c30] tracking-tight">Processing Logs</h1>
        <p className="text-[13px] text-[#64748b]">
          Order processing events, errors, and system messages.
        </p>
      </div>

      {/* Summary pills */}
      <div className="flex items-center gap-3 flex-wrap">
        {[
          { label: `${allData.length} Total`,   color: 'bg-[#f1f5f9] text-[#64748b]' },
          { label: `${errorCount} Errors`,       color: 'bg-[#fee2e2] text-[#b91c1c]' },
          { label: `${warningCount} Warnings`,   color: 'bg-[#fff7ed] text-[#c2410c]' },
        ].map((p) => (
          <span key={p.label} className={cn('px-3 py-1 rounded-full text-[12px] font-semibold', p.color)}>
            {p.label}
          </span>
        ))}
      </div>

      {/* Filter bar */}
      <div className="bg-white border border-[#e2e8f0] rounded-xl shadow-sm">
        <div className="flex items-center gap-3 p-4 flex-wrap">
          <div className="relative flex-1 min-w-[220px]">
            <SlidersHorizontal size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8] pointer-events-none" />
            <input
              type="text"
              placeholder="Search by order ID, message, or user…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-lg pl-9 pr-4 py-2.5 text-[14px] text-[#0b1c30] placeholder-[#94a3b8] focus:outline-none focus:border-[#004ac6]"
            />
          </div>

          <div className="relative">
            <select value={level} onChange={(e) => { setLevel(e.target.value); setPage(1) }}
              className="appearance-none bg-[#f8fafc] border border-[#e2e8f0] rounded-lg pl-3 pr-8 py-2.5 text-[13px] text-[#0b1c30] cursor-pointer focus:outline-none focus:border-[#004ac6]">
              <option value="">All Levels</option>
              {['INFO', 'WARNING', 'ERROR', 'CRITICAL'].map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
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
            <p className="text-[13px] text-[#64748b]">Loading logs…</p>
          </div>
        ) : error ? (
          <div className="py-10 text-center text-[13px] text-red-600">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="py-14 text-center text-[14px] text-[#64748b]">No logs match your filters.</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] border-collapse">
                <thead>
                  <tr className="bg-[#f8fafc] border-b border-[#f1f5f9]">
                    <th className="text-left px-6 py-3 text-[11px] font-bold text-[#64748b] tracking-[0.55px] uppercase w-[160px]">Timestamp</th>
                    <th className="text-left px-4 py-3 text-[11px] font-bold text-[#64748b] tracking-[0.55px] uppercase w-[90px]">Level</th>
                    <th className="text-left px-4 py-3 text-[11px] font-bold text-[#64748b] tracking-[0.55px] uppercase w-[80px]">Order</th>
                    <th className="text-left px-4 py-3 text-[11px] font-bold text-[#64748b] tracking-[0.55px] uppercase">Message</th>
                    <th className="text-left px-4 py-3 text-[11px] font-bold text-[#64748b] tracking-[0.55px] uppercase w-[140px]">Created By</th>
                    <th className="text-right px-6 py-3 text-[11px] font-bold text-[#64748b] tracking-[0.55px] uppercase w-[80px]">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {pageData.map((log) => {
                    const { date, time } = fmtDate(log.created_at)
                    const cfg = LEVEL_CFG[log.level] ?? LEVEL_CFG['INFO']
                    return (
                      <tr key={log.id} className="border-t border-[#f1f5f9] hover:bg-[#f8fafc] transition-colors">
                        <td className="px-6 py-4">
                          <div className="text-[13px] font-semibold text-[#0b1c30]">{date}</div>
                          <div className="text-[11px] text-[#64748b] mt-0.5">{time}</div>
                        </td>
                        <td className="px-4 py-4">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold"
                            style={{ background: cfg.bg, color: cfg.text }}>
                            <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.dot }} />
                            {log.level}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-[13px] font-mono text-[#004ac6]">#{log.order_id}</span>
                        </td>
                        <td className="px-4 py-4 max-w-[320px]">
                          <p className="text-[13px] text-[#0b1c30] leading-snug line-clamp-2">{log.message}</p>
                        </td>
                        <td className="px-4 py-4">
                          {log.created_by ? (
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-white text-[9px] font-bold"
                                style={logAvatarStyle(log.created_by)}>
                                {logInitials(log.created_by)}
                              </div>
                              <span className="text-[12px] text-[#0b1c30] truncate">{log.created_by}</span>
                            </div>
                          ) : (
                            <span className="text-[12px] text-[#94a3b8] italic">System</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {log.details ? (
                            <button className="text-[12px] font-medium text-[#004ac6] hover:underline">
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

export default ProcessingLogsPage
