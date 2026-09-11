/**
 * ManualReviewPage — operator manual review workspace.
 * Visual design: QUEUEBITS_UI/ManualReviewView.tsx
 * Data: real API — useStudentsForOrder, useManualLinkPhoto, manual-crop, request-revision
 */

import { useState, useMemo, useRef, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useOrders } from '../../context/OrderContext'
import { useStudentsForOrder } from '../../hooks/useUploadPhotos'
import api from '../../utils/api'
import {
  ChevronLeft, ChevronRight, Search, ZoomIn, ZoomOut,
  RotateCcw, RotateCw, Maximize2, Check, X, AlertTriangle,
  RefreshCw, Users, Clock, QrCode, ScanFace, LayoutTemplate,
  Bug, Upload, ArrowRight, Move, ChevronDown, Info, Loader2,
} from 'lucide-react'
import { cn } from '../../lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

type IssueType = 'no_qr' | 'qr_not_found' | 'no_face' | 'no_layout' | 'error'

interface ReviewStudent {
  id: number
  student_id: string
  full_name: string
  grade_level: string
  photo_status: string
  fail_reason: string
  original_photo_url?: string | null | undefined
  processed_photo_url?: string | null
}

interface CropBox { x: number; y: number; w: number; h: number }

// ─── Constants ────────────────────────────────────────────────────────────────

const ISSUE_LABELS: Record<IssueType, string> = {
  no_qr:        'No QR Code',
  qr_not_found: 'QR Not Found',
  no_face:      'No Face Detected',
  no_layout:    'No Layout',
  error:        'Processing Error',
}

const ISSUE_COLORS: Record<IssueType, string> = {
  no_qr:        'text-red-400 bg-red-900/30 border-red-700/40',
  qr_not_found: 'text-orange-400 bg-orange-900/30 border-orange-700/40',
  no_face:      'text-slate-400 bg-slate-800/60 border-slate-600/40',
  no_layout:    'text-amber-400 bg-amber-900/30 border-amber-700/40',
  error:        'text-rose-400 bg-rose-900/30 border-rose-700/40',
}

const ISSUE_STRIP: Record<IssueType, string> = {
  no_qr:        '#ef4444',
  qr_not_found: '#f97316',
  no_face:      '#64748b',
  no_layout:    '#f59e0b',
  error:        '#f43f5e',
}

const HUES = [210, 350, 160, 40, 270, 15, 195, 310, 55, 130, 240, 180, 320, 95]

function issueType(s: ReviewStudent): IssueType {
  if (s.photo_status === 'PENDING' && !s.original_photo_url) return 'no_qr'
  const r = s.fail_reason as IssueType
  if (['no_qr', 'qr_not_found', 'no_face', 'no_layout', 'error'].includes(r)) return r
  return 'error'
}

// ─── Avatar placeholder ───────────────────────────────────────────────────────

function Avatar({ hue, size = 40 }: { hue: number; size?: number }) {
  return (
    <div
      className="rounded-lg overflow-hidden shrink-0 relative"
      style={{ width: size, height: size }}
    >
      <div
        className="absolute inset-0"
        style={{ background: `linear-gradient(135deg, hsl(${hue},55%,55%), hsl(${hue},60%,40%))` }}
      />
      <svg viewBox="0 0 40 50" width="70%"
        className="absolute bottom-0 left-1/2 -translate-x-1/2 opacity-30" fill="white">
        <circle cx="20" cy="14" r="10" />
        <ellipse cx="20" cy="44" rx="16" ry="14" />
      </svg>
    </div>
  )
}

// ─── Photo viewer ─────────────────────────────────────────────────────────────

function CropOverlay({ crop, onChange }: { crop: CropBox; onChange: (c: CropBox) => void }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{
    mode: 'move' | 'br' | 'tr' | 'bl' | 'tl'
    sx: number; sy: number; sc: CropBox
  } | null>(null)

  const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))

  const onMouseMove = useCallback((e: MouseEvent) => {
    if (!dragRef.current || !containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const dx = ((e.clientX - dragRef.current.sx) / rect.width) * 100
    const dy = ((e.clientY - dragRef.current.sy) / rect.height) * 100
    const sc = dragRef.current.sc
    const MIN = 15

    if (dragRef.current.mode === 'move') {
      onChange({ ...sc, x: clamp(sc.x + dx, 0, 100 - sc.w), y: clamp(sc.y + dy, 0, 100 - sc.h) })
    } else if (dragRef.current.mode === 'br') {
      onChange({ ...sc, w: clamp(sc.w + dx, MIN, 100 - sc.x), h: clamp(sc.h + dy, MIN, 100 - sc.y) })
    } else if (dragRef.current.mode === 'tr') {
      const newH = clamp(sc.h - dy, MIN, sc.y + sc.h)
      onChange({ ...sc, y: clamp(sc.y + dy, 0, sc.y + sc.h - MIN), w: clamp(sc.w + dx, MIN, 100 - sc.x), h: newH })
    } else if (dragRef.current.mode === 'bl') {
      const newW = clamp(sc.w - dx, MIN, sc.x + sc.w)
      onChange({ ...sc, x: clamp(sc.x + dx, 0, sc.x + sc.w - MIN), w: newW, h: clamp(sc.h + dy, MIN, 100 - sc.y) })
    } else if (dragRef.current.mode === 'tl') {
      const newW = clamp(sc.w - dx, MIN, sc.x + sc.w)
      const newH = clamp(sc.h - dy, MIN, sc.y + sc.h)
      onChange({ x: clamp(sc.x + dx, 0, sc.x + sc.w - MIN), y: clamp(sc.y + dy, 0, sc.y + sc.h - MIN), w: newW, h: newH })
    }
  }, [onChange])

  const onMouseUp = useCallback(() => { dragRef.current = null }, [])

  useEffect(() => {
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [onMouseMove, onMouseUp])

  type DragMode = 'move' | 'br' | 'tr' | 'bl' | 'tl'
  const startDrag = (mode: DragMode, e: React.MouseEvent) => {
    e.stopPropagation()
    dragRef.current = { mode, sx: e.clientX, sy: e.clientY, sc: { ...crop } }
  }

  const handle = 'absolute w-3 h-3 bg-white border-2 border-blue-500 rounded-sm z-20'

  return (
    <div ref={containerRef} className="absolute inset-0 z-10">
      {/* Vignette outside crop */}
      <div className="absolute inset-0 bg-black/50 pointer-events-none" style={{
        clipPath: `polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% ${crop.y}%, ${crop.x}% ${crop.y}%, ${crop.x}% ${crop.y + crop.h}%, ${crop.x + crop.w}% ${crop.y + crop.h}%, ${crop.x + crop.w}% ${crop.y}%, 0% ${crop.y}%)`,
      }} />
      {/* Crop box */}
      <div
        className="absolute border-2 border-white/80 cursor-move"
        style={{ left: `${crop.x}%`, top: `${crop.y}%`, width: `${crop.w}%`, height: `${crop.h}%` }}
        onMouseDown={(e) => startDrag('move', e)}
      >
        {/* Rule-of-thirds */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/3 left-0 right-0 h-px bg-white/20" />
          <div className="absolute top-2/3 left-0 right-0 h-px bg-white/20" />
          <div className="absolute left-1/3 top-0 bottom-0 w-px bg-white/20" />
          <div className="absolute left-2/3 top-0 bottom-0 w-px bg-white/20" />
        </div>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Move size={14} className="text-white/40" />
        </div>
      </div>
      {/* Corner handles */}
      <div className={cn(handle, 'cursor-nw-resize')} style={{ left: `${crop.x}%`, top: `${crop.y}%`, transform: 'translate(-50%,-50%)' }} onMouseDown={(e) => startDrag('tl', e)} />
      <div className={cn(handle, 'cursor-ne-resize')} style={{ left: `${crop.x + crop.w}%`, top: `${crop.y}%`, transform: 'translate(-50%,-50%)' }} onMouseDown={(e) => startDrag('tr', e)} />
      <div className={cn(handle, 'cursor-sw-resize')} style={{ left: `${crop.x}%`, top: `${crop.y + crop.h}%`, transform: 'translate(-50%,-50%)' }} onMouseDown={(e) => startDrag('bl', e)} />
      <div className={cn(handle, 'cursor-se-resize')} style={{ left: `${crop.x + crop.w}%`, top: `${crop.y + crop.h}%`, transform: 'translate(-50%,-50%)' }} onMouseDown={(e) => startDrag('br', e)} />
    </div>
  )
}

function PhotoViewer({
  student,
  hue,
  cropEnabled,
  crop,
  onCropChange,
}: {
  student: ReviewStudent
  hue: number
  cropEnabled?: boolean
  crop?: CropBox
  onCropChange?: (c: CropBox) => void
}) {
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const issue = issueType(student)

  const reset = () => { setZoom(1); setRotation(0) }

  return (
    <div className="flex-1 bg-[#0f1117] flex flex-col overflow-hidden">
      <div className="flex-1 flex items-center justify-center relative select-none p-6">
        {/* Issue badge */}
        <div className={cn(
          'absolute top-4 right-4 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold z-10',
          ISSUE_COLORS[issue],
        )}>
          <AlertTriangle size={11} />
          {ISSUE_LABELS[issue]}
        </div>

        {/* Photo / placeholder */}
        <div className="relative overflow-hidden rounded-sm shadow-2xl" style={{ width: 224, height: 288 }}>
          {student.original_photo_url ? (
            <img
              src={student.original_photo_url}
              alt={student.full_name}
              className="w-full h-full object-cover transition-transform duration-150"
              style={{ transform: `scale(${zoom}) rotate(${rotation}deg)` }}
            />
          ) : (
            <div
              className="w-full h-full relative transition-transform duration-150"
              style={{ transform: `scale(${zoom}) rotate(${rotation}deg)` }}
            >
              <div
                className="w-full h-full"
                style={{ background: `linear-gradient(160deg, hsl(${hue},35%,32%), hsl(${hue},45%,22%))` }}
              />
              <svg viewBox="0 0 40 50"
                className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 opacity-20" fill="white">
                <circle cx="20" cy="13" r="10" />
                <ellipse cx="20" cy="44" rx="16" ry="14" />
              </svg>
              <div className="absolute top-2 left-2 bg-black/40 text-white/60 text-[9px] font-mono px-1.5 py-0.5 rounded">
                {student.student_id}
              </div>
            </div>
          )}

          {/* Crop overlay */}
          {cropEnabled && crop && onCropChange && (
            <CropOverlay crop={crop} onChange={onCropChange} />
          )}

          {/* No-face scan overlay */}
          {issue === 'no_face' && !cropEnabled && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/55">
              <div className="w-14 h-14 rounded-full bg-gray-800/80 border border-gray-600 flex items-center justify-center">
                <ScanFace size={26} className="text-gray-400" />
              </div>
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">No face found</span>
            </div>
          )}
        </div>

        {/* Crop readout */}
        {cropEnabled && crop && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white/60 text-[10px] font-mono px-3 py-1 rounded-lg border border-white/10">
            Crop: {Math.round(crop.w)}% × {Math.round(crop.h)}% at ({Math.round(crop.x)}%, {Math.round(crop.y)}%)
          </div>
        )}
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-center gap-2 py-3 border-t border-white/5">
        {[
          { Icon: ZoomIn,    title: 'Zoom in',       action: () => setZoom(z => Math.min(3, z + 0.25)) },
          { Icon: ZoomOut,   title: 'Zoom out',      action: () => setZoom(z => Math.max(0.5, z - 0.25)) },
          { Icon: RotateCcw, title: 'Rotate left',   action: () => setRotation(r => r - 90) },
          { Icon: RotateCw,  title: 'Rotate right',  action: () => setRotation(r => r + 90) },
          { Icon: Maximize2, title: 'Fit to screen', action: reset },
        ].map(({ Icon, title, action }) => (
          <button key={title} title={title} onClick={action}
            className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/8 hover:bg-white/15 text-white/50 hover:text-white/90 transition-all">
            <Icon size={14} />
          </button>
        ))}
        {(zoom !== 1 || rotation !== 0) && (
          <span className="text-[10px] text-white/40 font-mono ml-1">
            {Math.round(zoom * 100)}% · {rotation}°
          </span>
        )}
      </div>
    </div>
  )
}

// ─── Right panel: QR Link (no_qr) ────────────────────────────────────────────

function QRLinkPanel({
  orderId,
  student,
  onResolved,
  onReject,
}: {
  orderId: number
  student: ReviewStudent
  onResolved: () => void
  onReject: () => void
}) {
  const [allStudents, setAllStudents] = useState<any[]>([])
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [photo, setPhoto] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    api.get(`/orders/${orderId}/students/`).then(r => setAllStudents(r.data)).catch(() => {})
  }, [orderId])

  const results = useMemo(() => {
    const q = query.toLowerCase()
    if (!q) return allStudents.slice(0, 8)
    return allStudents.filter(s =>
      s.full_name.toLowerCase().includes(q) ||
      s.student_id.toLowerCase().includes(q)
    )
  }, [allStudents, query])

  const selected = allStudents.find(s => s.id === selectedId)

  const handleConfirm = async () => {
    if (!selectedId) return
    setLoading(true)
    setError(null)
    try {
      const formData = new FormData()
      formData.append('student_id', String(selectedId))
      if (photo) {
        formData.append('photo', photo)
      } else if (student.original_photo_url) {
        // Re-link using existing photo URL by sending the student's current photo
        // The backend manual-link endpoint requires a file; fetch and re-upload
        const blob = await fetch(student.original_photo_url).then(r => r.blob())
        formData.append('photo', blob, `${student.student_id}.jpg`)
      }
      await api.post(`/orders/${orderId}/students/manual-link/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      await api.post(`/students/${selectedId}/process-linked/`)

      onResolved()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to link photo')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-[300px] bg-white border-l border-gray-100 flex flex-col overflow-hidden shrink-0">
      <div className="px-5 pt-5 pb-3 border-b border-gray-100">
        <div className="flex items-center gap-2 mb-1">
          <QrCode size={14} className="text-red-500" />
          <span className="text-[11px] font-bold text-gray-900 uppercase tracking-widest">Student Search & Link</span>
        </div>
        <p className="text-[12px] text-gray-400 leading-snug">
          No QR code detected. Find the correct student and link this photo to their record.
        </p>
      </div>

      <div className="px-5 py-4 flex-1 flex flex-col gap-3 overflow-hidden">
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by name or student ID…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 placeholder:text-gray-400 transition-all"
          />
        </div>

        <div className="flex-1 overflow-y-auto border border-gray-100 rounded-xl divide-y divide-gray-50 min-h-0">
          {results.length === 0 ? (
            <div className="py-6 text-center text-sm text-gray-400">No students found</div>
          ) : results.map((s, i) => (
            <button key={s.id} onClick={() => setSelectedId(s.id)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors',
                s.id === selectedId ? 'bg-blue-50' : 'hover:bg-gray-50',
              )}>
              <Avatar hue={HUES[i % HUES.length]} size={34} />
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-medium text-gray-900 truncate">{s.full_name}</div>
                <div className="text-[11px] text-gray-400">{s.grade_level} · {s.student_id}</div>
              </div>
              {s.id === selectedId && <Check size={14} className="text-blue-500 shrink-0" />}
            </button>
          ))}
        </div>

        {selected && (
          <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2.5">
            <Avatar hue={HUES[results.findIndex(s => s.id === selectedId) % HUES.length]} size={28} />
            <div className="flex-1 min-w-0">
              <div className="text-[12px] font-semibold text-blue-900 truncate">{selected.full_name}</div>
              <div className="text-[11px] text-blue-500">{selected.grade_level}</div>
            </div>
            <button onClick={() => setSelectedId(null)} className="text-blue-400 hover:text-blue-600">
              <X size={13} />
            </button>
          </div>
        )}

        {/* Optional: upload new photo */}
        <div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden"
            onChange={e => setPhoto(e.target.files?.[0] ?? null)} />
          <button onClick={() => fileRef.current?.click()}
            className="w-full text-[11px] text-gray-500 hover:text-gray-700 border border-dashed border-gray-200 hover:border-gray-300 rounded-lg py-2 transition-colors">
            {photo ? `📎 ${photo.name}` : 'Upload a new photo (optional)'}
          </button>
        </div>

        {error && <p className="text-[11px] text-red-500">{error}</p>}
      </div>

      <div className="px-5 py-4 border-t border-gray-100 space-y-2">
        <button onClick={handleConfirm} disabled={!selectedId || loading}
          className={cn(
            'w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all',
            selectedId && !loading
              ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-200'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed',
          )}>
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Check size={15} />}
          Confirm Link & Requeue
        </button>
        <button onClick={onReject}
          className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold border border-red-200 text-red-600 hover:bg-red-50 transition-all">
          <X size={13} />
          Reject Photo
        </button>
      </div>
    </div>
  )
}

// ─── Right panel: QR Conflict (qr_not_found) ─────────────────────────────────

function QRConflictPanel({
  orderId,
  student,
  onResolved,
  onReject,
}: {
  orderId: number
  student: ReviewStudent
  onResolved: () => void
  onReject: () => void
}) {
  const [allStudents, setAllStudents] = useState<any[]>([])
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.get(`/orders/${orderId}/students/`).then(r => setAllStudents(r.data)).catch(() => {})
  }, [orderId])

  const pending = useMemo(() => {
    const q = query.toLowerCase()
    const pool = allStudents
    if (!q) return pool
    return pool.filter(s =>
      s.full_name.toLowerCase().includes(q) || s.student_id.toLowerCase().includes(q)
    )
  }, [allStudents, query, student.id])

  const selected = allStudents.find(s => s.id === selectedId)

  const handleResolve = async () => {
    if (!selectedId) return
    setLoading(true)
    setError(null)
    try {
      const formData = new FormData()
      formData.append('student_id', String(selectedId))
      if (student.original_photo_url) {
        const blob = await fetch(student.original_photo_url).then(r => r.blob())
        formData.append('photo', blob, `${student.student_id}.jpg`)
      }
      await api.post(`/orders/${orderId}/students/manual-link/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      await api.post(`/students/${selectedId}/process-linked/`)
      onResolved()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to resolve')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-[300px] bg-white border-l border-gray-100 flex flex-col overflow-hidden shrink-0">
      <div className="px-5 pt-5 pb-3 border-b border-gray-100">
        <div className="flex items-center gap-2 mb-1">
          <QrCode size={14} className="text-orange-500" />
          <span className="text-[11px] font-bold text-gray-900 uppercase tracking-widest">QR Conflict Resolver</span>
        </div>
        <p className="text-[12px] text-gray-400 leading-snug">
          QR was decoded but matched no student in this order.
        </p>
      </div>

      {/* Decoded QR */}
      <div className="mx-5 mt-4 p-3 bg-orange-50 border border-orange-100 rounded-xl">
        <div className="flex items-center gap-1.5 mb-1">
          <QrCode size={11} className="text-orange-400" />
          <span className="text-[10px] font-bold text-orange-600 uppercase tracking-widest">Decoded QR Value</span>
        </div>
        <code className="text-sm font-mono font-bold text-orange-900 break-all">
          {student.fail_reason === 'qr_not_found' ? 'QR data not in order' : student.student_id}
        </code>
        <p className="text-[11px] text-orange-500 mt-1">No student record matches this code.</p>
      </div>

      <div className="px-5 py-4 flex-1 flex flex-col gap-2 overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Assign to student</span>
          <span className="text-[10px] text-gray-400">{pending.length} available</span>
        </div>
        <div className="relative">
          <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input type="text" placeholder="Filter students…" value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-[12px] bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-300 placeholder:text-gray-400" />
        </div>
        <div className="flex-1 overflow-y-auto border border-gray-100 rounded-xl divide-y divide-gray-50 min-h-0">
          {pending.map((s, i) => (
            <button key={s.id} onClick={() => setSelectedId(s.id)}
              className={cn(
                'w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors',
                s.id === selectedId ? 'bg-orange-50' : 'hover:bg-gray-50',
              )}>
              <Avatar hue={HUES[i % HUES.length]} size={30} />
              <div className="flex-1 min-w-0">
                <div className="text-[12px] font-medium text-gray-900 truncate">{s.full_name}</div>
                <div className="text-[10px] text-gray-400">{s.grade_level} · {s.student_id}</div>
              </div>
              {s.id === selectedId && <Check size={13} className="text-orange-500 shrink-0" />}
            </button>
          ))}
        </div>
        {error && <p className="text-[11px] text-red-500">{error}</p>}
      </div>

      <div className="px-5 py-4 border-t border-gray-100 space-y-2">
        {selected && (
          <div className="text-[11px] text-gray-500 bg-gray-50 rounded-lg px-3 py-2 mb-2">
            Will link photo to <span className="font-semibold text-gray-700">{selected.full_name}</span> and requeue.
          </div>
        )}
        <button onClick={handleResolve} disabled={!selectedId || loading}
          className={cn(
            'w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all',
            selectedId && !loading
              ? 'bg-orange-500 hover:bg-orange-600 text-white'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed',
          )}>
          {loading ? <Loader2 size={14} className="animate-spin" /> : <ArrowRight size={15} />}
          Resolve & Reprocess
        </button>
        <button onClick={onReject}
          className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold border border-red-200 text-red-600 hover:bg-red-50 transition-all">
          <X size={13} />
          Reject Photo
        </button>
      </div>
    </div>
  )
}

// ─── Right panel: Manual Crop (no_face) ──────────────────────────────────────

function CropPanel({
  orderId,
  student,
  crop,
  onResolved,
  onReject,
}: {
  orderId: number
  student: ReviewStudent
  crop: CropBox
  onResolved: () => void
  onReject: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleApply = async () => {
    if (!student.original_photo_url) {
      setError('No original photo available to crop.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      // We need the actual pixel dimensions to convert % → px
      const img = new Image()
      img.src = student.original_photo_url
      await new Promise<void>((resolve, reject) => {
        img.onload  = () => resolve()
        img.onerror = () => reject()
      })
      const W = img.naturalWidth
      const H = img.naturalHeight

      const formData = new FormData()
      formData.append('crop_x',      String(Math.round((crop.x / 100) * W)))
      formData.append('crop_y',      String(Math.round((crop.y / 100) * H)))
      formData.append('crop_width',  String(Math.round((crop.w / 100) * W)))
      formData.append('crop_height', String(Math.round((crop.h / 100) * H)))

      await api.post(
        `/orders/${orderId}/students/${student.id}/manual-crop/`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      )
      onResolved()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Crop failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-[300px] bg-white border-l border-gray-100 flex flex-col overflow-hidden shrink-0">
      <div className="px-5 pt-5 pb-3 border-b border-gray-100">
        <div className="flex items-center gap-2 mb-1">
          <ScanFace size={14} className="text-slate-500" />
          <span className="text-[11px] font-bold text-gray-900 uppercase tracking-widest">Manual Crop Editor</span>
        </div>
        <p className="text-[12px] text-gray-400 leading-snug">
          Face detection failed. Drag the crop box on the photo to frame the student's face manually.
        </p>
      </div>

      <div className="px-5 py-5 flex-1 flex flex-col gap-4">
        <div className="space-y-3">
          {[
            { step: '1', text: 'Use the toolbar to rotate or zoom if needed' },
            { step: '2', text: 'Drag the crop box corners to frame the face' },
            { step: '3', text: 'Ensure the face is centered and fully visible' },
          ].map(({ step, text }) => (
            <div key={step} className="flex items-start gap-3">
              <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                {step}
              </span>
              <span className="text-[12px] text-gray-600 leading-snug">{text}</span>
            </div>
          ))}
        </div>
        <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl flex items-start gap-2">
          <Info size={12} className="text-blue-400 mt-0.5 shrink-0" />
          <p className="text-[11px] text-blue-600 leading-snug">
            The crop coordinates are sent to the backend which re-renders the ID card using the selected region.
          </p>
        </div>
        {error && <p className="text-[11px] text-red-500">{error}</p>}
      </div>

      <div className="px-5 py-4 border-t border-gray-100 space-y-2">
        <button onClick={handleApply} disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-200 transition-all disabled:opacity-60">
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Check size={15} />}
          Apply Crop & Process
        </button>
        <button onClick={onReject}
          className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold border border-red-200 text-red-600 hover:bg-red-50 transition-all">
          <X size={13} />
          Reject Photo
        </button>
      </div>
    </div>
  )
}

// ─── Right panel: No Layout ───────────────────────────────────────────────────

function NoLayoutPanel({ onReject }: { orderId: number; onReject: () => void }) {
  const navigate = useNavigate()
  return (
    <div className="w-[300px] bg-white border-l border-gray-100 flex flex-col overflow-hidden shrink-0">
      <div className="px-5 pt-5 pb-3 border-b border-gray-100">
        <div className="flex items-center gap-2 mb-1">
          <LayoutTemplate size={14} className="text-amber-500" />
          <span className="text-[11px] font-bold text-gray-900 uppercase tracking-widest">No Layout Configured</span>
        </div>
        <p className="text-[12px] text-gray-400 leading-snug">
          This is an order-level issue, not specific to this photo. Fix the layout to unblock all affected students.
        </p>
      </div>
      <div className="px-5 py-5 flex-1 flex flex-col gap-4">
        <div className="space-y-3">
          {[
            { step: '1', text: 'Go to Layout Builder and open this order' },
            { step: '2', text: 'Design and save the front and back ID card layout' },
            { step: '3', text: 'Return here and re-trigger processing for this batch' },
          ].map(({ step, text }) => (
            <div key={step} className="flex items-start gap-3">
              <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                {step}
              </span>
              <span className="text-[12px] text-gray-600 leading-snug">{text}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="px-5 py-4 border-t border-gray-100 space-y-2">
        <button
          onClick={() => navigate('/operator/layout-builder')}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold bg-amber-500 hover:bg-amber-600 text-white transition-all">
          <LayoutTemplate size={15} />
          Go to Layout Builder
          <ArrowRight size={12} />
        </button>
        <button onClick={onReject}
          className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all">
          Skip for Now
        </button>
      </div>
    </div>
  )
}

// ─── Right panel: Error Retry ─────────────────────────────────────────────────

function ErrorRetryPanel({
  orderId,
  student,
  onResolved,
  onReject,
}: {
  orderId: number
  student: ReviewStudent
  onResolved: () => void
  onReject: () => void
}) {
  const [showDetail, setShowDetail] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleRetry = async () => {
    setLoading(true)
    setError(null)
    try {
      await api.post(`/students/${student.id}/reprocess/`)
      onResolved()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Retry failed')
    } finally {
      setLoading(false)
    }
  }

  const handleReplace = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLoading(true)
    setError(null)
    try {
      const formData = new FormData()
      formData.append('student_id', String(student.id))
      formData.append('photo', file)
      await api.post(`/orders/${orderId}/students/manual-link/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      onResolved()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Replace failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-[300px] bg-white border-l border-gray-100 flex flex-col overflow-hidden shrink-0">
      <div className="px-5 pt-5 pb-3 border-b border-gray-100">
        <div className="flex items-center gap-2 mb-1">
          <Bug size={14} className="text-rose-500" />
          <span className="text-[11px] font-bold text-gray-900 uppercase tracking-widest">Processing Error</span>
        </div>
        <p className="text-[12px] text-gray-400 leading-snug">
          An unexpected error occurred during pipeline processing.
        </p>
      </div>

      <div className="px-5 py-4 flex-1 flex flex-col gap-3">
        <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-rose-600 uppercase tracking-widest">Error Context</span>
            <button onClick={() => setShowDetail(v => !v)}
              className="text-[10px] text-rose-400 hover:text-rose-600 flex items-center gap-1">
              {showDetail ? 'Hide' : 'Show'} detail
              <ChevronDown size={10} className={cn('transition-transform', showDetail && 'rotate-180')} />
            </button>
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between gap-2">
              <span className="text-[11px] text-rose-500 shrink-0">File</span>
              <span className="text-[11px] font-mono text-rose-900 text-right">{student.student_id}</span>
            </div>
            {showDetail && (
              <div className="pt-2 border-t border-rose-100">
                <div className="text-[10px] text-rose-500 mb-1">Fail reason</div>
                <div className="text-[11px] font-mono text-rose-800 break-all">{student.fail_reason}</div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-start gap-2 p-2.5 bg-blue-50 rounded-lg border border-blue-100">
            <RefreshCw size={12} className="text-blue-400 mt-0.5 shrink-0" />
            <div>
              <div className="text-[11px] font-semibold text-blue-800">Retry</div>
              <div className="text-[10px] text-blue-500 leading-snug">Re-runs the pipeline on the existing photo.</div>
            </div>
          </div>
          <div className="flex items-start gap-2 p-2.5 bg-gray-50 rounded-lg border border-gray-100">
            <Upload size={12} className="text-gray-400 mt-0.5 shrink-0" />
            <div>
              <div className="text-[11px] font-semibold text-gray-700">Replace Photo</div>
              <div className="text-[10px] text-gray-400 leading-snug">Upload a new photo to replace the corrupt original.</div>
            </div>
          </div>
        </div>
        {error && <p className="text-[11px] text-red-500">{error}</p>}
      </div>

      <div className="px-5 py-4 border-t border-gray-100 space-y-2">
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleReplace} />
        <button onClick={handleRetry} disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-200 transition-all disabled:opacity-60">
          {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
          Retry Processing
        </button>
        <button onClick={() => fileRef.current?.click()} disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 text-gray-700 hover:bg-gray-50 transition-all">
          <Upload size={14} />
          Replace Photo
        </button>
        <button onClick={onReject}
          className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold border border-red-200 text-red-600 hover:bg-red-50 transition-all">
          <X size={13} />
          Reject & Remove
        </button>
      </div>
    </div>
  )
}

// ─── Filmstrip ────────────────────────────────────────────────────────────────

function Filmstrip({
  students,
  resolvedIds,
  rejectedIds,
  currentIdx,
  onSelect,
}: {
  students: ReviewStudent[]
  resolvedIds: Set<number>
  rejectedIds: Set<number>
  currentIdx: number
  onSelect: (i: number) => void
}) {
  return (
    <div className="h-[72px] bg-[#0a0c10] border-t border-white/8 flex items-center gap-1.5 px-4 overflow-x-auto shrink-0">
      {students.map((s, i) => {
        const issue = issueType(s)
        const done = resolvedIds.has(s.id)
        const rejected = rejectedIds.has(s.id)
        return (
          <button
            key={s.id}
            onClick={() => onSelect(i)}
            title={`${s.full_name} — ${ISSUE_LABELS[issue]}`}
            className={cn(
              'relative w-11 h-[52px] rounded overflow-hidden shrink-0 border-2 transition-all duration-150',
              i === currentIdx
                ? 'border-blue-400 scale-110 shadow-lg shadow-blue-900/40'
                : 'border-transparent opacity-50 hover:opacity-80',
            )}
          >
            {s.original_photo_url ? (
              <img src={s.original_photo_url} alt={s.full_name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full"
                style={{ background: `linear-gradient(160deg, hsl(${HUES[i % HUES.length]},35%,32%), hsl(${HUES[i % HUES.length]},45%,22%))` }} />
            )}
            {/* Issue colour strip */}
            <div className="absolute bottom-0 left-0 right-0 h-1" style={{ backgroundColor: ISSUE_STRIP[issue] }} />
            {/* Status dot */}
            <div className={cn(
              'absolute top-1 right-1 w-2 h-2 rounded-full border border-black/30',
              done ? 'bg-emerald-400' : rejected ? 'bg-red-400' : 'bg-gray-500',
            )} />
            <div className="absolute top-0.5 left-1 text-[7px] text-white/50 font-mono">{i + 1}</div>
          </button>
        )
      })}
    </div>
  )
}

// ─── Review Interface (per-order) ────────────────────────────────────────────

type FilterKey = 'all' | IssueType

const FILTER_TABS: { key: FilterKey; label: string }[] = [
  { key: 'all',          label: 'All'         },
  { key: 'no_qr',        label: 'No QR'       },
  { key: 'qr_not_found', label: 'QR Not Found'},
  { key: 'no_face',      label: 'No Face'     },
  { key: 'no_layout',    label: 'No Layout'   },
  { key: 'error',        label: 'Error'       },
]

function ReviewInterface({
  order,
  onBack,
}: {
  order: any
  onBack: () => void
}) {
  const { students, loading } = useStudentsForOrder(order.id)
  const navigate = useNavigate()

  const [filter, setFilter]       = useState<FilterKey>('all')
  const [currentIdx, setCurrentIdx] = useState(0)
  const [resolvedIds, setResolvedIds] = useState<Set<number>>(new Set())
  const [rejectedIds,  setRejectedIds]  = useState<Set<number>>(new Set())
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

  if (!loading && unresolved.length === 0 && !loading) {
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
      {/* Header */}
      <header className="flex items-center gap-3 px-5 py-3 bg-[#16181f] border-b border-white/8 shrink-0 flex-wrap gap-y-2">
        <button onClick={onBack}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-white/50 hover:text-white/90 hover:bg-white/10 transition-colors shrink-0">
          <ChevronLeft size={18} />
        </button>
        <div className="shrink-0">
          <h1 className="text-sm font-semibold text-white leading-none">Manual Review</h1>
          <p className="text-[10px] text-white/40 mt-0.5">{order.school_name}</p>
        </div>

        {/* Filter tabs */}
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

        {/* Navigation + progress */}
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

      {/* No-layout banner */}
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

      {/* Main area */}
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
          <NoLayoutPanel key={`panel-${current.id}`} orderId={order.id} onReject={handleReject} />
        )}
        {issue === 'error' && (
          <ErrorRetryPanel key={`panel-${current.id}`} orderId={order.id} student={current} onResolved={handleResolved} onReject={handleReject} />
        )}
      </div>

      {/* Filmstrip */}
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

// ─── View 1 — Order Queue ─────────────────────────────────────────────────────

function OrderQueue({ onSelect }: { onSelect: (order: any) => void }) {
  const { orders, progress } = useOrders()
  const [query, setQuery] = useState('')

  const reviewOrders = orders.filter(o => (progress[o.id]?.manual_review ?? 0) > 0)

  const filtered = useMemo(() => {
    const q = query.toLowerCase()
    if (!q) return reviewOrders
    return reviewOrders.filter(o =>
      o.school_name.toLowerCase().includes(q) ||
      o.batch_name.toLowerCase().includes(q) ||
      String(o.id).includes(q),
    )
  }, [reviewOrders, query])

  const totalNeedingReview = reviewOrders.reduce(
    (sum, o) => sum + (progress[o.id]?.manual_review ?? 0), 0
  )

  return (
    <div className="flex flex-col h-full">
      {/* Sub-header */}
      <header className="sticky top-0 bg-white border-b border-gray-100 shadow-sm z-10">
        <div className="flex items-center gap-4 px-8 py-3">
          <span className="text-[15px] font-semibold text-gray-900">Manual Review</span>
          {totalNeedingReview > 0 && (
            <span className="text-[11px] font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-100">
              {totalNeedingReview} items need review
            </span>
          )}
        </div>
      </header>

      <main className="flex-1 px-8 py-8 overflow-y-auto">
        <div className="max-w-3xl">
          <div className="flex items-end justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Review Queue</h2>
              <p className="text-sm text-gray-500">
                Orders with photos that failed automated processing and need manual intervention.
              </p>
            </div>
            <div className="relative shrink-0 w-56">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input type="text" placeholder="Search orders…" value={query}
                onChange={e => setQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 placeholder:text-gray-400 transition-all" />
            </div>
          </div>

          {reviewOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                <Check size={24} className="text-emerald-500" />
              </div>
              <p className="text-sm font-semibold text-gray-600">No items need review</p>
              <p className="text-xs text-gray-400">All processed photos passed the AI pipeline.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.length === 0 && (
                <div className="py-12 text-center text-sm text-gray-400">
                  No orders match &ldquo;{query}&rdquo;
                </div>
              )}
              {filtered.map(order => {
                const reviewCount = progress[order.id]?.manual_review ?? 0
                const isUrgent = order.deadline && (() => {
                  const diff = new Date(order.deadline).getTime() - Date.now()
                  return diff > 0 && diff < 24 * 60 * 60 * 1000
                })()

                return (
                  <div key={order.id}
                    className={cn(
                      'group bg-white rounded-2xl border shadow-sm hover:shadow-md transition-all duration-200 p-5',
                      isUrgent ? 'border-red-100 hover:border-red-200' : 'border-gray-100 hover:border-blue-200',
                    )}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-[11px] font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                            #{order.id}
                          </span>
                          <span className="text-[10px] font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                            {order.batch_name}
                          </span>
                          {isUrgent && (
                            <span className="flex items-center gap-1 text-[10px] font-semibold text-red-600 bg-red-50 border border-red-100 px-2 py-0.5 rounded-full uppercase tracking-wide">
                              <AlertTriangle size={9} />Urgent
                            </span>
                          )}
                        </div>
                        <h3 className="text-base font-semibold text-gray-900 mb-1">{order.school_name}</h3>
                        <div className="flex items-center gap-4 text-[12px] text-gray-400 mb-2">
                          <span className="flex items-center gap-1"><Users size={11} />{order.student_count.toLocaleString()} students</span>
                          {order.deadline && (
                            <span className="flex items-center gap-1">
                              <Clock size={11} />
                              {new Date(order.deadline).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        <span className="flex items-center gap-1.5 text-[12px] font-semibold text-red-600">
                          <AlertTriangle size={12} />{reviewCount} photo{reviewCount !== 1 ? 's' : ''} need review
                        </span>
                      </div>
                      <button
                        onClick={() => onSelect(order)}
                        className={cn(
                          'shrink-0 flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl transition-all shadow-sm group-hover:scale-105 duration-200',
                          isUrgent
                            ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-200'
                            : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200',
                        )}>
                        Start Review <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default function ManualReviewPage() {
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null)

  if (selectedOrder) {
    return (
      <div className="h-[calc(100vh-60px)] flex flex-col">
        <ReviewInterface
          order={selectedOrder}
          onBack={() => setSelectedOrder(null)}
        />
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-60px)] overflow-hidden">
      <OrderQueue onSelect={setSelectedOrder} />
    </div>
  )
}
