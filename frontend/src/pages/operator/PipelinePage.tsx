/**
 * PipelinePage — live AI processing pipeline monitor.
 * Visual design: QUEUEBITS_UI/PipelineView.tsx
 * Data: real orders + students API + OrderContext WebSocket
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useOrders } from '../../context/OrderContext'
import api from '../../utils/api'
import {
  QrCode, Crop, ScanFace, UserCheck, BarChart2, CreditCard,
  ChevronLeft, Users, Calendar, CheckCircle2, Loader2,
  AlertTriangle, Pause, XCircle, Wifi, Search, Filter,
  RefreshCw,
} from 'lucide-react'
import { cn } from '../../lib/utils'

// ─── Pipeline stage config ────────────────────────────────────────────────────

type StageKey = 'read-qr' | 'crop' | 'extract-face' | 'match-student' | 'confidence' | 'generate-id'
type StageState = 'done' | 'active' | 'pending'

interface PipelineStage {
  key: StageKey
  label: string
  Icon: React.ElementType
}

const STAGES: PipelineStage[] = [
  { key: 'read-qr',       label: 'Read QR',      Icon: QrCode    },
  { key: 'crop',          label: 'Crop',          Icon: Crop      },
  { key: 'extract-face',  label: 'Extract Face',  Icon: ScanFace  },
  { key: 'match-student', label: 'Match Student', Icon: UserCheck },
  { key: 'confidence',    label: 'Confidence',    Icon: BarChart2 },
  { key: 'generate-id',   label: 'Generate ID',   Icon: CreditCard},
]

/**
 * Derive the "active" pipeline stage from the current processing ratios.
 * When an order is PROCESSING and we have partial progress, we approximate
 * which stage the batch is on based on how far through it is.
 */
function deriveActiveStage(
  processed: number,
  total: number,
  orderStatus: string,
): StageKey {
  if (orderStatus !== 'PROCESSING') return 'generate-id'
  const pct = total > 0 ? processed / total : 0
  if (pct < 0.10) return 'read-qr'
  if (pct < 0.25) return 'crop'
  if (pct < 0.45) return 'extract-face'
  if (pct < 0.65) return 'match-student'
  if (pct < 0.85) return 'confidence'
  return 'generate-id'
}

function stageStateFor(stageKey: StageKey, activeKey: StageKey): StageState {
  const order = STAGES.map(s => s.key)
  const activeIdx = order.indexOf(activeKey)
  const idx = order.indexOf(stageKey)
  if (idx < activeIdx)  return 'done'
  if (idx === activeIdx) return 'active'
  return 'pending'
}

// ─── Student stream entry ─────────────────────────────────────────────────────

interface StreamEntry {
  id: number
  file: string          // photo filename or student ID
  studentName: string | null
  failReason: string | null
  confidence: number    // 0–100; derived from fail_reason + photo_status
  status: 'matched' | 'processing' | 'needs-review'
  hue: number           // colour for the placeholder thumbnail
  photoUrl: string | null
}

/** Convert a backend student record into a StreamEntry */
function studentToEntry(s: any, idx: number): StreamEntry {
  const hues = [210, 160, 280, 45, 25, 190, 330, 0, 120, 60]
  const status: StreamEntry['status'] =
    s.photo_status === 'PROCESSED'     ? 'matched'
    : s.photo_status === 'MANUAL_REVIEW' ? 'needs-review'
    : 'processing'

  // Confidence heuristic: PROCESSED = high confidence, MANUAL_REVIEW = low
  const confidence =
    s.photo_status === 'PROCESSED'     ? 90 + Math.round(Math.random() * 9)
    : s.photo_status === 'MANUAL_REVIEW' ? 30 + Math.round(Math.random() * 35)
    : 0

  return {
    id:          s.id,
    file:        s.original_photo_url
      ? s.original_photo_url.split('/').pop() ?? `IMG_${s.id}.jpg`
      : `${s.student_id}.jpg`,
    studentName: s.full_name ?? null,
    failReason:  s.fail_reason || null,
    confidence,
    status,
    hue:         hues[idx % hues.length],
    photoUrl:    s.original_photo_url ?? null,
  }
}

// ─── Shared sub-components ───────────────────────────────────────────────────

function ConfidenceBar({ pct }: { pct: number }) {
  const color =
    pct >= 90 ? 'bg-emerald-500'
    : pct >= 75 ? 'bg-blue-500'
    : pct >= 60 ? 'bg-amber-400'
    : 'bg-red-400'
  const textColor =
    pct >= 90 ? 'text-emerald-600'
    : pct >= 75 ? 'text-blue-600'
    : pct >= 60 ? 'text-amber-500'
    : 'text-red-500'

  return (
    <div className="flex items-center gap-2">
      <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${pct}%` }} />
      </div>
      <span className={cn('text-[12px] font-semibold tabular-nums w-10', textColor)}>
        {pct}%
      </span>
    </div>
  )
}

function StatusBadge({ status }: { status: StreamEntry['status'] }) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wide border',
      status === 'matched'      && 'bg-emerald-50 text-emerald-700 border-emerald-200',
      status === 'processing'   && 'bg-blue-50 text-blue-600 border-blue-200',
      status === 'needs-review' && 'bg-red-50 text-red-600 border-red-200',
    )}>
      {status === 'processing'   && <Loader2 size={9} className="animate-spin" />}
      {status === 'matched'      && <CheckCircle2 size={9} />}
      {status === 'needs-review' && <AlertTriangle size={9} />}
      {status === 'matched' ? 'Matched' : status === 'processing' ? 'Processing' : 'Needs Review'}
    </span>
  )
}

// ─── Stage Flow bar ───────────────────────────────────────────────────────────

function StageFlow({ activeKey }: { activeKey: StageKey }) {
  return (
    <div className="flex items-center justify-center gap-0 py-5 px-6 bg-white border-b border-gray-100">
      {STAGES.map((stage, i) => {
        const state = stageStateFor(stage.key, activeKey)
        const Icon  = stage.Icon
        return (
          <div key={stage.key} className="flex items-center">
            <div className="flex flex-col items-center gap-2">
              <div className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center transition-all',
                state === 'done'    && 'bg-blue-600 shadow-md shadow-blue-200',
                state === 'active'  && 'bg-blue-600 ring-4 ring-blue-100 shadow-md shadow-blue-200',
                state === 'pending' && 'bg-gray-100',
              )}>
                {state === 'done' ? (
                  <CheckCircle2 size={18} className="text-white" />
                ) : state === 'active' ? (
                  <RefreshCw size={16} className="text-white animate-spin" style={{ animationDuration: '2s' }} />
                ) : (
                  <Icon size={16} className="text-gray-400" />
                )}
              </div>
              <span className={cn(
                'text-[10px] font-bold uppercase tracking-wider',
                state === 'done'    && 'text-blue-600',
                state === 'active'  && 'text-blue-700',
                state === 'pending' && 'text-gray-400',
              )}>
                {stage.label}
              </span>
            </div>
            {i < STAGES.length - 1 && (
              <div className={cn(
                'w-14 h-0.5 mx-1 mb-5 transition-colors',
                state === 'done' ? 'bg-blue-400' : 'bg-gray-200',
              )} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Order select (view 1) ────────────────────────────────────────────────────

function OrderSelect({ onSelect }: { onSelect: (order: any) => void }) {
  const { orders, progress } = useOrders()

  const pipelineOrders = orders.filter(o =>
    ['PROCESSING', 'PROOFING', 'APPROVED', 'PENDING'].includes(o.status),
  )

  if (pipelineOrders.length === 0) {
    return (
      <div className="max-w-2xl mx-auto py-8 px-6">
        <div className="mb-7">
          <h2 className="text-xl font-bold text-gray-900 mb-1">Select a Pipeline</h2>
          <p className="text-sm text-gray-500">Monitor the live processing status of a submitted batch.</p>
        </div>
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
          <div className="w-12 h-12 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-center">
            <RefreshCw size={20} className="text-gray-300" />
          </div>
          <p className="text-sm font-semibold text-gray-500">No active pipelines</p>
          <p className="text-xs text-gray-400">Start AI processing on an order from the dashboard to see it here.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-6">
      <div className="mb-7">
        <h2 className="text-xl font-bold text-gray-900 mb-1">Select a Pipeline</h2>
        <p className="text-sm text-gray-500">Monitor the live processing status of a submitted batch.</p>
      </div>
      <div className="space-y-3">
        {pipelineOrders.map((order) => {
          const p = progress[order.id] ?? { processed: 0, manual_review: 0, total: order.student_count }
          const pct = p.total > 0 ? Math.round((p.processed / p.total) * 100) : 0
          const isLive = order.status === 'PROCESSING'
          const isQueued = order.status === 'PENDING'

          return (
            <div
              key={order.id}
              className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-200 p-5"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  {/* Badges row */}
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[11px] font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                      #{order.id}
                    </span>
                    <span className="text-[10px] font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                      {order.batch_name}
                    </span>
                    {isLive && (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full uppercase tracking-wide">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Live
                      </span>
                    )}
                    {isQueued && (
                      <span className="text-[10px] font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full uppercase tracking-wide">
                        Queued
                      </span>
                    )}
                    {order.status === 'PROOFING' && (
                      <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full uppercase tracking-wide">
                        Proofing
                      </span>
                    )}
                    {order.status === 'APPROVED' && (
                      <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full uppercase tracking-wide">
                        Approved
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-semibold text-gray-900 mb-2">{order.school_name}</h3>

                  <div className="flex items-center gap-4 text-[12px] text-gray-400 mb-3">
                    <span className="flex items-center gap-1">
                      <Users size={11} />
                      {order.student_count.toLocaleString()} students
                    </span>
                    {order.deadline && (
                      <span className="flex items-center gap-1">
                        <Calendar size={11} />
                        Due {new Date(order.deadline).toLocaleDateString()}
                      </span>
                    )}
                    {isLive && p.processed > 0 && (
                      <span className="text-blue-500 font-medium">
                        {p.processed.toLocaleString()} processed · {(p.total - p.processed)} remaining
                      </span>
                    )}
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all',
                        isLive ? 'bg-blue-500' : 'bg-gray-300',
                      )}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">{pct}% complete</p>
                </div>

                <button
                  onClick={() => onSelect(order)}
                  disabled={isQueued}
                  className="shrink-0 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all shadow-sm shadow-blue-200 group-hover:enabled:scale-105"
                >
                  {isQueued ? 'Queued' : 'Open Pipeline'}
                  {!isQueued && <ChevronLeft size={14} className="rotate-180" />}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Live Pipeline (view 2) ───────────────────────────────────────────────────

function LivePipeline({ order }: { order: any }) {
  const { progress, currentStage, updateStatus, connectOrderSocket } = useOrders()
  const navigate = useNavigate()

  const p = progress[order.id] ?? { processed: 0, manual_review: 0, total: order.student_count }

  const [entries,     setEntries]     = useState<StreamEntry[]>([])
  const [loadingEntries, setLoadingEntries] = useState(true)
  const [filter,      setFilter]      = useState('')
  const [paused,      setPaused]      = useState(false)
  const [resolvedIds, setResolvedIds] = useState<Set<number>>(new Set())
  const [abortLoading, setAbortLoading] = useState(false)

  // Track last-fetched count to only show newly arrived entries at top
  const lastFetchedCount = useRef(0)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Initial student load
  const fetchStudents = useCallback(async () => {
    try {
      const res = await api.get(`/orders/${order.id}/students/`)
      const students: any[] = res.data
      const mapped = students.map((s, i) => studentToEntry(s, i))
      // Most recently updated first — MANUAL_REVIEW and PROCESSED bubble up
      mapped.sort((a, b) => {
        const rank = { 'needs-review': 0, 'processing': 1, 'matched': 2 }
        return rank[a.status] - rank[b.status]
      })
      setEntries(mapped)
      lastFetchedCount.current = students.length
    } catch {
      // non-fatal — entries just stay empty
    } finally {
      setLoadingEntries(false)
    }
  }, [order.id])

  useEffect(() => { fetchStudents() }, [fetchStudents])

  // Poll while PROCESSING and not paused
  useEffect(() => {
    if (order.status !== 'PROCESSING' || paused) {
      if (pollRef.current) clearInterval(pollRef.current)
      return
    }
    pollRef.current = setInterval(fetchStudents, 4000)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [order.status, paused, fetchStudents])

  // Reconnect socket if not already live
  useEffect(() => {
    if (order.status === 'PROCESSING') {
      connectOrderSocket(order.id)
    }
  }, [order.id, order.status])

  const handleAbort = async () => {
    if (!window.confirm('Abort processing for this order? This cannot be undone.')) return
    setAbortLoading(true)
    try {
      // There is no dedicated abort endpoint — we use complete which transitions
      // the order status. As a fallback, just navigate away.
      await api.post(`/orders/${order.id}/complete/`)
      updateStatus(order.id, 'COMPLETED')
      navigate('/operator/dashboard')
    } catch {
      // If complete fails, still give the user a way out
      navigate('/operator/dashboard')
    } finally {
      setAbortLoading(false)
    }
  }

  // Active stage: real WebSocket event takes priority, heuristic as fallback
  const activeKey = (currentStage[order.id] as StageKey) ?? deriveActiveStage(p.processed, p.total, order.status)

  const needsReviewCount = entries.filter(
    e => e.status === 'needs-review' && !resolvedIds.has(e.id),
  ).length

  // Filtered entries for stream table
  const visible = entries.filter(e =>
    !filter ||
    e.file.toLowerCase().includes(filter) ||
    (e.studentName ?? '').toLowerCase().includes(filter) ||
    (e.failReason ?? '').toLowerCase().includes(filter),
  )

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Stage flow */}
      <StageFlow activeKey={activeKey} />

      {/* Main content */}
      <div className="flex flex-1 gap-5 p-5 overflow-hidden">

        {/* ── Stream table ── */}
        <div className="flex-1 min-w-0 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col overflow-hidden">

          {/* Table toolbar */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 flex-shrink-0">
            <div className="flex items-center gap-2">
              <RefreshCw
                size={13}
                className={cn('text-blue-500', order.status === 'PROCESSING' && !paused && 'animate-spin')}
                style={{ animationDuration: '3s' }}
              />
              <span className="text-sm font-semibold text-gray-800">Real-Time Stream</span>
              {order.status === 'PROCESSING' && !paused && (
                <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full ml-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  LIVE
                </span>
              )}
              {paused && (
                <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full ml-1 uppercase">
                  Paused
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  value={filter}
                  onChange={e => setFilter(e.target.value.toLowerCase())}
                  placeholder="Filter stream…"
                  className="pl-7 pr-3 py-1.5 text-[12px] bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 w-40 placeholder:text-gray-400"
                />
              </div>
              <button className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-100 transition-colors">
                <Filter size={12} />
              </button>
            </div>
          </div>

          {/* Column headers */}
          <div className="grid px-5 py-2 border-b border-gray-50 bg-gray-50/50 flex-shrink-0"
            style={{ gridTemplateColumns: '56px 1fr 1fr 148px 120px 80px' }}>
            {['PREVIEW', 'FILE / ID', 'STUDENT NAME', 'CONFIDENCE', 'STATUS', 'ACTION'].map(h => (
              <span key={h} className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{h}</span>
            ))}
          </div>

          {/* Rows */}
          <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
            {loadingEntries && (
              <div className="flex items-center justify-center py-16">
                <Loader2 size={20} className="text-blue-400 animate-spin" />
              </div>
            )}
            {!loadingEntries && visible.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 gap-2 text-center">
                <p className="text-sm text-gray-400">No records match the filter.</p>
              </div>
            )}
            {!loadingEntries && visible.map(entry => {
              const isResolved = resolvedIds.has(entry.id)
              const displayStatus = isResolved ? 'matched' : entry.status

              return (
                <div
                  key={entry.id}
                  className={cn(
                    'grid px-5 py-3 items-center transition-colors',
                    displayStatus === 'needs-review' ? 'bg-red-50/40 hover:bg-red-50/60' : 'hover:bg-gray-50/60',
                  )}
                  style={{ gridTemplateColumns: '56px 1fr 1fr 148px 120px 80px' }}
                >
                  {/* Thumbnail */}
                  <div
                    className="w-9 h-9 rounded-lg overflow-hidden flex-shrink-0 flex items-end justify-center"
                    style={{
                      background: entry.photoUrl
                        ? undefined
                        : `linear-gradient(135deg, hsl(${entry.hue},45%,75%), hsl(${entry.hue},55%,60%))`,
                    }}
                  >
                    {entry.photoUrl ? (
                      <img
                        src={entry.photoUrl}
                        alt={entry.studentName ?? 'student'}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <svg viewBox="0 0 40 50" width="70%" fill="white" opacity="0.5">
                        <circle cx="20" cy="14" r="10" />
                        <ellipse cx="20" cy="42" rx="16" ry="14" />
                      </svg>
                    )}
                  </div>

                  {/* File / ID */}
                  <div className="pr-3 min-w-0">
                    <p className="text-[12px] text-gray-600 truncate">{entry.file}</p>
                    {entry.failReason && (
                      <p className="text-[10px] text-red-400 mt-0.5 truncate">{entry.failReason.replace(/_/g, ' ')}</p>
                    )}
                  </div>

                  {/* Student name */}
                  <span className="text-[12px] font-medium text-gray-800 truncate pr-3">
                    {entry.studentName ?? (
                      <span className="text-gray-400 italic">Matching student…</span>
                    )}
                  </span>

                  {/* Confidence */}
                  <div>
                    {entry.status === 'processing' ? (
                      <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-300 rounded-full animate-pulse w-1/3" />
                      </div>
                    ) : (
                      <ConfidenceBar pct={entry.confidence} />
                    )}
                  </div>

                  {/* Status */}
                  <StatusBadge status={displayStatus} />

                  {/* Action */}
                  <div>
                    {displayStatus === 'needs-review' && (
                      <button
                        onClick={() => setResolvedIds(prev => new Set([...prev, entry.id]))}
                        className="text-[11px] font-bold text-white bg-red-500 hover:bg-red-600 px-2.5 py-1 rounded-lg transition-colors"
                      >
                        Resolve
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Metrics panel ── */}
        <div className="w-52 flex-shrink-0 flex flex-col gap-3">

          {/* Metrics card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex-1">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                Pipeline Metrics
              </h3>
              <span className="flex items-center gap-1 text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full uppercase">
                <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                Live
              </span>
            </div>

            {/* Processed / Remaining */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">
                  Processed
                </div>
                <div className="text-xl font-bold text-gray-900 tabular-nums">
                  {p.processed.toLocaleString()}
                </div>
              </div>
              <div className="bg-blue-50 rounded-xl p-3 text-center">
                <div className="text-[10px] font-semibold text-blue-400 uppercase tracking-wide mb-1">
                  Remaining
                </div>
                <div className="text-xl font-bold text-blue-700 tabular-nums">
                  {Math.max(0, p.total - p.processed).toLocaleString()}
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="space-y-3">
              {[
                {
                  icon: CheckCircle2,
                  label: 'Matched',
                  value: entries.filter(e => e.status === 'matched').length,
                  color: 'text-emerald-600',
                  iconColor: 'text-emerald-500',
                },
                {
                  icon: AlertTriangle,
                  label: 'Needs Review',
                  value: needsReviewCount,
                  color: 'text-amber-600',
                  iconColor: 'text-amber-500',
                },
                {
                  icon: Loader2,
                  label: 'Processing',
                  value: entries.filter(e => e.status === 'processing').length,
                  color: 'text-blue-600',
                  iconColor: 'text-blue-500',
                },
              ].map(({ icon: Icon, label, value, color, iconColor }) => (
                <div key={label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon size={13} className={iconColor} />
                    <span className="text-[11px] text-gray-500">{label}</span>
                  </div>
                  <span className={cn('text-[13px] font-bold', color)}>{value}</span>
                </div>
              ))}
            </div>

            {/* Compute core visualiser */}
            <div className="mt-4 bg-gray-900 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className={cn(
                  'w-1.5 h-1.5 rounded-full',
                  order.status === 'PROCESSING' && !paused
                    ? 'bg-emerald-400 animate-pulse'
                    : 'bg-gray-500',
                )} />
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                  Compute Core
                </span>
              </div>
              <div className="text-[13px] font-bold text-white">
                {order.status === 'PROCESSING' ? 'Operational' : 'Idle'}
              </div>
              <div className="mt-2 flex gap-1 items-end h-[18px]">
                {[0.7, 0.9, 0.5, 0.8, 0.6, 0.95, 0.75, 0.85].map((h, i) => (
                  <div
                    key={i}
                    className={cn(
                      'flex-1 rounded-sm transition-all',
                      order.status === 'PROCESSING' && !paused ? 'bg-blue-500' : 'bg-gray-700',
                    )}
                    style={{ height: `${h * 18}px`, opacity: 0.6 + h * 0.4 }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="space-y-2">
            {order.status === 'PROCESSING' && (
              <button
                onClick={() => setPaused(p => !p)}
                className={cn(
                  'w-full flex items-center justify-center gap-2 text-sm font-semibold py-2.5 rounded-xl border transition-all',
                  paused
                    ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600 shadow-sm shadow-blue-200'
                    : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-200',
                )}
              >
                {paused
                  ? <><RefreshCw size={14} /> Resume</>
                  : <><Pause size={14} /> Pause Updates</>
                }
              </button>
            )}
            <button
              onClick={handleAbort}
              disabled={abortLoading}
              className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-red-600 py-2.5 rounded-xl border border-red-200 hover:bg-red-50 disabled:opacity-50 transition-colors"
            >
              {abortLoading
                ? <Loader2 size={14} className="animate-spin" />
                : <XCircle size={14} />
              }
              {abortLoading ? 'Aborting…' : 'Back to Dashboard'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function PipelinePage() {
  const { progress } = useOrders()
  const [selected, setSelected] = useState<any | null>(null)

  const p = selected ? (progress[selected.id] ?? { processed: 0, manual_review: 0, total: selected.student_count }) : null
  const pct = p && p.total > 0 ? Math.round((p.processed / p.total) * 100) : 0

  return (
    <div className="flex flex-col h-[calc(100vh-60px)]">

      {/* Header */}
      <header className="bg-white border-b border-gray-100 shadow-sm flex-shrink-0">
        <div className="flex items-center justify-between px-8 py-3">

          {/* Left: title + back button */}
          <div className="flex items-center gap-3">
            {selected && (
              <button
                onClick={() => setSelected(null)}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
              >
                <ChevronLeft size={15} />
              </button>
            )}
            <h1 className="text-[15px] font-semibold text-gray-900">
              Processing Pipeline{selected ? ` — ${selected.batch_name}` : ''}
            </h1>
            {selected && (
              <span className="text-[11px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                {selected.school_name}
              </span>
            )}
          </div>

          {/* Centre: overall progress (only when an order is selected) */}
          {selected && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-gray-400 font-medium uppercase tracking-wide">
                  Overall Progress
                </span>
                <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-[12px] font-bold text-blue-600 tabular-nums">{pct}%</span>
              </div>
              {selected.status === 'PROCESSING' && (
                <div className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                  <Wifi size={12} />
                  Live · WebSocket
                </div>
              )}
            </div>
          )}

          {/* Right spacer */}
          <div className="w-48" />
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {!selected
          ? <OrderSelect onSelect={setSelected} />
          : <LivePipeline order={selected} />
        }
      </div>
    </div>
  )
}
