import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ClipboardList, AlertTriangle, Printer, CheckCircle2,
  Search, ArrowUpDown,
  ChevronLeft, ChevronRight, ExternalLink,
  LayoutTemplate, Upload, Eye,
} from 'lucide-react'
import { useOrders }   from '../context/OrderContext'
import { useAuth }     from '../context/AuthContext'
import api             from '../utils/api'
import LayoutConfigModal      from '../components/LayoutConfigModal'
import UploadPhotosModal      from '../components/UploadPhotosModal'
import ManualReviewQueueModal from '../components/ManualReviewQueueModal'
import GenerateTestPhotosButton from '../components/GenerateTestPhotosButton'
import { cn } from '../lib/utils'

// ── Status config (maps backend status → QUEUEBITS stage pill) ─────────────────

const STATUS_CFG: Record<string, { label: string; className: string }> = {
  PENDING:    { label: 'Pending',    className: 'bg-gray-100 text-gray-600 border-gray-200'       },
  PROCESSING: { label: 'Processing', className: 'bg-blue-50 text-blue-700 border-blue-200'        },
  PROOFING:   { label: 'Proofing',   className: 'bg-amber-50 text-amber-700 border-amber-200'     },
  APPROVED:   { label: 'Approved',   className: 'bg-emerald-50 text-emerald-700 border-emerald-200'},
  PRINTING:   { label: 'Printing',   className: 'bg-violet-50 text-violet-700 border-violet-200'  },
  COMPLETED:  { label: 'Completed',  className: 'bg-emerald-50 text-emerald-700 border-emerald-200'},
  CANCELLED:  { label: 'Cancelled',  className: 'bg-red-50 text-red-700 border-red-200'           },
}

// ── Stat card ──────────────────────────────────────────────────────────────────

function StatCard({
  icon, iconBg, label, value, sublabel, badge, highlight,
}: {
  icon: React.ReactNode
  iconBg: string
  label: string
  value: string
  sublabel?: string
  badge?: { text: string; color: string }
  highlight?: boolean
}) {
  return (
    <div className={cn(
      'relative bg-white rounded-2xl p-5 flex flex-col gap-3 shadow-sm border transition-all duration-200 hover:shadow-md',
      highlight ? 'border-amber-300 ring-2 ring-amber-100' : 'border-gray-100',
    )}>
      <div className="flex items-start justify-between">
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', iconBg)}>
          {icon}
        </div>
        {badge && (
          <span className={cn('text-[11px] font-semibold px-2 py-1 rounded-full flex items-center gap-1', badge.color)}>
            {badge.text}
          </span>
        )}
        {sublabel && !badge && (
          <span className="text-[11px] text-gray-400 font-medium">{sublabel}</span>
        )}
      </div>
      <div>
        <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider leading-none mb-2">
          {label}
        </div>
        <div className="text-[32px] font-bold text-gray-900 leading-none tabular-nums">{value}</div>
      </div>
      {highlight && (
        <div className="absolute top-3 right-3">
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            Action Required
          </span>
        </div>
      )}
    </div>
  )
}

// ── Progress bar cell ──────────────────────────────────────────────────────────

function ProgressCell({ processed, total, status }: { processed: number; total: number; status: string }) {
  const pct = total > 0 ? Math.round((processed / total) * 100) : 0
  const color =
    status === 'COMPLETED' ? 'bg-emerald-500' :
    status === 'PROOFING'  ? 'bg-amber-400'   :
    status === 'PRINTING'  ? 'bg-violet-500'   :
    'bg-blue-500'

  return (
    <div className="space-y-1.5 min-w-[120px]">
      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[11px] text-gray-400">
        {total > 0 ? `${processed} / ${total} processed` : `${total} students`}
      </span>
    </div>
  )
}

// ── Main dashboard ─────────────────────────────────────────────────────────────

const PER_PAGE = 10

const OperatorDashboard = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { orders, progress, updateStatus, connectOrderSocket } = useOrders()

  // Layout / upload / review modal state
  const [layoutOrderId, setLayoutOrderId]   = useState<number | null>(null)
  const [uploadOrder,   setUploadOrder]     = useState<any | null>(null)
  const [reviewOrder,   setReviewOrder]     = useState<any | null>(null)
  const [ordersWithLayout, setOrdersWithLayout] = useState<Set<number>>(new Set())

  // Table filter / pagination
  const [query,   setQuery]   = useState('')
  const [sortKey, setSortKey] = useState<'deadline' | 'status' | 'students' | ''>('')
  const [page,    setPage]    = useState(1)

  // Check which orders have a layout configured
  useEffect(() => {
    orders.forEach(async (order) => {
      try {
        await api.get(`/orders/${order.id}/layout/`)
        setOrdersWithLayout((prev) => new Set(prev).add(order.id))
      } catch { /* no layout */ }
    })
  }, [orders])

  // ── Action handlers (preserved from legacy) ────────────────────────────────

  const handleStartAI = async (id: number) => {
    try {
      try {
        await api.get(`/orders/${id}/layout/`)
      } catch (layoutErr: any) {
        if (layoutErr.response?.status === 404) {
          const go = window.confirm(
            'No layout configured for this order.\n\nClick OK to open the Layout editor, then run AI after saving.',
          )
          if (go) { setLayoutOrderId(id) }
          return
        }
      }
      await api.post(`/orders/${id}/process/`)
      updateStatus(id, 'PROCESSING')
      connectOrderSocket(id)
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to start AI engine.')
    }
  }

  const handleCompleteOrder = async (id: number) => {
    if (!window.confirm('Are you sure you want to proceed?')) return
    try {
      const res = await api.post(`/orders/${id}/complete/`)
      const newStatus = res.data.message?.includes('PRINTING') ? 'PRINTING' : 'COMPLETED'
      updateStatus(id, newStatus)
      alert(res.data.message)
    } catch (err: any) {
      alert(err.response?.data?.error || 'Cannot complete order yet.')
    }
  }

  // ── Derived stats ──────────────────────────────────────────────────────────

  const inProgress     = orders.filter((o) => ['PENDING','PROCESSING','PROOFING'].includes(o.status)).length
  const needsReview    = orders.filter((o) => (progress[o.id]?.manual_review ?? 0) > 0).length
  const readyToPrint   = orders.filter((o) => o.status === 'APPROVED').length
  const completedCount = orders.filter((o) => o.status === 'COMPLETED').length

  // ── Filtered + sorted table data ────────────────────────────────────────────

  const filtered = useMemo(() => {
    const q = query.toLowerCase()
    let list = q
      ? orders.filter((o) =>
          String(o.id).includes(q) ||
          (o.school_name ?? '').toLowerCase().includes(q) ||
          (o.batch_name  ?? '').toLowerCase().includes(q) ||
          (o.status      ?? '').toLowerCase().includes(q),
        )
      : [...orders]

    if (sortKey === 'students') list.sort((a, b) => b.student_count - a.student_count)
    if (sortKey === 'status')   list.sort((a, b) => (a.status ?? '').localeCompare(b.status ?? ''))
    if (sortKey === 'deadline') list.sort((a, b) => {
      if (!a.deadline) return 1
      if (!b.deadline) return -1
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
    })

    return list
  }, [orders, query, sortKey])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const pageData   = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  const cycleSortKey = () => {
    setSortKey((k) => k === '' ? 'deadline' : k === 'deadline' ? 'status' : k === 'status' ? 'students' : '')
    setPage(1)
  }

  return (
    <div className="px-8 py-7 space-y-6 max-w-[1400px] w-full">

      {/* Page header */}
      <div>
        <h1 className="text-[22px] font-bold text-gray-900 leading-none tracking-tight">
          Operator Workspace
        </h1>
        <p className="text-[13px] text-gray-400 mt-1">
          Welcome back, <span className="font-semibold text-gray-600">{user?.username}</span>.
          You have <span className="font-semibold text-gray-800">{inProgress}</span> order{inProgress !== 1 ? 's' : ''} in progress.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<ClipboardList size={18} className="text-blue-600" />}
          iconBg="bg-blue-50"
          label="Orders in Progress"
          value={String(inProgress)}
          badge={inProgress > 0 ? { text: `${inProgress} active`, color: 'text-blue-600 bg-blue-50' } : undefined}
        />
        <StatCard
          icon={<AlertTriangle size={18} className="text-amber-500" />}
          iconBg="bg-amber-50"
          label="Pending Manual Reviews"
          value={String(needsReview).padStart(2, '0')}
          highlight={needsReview > 0}
        />
        <StatCard
          icon={<Printer size={18} className="text-violet-600" />}
          iconBg="bg-violet-50"
          label="Ready to Print"
          value={String(readyToPrint)}
          sublabel={readyToPrint > 0 ? 'Queued' : undefined}
        />
        <StatCard
          icon={<CheckCircle2 size={18} className="text-emerald-600" />}
          iconBg="bg-emerald-50"
          label="Completed"
          value={completedCount.toLocaleString()}
          sublabel="Total"
        />
      </div>

      {/* Orders table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

        {/* Table header */}
        <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-gray-100">
          <div className="shrink-0">
            <h2 className="text-base font-semibold text-gray-900">My Assigned Orders</h2>
            <p className="text-[12px] text-gray-400 mt-0.5">
              {query
                ? `${filtered.length} result${filtered.length !== 1 ? 's' : ''} found`
                : `Showing ${pageData.length} of ${orders.length} orders`}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-1 justify-end">
            <div className="relative w-56">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search orders…"
                value={query}
                onChange={(e) => { setQuery(e.target.value); setPage(1) }}
                className="w-full pl-8 pr-3 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 placeholder:text-gray-400 transition-all"
              />
            </div>
            <button
              onClick={cycleSortKey}
              className={cn(
                'inline-flex items-center gap-1.5 text-sm border rounded-lg px-3 py-1.5 transition-colors',
                sortKey
                  ? 'text-blue-700 bg-blue-50 border-blue-200'
                  : 'text-gray-500 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 border-gray-200',
              )}
            >
              <ArrowUpDown size={13} />
              {sortKey ? `Sort: ${sortKey}` : 'Sort'}
            </button>
          </div>
        </div>

        {/* Table */}
        {orders.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-3">
              <ClipboardList size={20} className="text-gray-300" />
            </div>
            <p className="text-[14px] font-semibold text-gray-500">No orders assigned yet</p>
            <p className="text-[12px] text-gray-400 mt-1">Orders will appear here once assigned to you.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50/60">
                  {['Order ID', 'School / Batch', 'Status', 'Students', 'Progress', 'Deadline', 'Actions'].map((col) => (
                    <th key={col} className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-6 py-3">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {pageData.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-10 text-center text-sm text-gray-400">
                      No orders match &ldquo;{query}&rdquo;
                    </td>
                  </tr>
                ) : pageData.map((order) => {
                  const p      = progress[order.id] ?? { processed: 0, manual_review: 0, total: order.student_count }
                  const cfg    = STATUS_CFG[order.status] ?? STATUS_CFG['PENDING']
                  const hasLayout   = ordersWithLayout.has(order.id)
                  const isProcessing = order.status === 'PROCESSING'
                  const isDeadlineSoon = order.deadline && (() => {
                    const diff = new Date(order.deadline).getTime() - Date.now()
                    return diff > 0 && diff < 2 * 24 * 60 * 60 * 1000
                  })()

                  return (
                    <tr key={order.id} className="hover:bg-blue-50/30 transition-colors duration-100 group">

                      {/* Order ID */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-[12px] font-medium text-blue-600 flex items-center gap-1 group-hover:underline cursor-pointer">
                          #{order.id}
                          <ExternalLink size={10} className="opacity-0 group-hover:opacity-60 transition-opacity" />
                        </span>
                      </td>

                      {/* School / batch */}
                      <td className="px-6 py-4 min-w-[180px]">
                        <div className="text-sm font-medium text-gray-800 leading-snug">{order.school_name}</div>
                        <div className="text-[11px] text-gray-400 mt-0.5">{order.batch_name}</div>
                      </td>

                      {/* Status pill */}
                      <td className="px-6 py-4">
                        <span className={cn(
                          'inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide',
                          cfg.className,
                        )}>
                          {cfg.label}
                        </span>
                      </td>

                      {/* Students */}
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-700 tabular-nums">{order.student_count.toLocaleString()}</span>
                      </td>

                      {/* Progress bar */}
                      <td className="px-6 py-4">
                        <ProgressCell
                          processed={p.processed}
                          total={p.total || order.student_count}
                          status={order.status}
                        />
                        {p.manual_review > 0 && (
                          <div className="mt-1 text-[11px] text-amber-600 font-medium">
                            {p.manual_review} need review
                          </div>
                        )}
                      </td>

                      {/* Deadline */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {order.deadline ? (
                          <span className={cn(
                            'text-sm font-medium',
                            isDeadlineSoon ? 'text-red-500 font-semibold' : 'text-gray-600',
                          )}>
                            {new Date(order.deadline).toLocaleDateString()}
                          </span>
                        ) : (
                          <span className="text-[12px] text-gray-300">—</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 flex-wrap">

                          {/* Layout */}
                          <button
                            onClick={() => setLayoutOrderId(order.id)}
                            title="Configure layout"
                            className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all"
                          >
                            <LayoutTemplate size={12} />
                            Layout
                          </button>

                          {/* Upload photos */}
                          {['PENDING', 'FAILED', 'PROOFING'].includes(order.status) && (
                            <>
                              <GenerateTestPhotosButton
                                orderId={order.id}
                                orderName={`${order.school_name}_${order.batch_name}`}
                              />
                              <button
                                onClick={() => setUploadOrder(order)}
                                className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all"
                              >
                                <Upload size={12} />
                                Photos
                              </button>
                            </>
                          )}

                          {/* Manual review */}
                          {p.manual_review > 0 && (
                            <button
                              onClick={() => setReviewOrder(order)}
                              className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg bg-amber-500 text-white hover:bg-amber-600 shadow-sm transition-all"
                            >
                              <AlertTriangle size={12} />
                              Review ({p.manual_review})
                            </button>
                          )}

                          {/* Run AI */}
                          {!['APPROVED', 'PRINTING', 'COMPLETED', 'CANCELLED'].includes(order.status) && (
                            <button
                              disabled={isProcessing}
                              onClick={() => handleStartAI(order.id)}
                              className={cn(
                                'inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg text-white shadow-sm transition-all',
                                isProcessing
                                  ? 'bg-gray-300 cursor-not-allowed'
                                  : hasLayout
                                  ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'
                                  : 'bg-orange-500 hover:bg-orange-600',
                              )}
                              title={!hasLayout ? 'No layout configured — click to set one up first' : ''}
                            >
                              {isProcessing ? 'Running…' : hasLayout ? 'Run AI' : '⚠ Run AI'}
                            </button>
                          )}

                          {/* Send to print */}
                          {order.status === 'APPROVED' && (
                            <button
                              onClick={() => handleCompleteOrder(order.id)}
                              className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg bg-amber-500 text-white hover:bg-amber-600 shadow-sm transition-all"
                            >
                              <Printer size={12} />
                              Send to Print
                            </button>
                          )}

                          {/* Mark complete */}
                          {order.status === 'PRINTING' && (
                            <button
                              onClick={() => handleCompleteOrder(order.id)}
                              className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm transition-all"
                            >
                              <CheckCircle2 size={12} />
                              Mark Complete
                            </button>
                          )}

                          {/* View proofing */}
                          {order.status === 'PROOFING' && (
                            <button
                              onClick={() => navigate('/operator/proofing')}
                              className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm transition-all"
                            >
                              <Eye size={12} />
                              Proof
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {filtered.length > PER_PAGE && (
          <div className="flex items-center justify-between px-6 py-3.5 border-t border-gray-100 bg-gray-50/40">
            <span className="text-[12px] text-gray-400">
              Showing {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filtered.length)} of {filtered.length}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="w-7 h-7 flex items-center justify-center rounded-md border border-gray-200 text-gray-400 hover:text-gray-700 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={13} />
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={cn(
                    'w-7 h-7 flex items-center justify-center rounded-md text-xs font-medium transition-all',
                    page === p
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-200'
                      : 'text-gray-500 hover:bg-white hover:text-gray-700 border border-transparent hover:border-gray-200',
                  )}
                >
                  {p}
                </button>
              ))}
              {totalPages > 5 && <span className="text-gray-400 text-xs">…</span>}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="w-7 h-7 flex items-center justify-center rounded-md border border-gray-200 text-gray-400 hover:text-gray-700 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={13} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {layoutOrderId !== null && (
        <LayoutConfigModal
          orderId={layoutOrderId}
          onClose={() => setLayoutOrderId(null)}
        />
      )}
      {uploadOrder && (
        <UploadPhotosModal
          order={uploadOrder}
          onClose={() => setUploadOrder(null)}
          onSuccess={() => setUploadOrder(null)}
        />
      )}
      {reviewOrder && (
        <ManualReviewQueueModal
          order={reviewOrder}
          onClose={() => setReviewOrder(null)}
          onSuccess={() => setReviewOrder(null)}
        />
      )}
    </div>
  )
}

export default OperatorDashboard
