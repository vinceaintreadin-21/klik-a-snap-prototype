import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Check, LayoutTemplate, ArrowRight, Loader2 } from 'lucide-react'
import { useStudentsForOrder } from '../../../hooks/useUploadPhotos'
import api from '../../../utils/api'
import { cn } from '../../../lib/utils'

import { PhotoViewer } from './PhotoViewer'
import { Filmstrip } from './Filmstrip'
import { QRLinkPanel } from './panels/QRLinkPanel'
import { QRConflictPanel } from './panels/QRConflictPanel'
import { CropPanel } from './panels/CropPanel'
import { NoLayoutPanel } from './panels/NoLayoutPanel'
import { ErrorRetryPanel } from './panels/ErrorRetryPanel'

import {
  type IssueType, type CropBox, ISSUE_LABELS, HUES, issueType
} from './types'

type FilterKey = 'all' | IssueType

const FILTER_TABS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'no_qr', label: 'No QR' },
  { key: 'qr_not_found', label: 'QR Not Found' },
  { key: 'no_face', label: 'No Face' },
  { key: 'no_layout', label: 'No Layout' },
  { key: 'error', label: 'Error' },
]

interface ReviewInterfaceProps {
  order: any
  onBack: () => void
}

export function ReviewInterface({ order, onBack }: ReviewInterfaceProps) {
  const { students, loading } = useStudentsForOrder(order.id)
  const navigate = useNavigate()

  const [filter, setFilter] = useState<FilterKey>('all')
  const [currentIdx, setCurrentIdx] = useState(0)
  const [resolvedIds, setResolvedIds] = useState<Set<number>>(new Set())
  const [rejectedIds, setRejectedIds] = useState<Set<number>>(new Set())
  const [crop, setCrop] = useState<CropBox>({ x: 20, y: 8, w: 60, h: 72 })

  const reviewStudents = useMemo(
    () => students.filter(s =>
      s.photo_status === 'MANUAL_REVIEW' ||
      (s.photo_status === 'PENDING' && !s.original_photo_url)
    ),
    [students],
  )

  const filtered = useMemo(() => {
    if (filter === 'all') return reviewStudents
    return reviewStudents.filter(s => s.fail_reason === filter)
  }, [reviewStudents, filter])

  const tabCounts = useMemo(() => {
    const c: Partial<Record<IssueType, number>> = {}
    reviewStudents.forEach(s => {
      const t = issueType(s)
      c[t] = (c[t] ?? 0) + 1
    })
    return c
  }, [reviewStudents])

  const unresolved = filtered.filter(s => !resolvedIds.has(s.id) && !rejectedIds.has(s.id))
  const current = unresolved[0] ?? filtered[currentIdx]

  const handleResolved = () => {
    if (!current) return
    setResolvedIds(prev => new Set([...prev, current.id]))
    setCrop({ x: 20, y: 8, w: 60, h: 72 })
    if (currentIdx < filtered.length - 1) setCurrentIdx(i => i + 1)
  }

  const handleReject = async () => {
    if (!current) return
    try {
      await api.post(`/students/${current.id}/request-revision/`, { reason: 'rejected' })
    } catch { /* non-fatal */ }
    setRejectedIds(prev => new Set([...prev, current.id]))
    setCrop({ x: 20, y: 8, w: 60, h: 72 })
    if (currentIdx < filtered.length - 1) setCurrentIdx(i => i + 1)
  }

  const resolvedCount = resolvedIds.size + rejectedIds.size

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#0f1117]">
        <Loader2 size={24} className="text-blue-400 animate-spin" />
      </div>
    )
  }

  if (!loading && unresolved.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 bg-[#0f1117] text-white">
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
          <Check size={28} className="text-emerald-400" />
        </div>
        <div className="text-lg font-semibold">
          {filter === 'all' ? 'All items resolved' : `All ${ISSUE_LABELS[filter as IssueType]} items resolved`}
        </div>
        <div className="flex gap-2">
          {filter !== 'all' && (
            <button onClick={() => { setFilter('all'); setCurrentIdx(0) }}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-sm font-medium transition-colors">
              View all issues
            </button>
          )}
          <button onClick={onBack}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-sm font-medium transition-colors">
            Back to orders
          </button>
        </div>
      </div>
    )
  }

  const hue = HUES[currentIdx % HUES.length]
  const issue = issueType(current)

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <header className="flex items-center gap-3 px-5 py-3 bg-[#16181f] border-b border-white/8 shrink-0 flex-wrap gap-y-2">
        <button onClick={onBack}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-white/50 hover:text-white/90 hover:bg-white/10 transition-colors shrink-0">
          <ChevronLeft size={18} />
        </button>
        <div className="shrink-0">
          <h1 className="text-sm font-semibold text-white leading-none">Manual Review</h1>
          <p className="text-[10px] text-white/40 mt-0.5">{order.school_name}</p>
        </div>

        <div className="flex items-center gap-1 overflow-x-auto ml-4">
          {FILTER_TABS.map(tab => {
            const count = tab.key === 'all' ? reviewStudents.length : tabCounts[tab.key as IssueType] ?? 0
            if (tab.key !== 'all' && count === 0) return null
            return (
              <button key={tab.key}
                onClick={() => { setFilter(tab.key); setCurrentIdx(0) }}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-colors whitespace-nowrap',
                  filter === tab.key ? 'bg-blue-600 text-white' : 'text-white/50 hover:text-white hover:bg-white/10',
                )}>
                {tab.label}
                <span className={cn(
                  'text-[10px] rounded-full px-1.5 py-0.5 font-bold',
                  filter === tab.key ? 'bg-white/20 text-white' : 'bg-white/10 text-white/40',
                )}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        <div className="ml-auto flex items-center gap-2 shrink-0">
          <div className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-[11px] text-white/60">
            <span className="font-bold text-white">{resolvedCount}</span>/{reviewStudents.length} resolved
          </div>
          <button onClick={() => setCurrentIdx(i => Math.max(0, i - 1))} disabled={currentIdx === 0}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-white/50 hover:text-white disabled:opacity-25 hover:bg-white/10 transition-colors">
            <ChevronLeft size={16} />
          </button>
          <span className="text-[11px] text-white/50 min-w-[72px] text-center tabular-nums">
            {currentIdx + 1} / {filtered.length}
          </span>
          <button onClick={() => setCurrentIdx(i => Math.min(filtered.length - 1, i + 1))} disabled={currentIdx === filtered.length - 1}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-white/50 hover:text-white disabled:opacity-25 hover:bg-white/10 transition-colors">
            <ChevronRight size={16} />
          </button>
        </div>
      </header>

      {issue === 'no_layout' && (
        <div className="mx-6 mt-4 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-4 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
            <LayoutTemplate size={18} className="text-amber-600" />
          </div>
          <div className="flex-1">
            <div className="text-[13px] font-semibold text-amber-900 mb-0.5">No layout configured for this order</div>
            <p className="text-[12px] text-amber-700 leading-snug">
              ID cards cannot be generated until a layout is saved. Go to Layout Builder, save the layout, then re-trigger processing.
            </p>
          </div>
          <button
            onClick={() => navigate('/operator/layout-builder')}
            className="shrink-0 flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white text-[12px] font-semibold px-3 py-2 rounded-xl transition-all whitespace-nowrap">
            <LayoutTemplate size={12} />
            Layout Builder
            <ArrowRight size={12} />
          </button>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        <PhotoViewer
          key={`photo-${current.id}`}
          student={current}
          hue={hue}
          cropEnabled={issue === 'no_face'}
          crop={crop}
          onCropChange={setCrop}
        />

        {issue === 'no_qr' && (
          <QRLinkPanel key={`panel-${current.id}`} orderId={order.id} student={current} onResolved={handleResolved} onReject={handleReject} />
        )}
        {issue === 'qr_not_found' && (
          <QRConflictPanel key={`panel-${current.id}`} orderId={order.id} student={current} onResolved={handleResolved} onReject={handleReject} />
        )}
        {issue === 'no_face' && (
          <CropPanel key={`panel-${current.id}`} orderId={order.id} student={current} crop={crop} onResolved={handleResolved} onReject={handleReject} />
        )}
        {issue === 'no_layout' && (
          <NoLayoutPanel key={`panel-${current.id}`} onReject={handleReject} />
        )}
        {issue === 'error' && (
          <ErrorRetryPanel key={`panel-${current.id}`} orderId={order.id} student={current} onResolved={handleResolved} onReject={handleReject} />
        )}
      </div>

      <Filmstrip
        students={filtered}
        resolvedIds={resolvedIds}
        rejectedIds={rejectedIds}
        currentIdx={currentIdx}
        onSelect={setCurrentIdx}
      />
    </div>
  )
}