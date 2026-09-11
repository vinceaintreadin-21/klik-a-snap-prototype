/**
 * BatchUploadPage — 3-step batch upload wizard.
 * Visual design: QUEUEBITS_UI/BatchUploadView.tsx
 * Data: real API via OrderContext + axios
 */

import { useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useOrders } from '../../context/OrderContext'
import api from '../../utils/api'
import {
  CheckCircle2, ChevronRight, ChevronLeft, Users, Calendar,
  Upload, Copy, X, FileImage, Filter, Info, Loader2,
} from 'lucide-react'
import { cn } from '../../lib/utils'

// ── Types ─────────────────────────────────────────────────────────────────────

type Step = 1 | 2 | 3

interface UploadedFile {
  id: string
  name: string
  size: string
  status: 'ok' | 'duplicate' | 'error'
  /** hue for the placeholder thumbnail gradient */
  hue: number
}

// ── Step Indicator ────────────────────────────────────────────────────────────

const STEPS = [
  { id: 1, label: 'Select Order'  },
  { id: 2, label: 'Upload Photos' },
  { id: 3, label: 'Confirm'       },
]

function StepIndicator({ current }: { current: Step }) {
  return (
    <div className="flex items-center">
      {STEPS.map((s, i) => {
        const done   = s.id < current
        const active = s.id === current
        return (
          <div key={s.id} className="flex items-center">
            <div className="flex items-center gap-2">
              <div className={cn(
                'w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold transition-all',
                done   && 'bg-blue-600 text-white',
                active && 'bg-blue-600 text-white ring-4 ring-blue-100',
                !done && !active && 'bg-gray-100 text-gray-400',
              )}>
                {done ? <CheckCircle2 size={14} /> : s.id}
              </div>
              <span className={cn(
                'text-[12px] font-medium whitespace-nowrap',
                active && 'text-blue-700',
                done   && 'text-gray-500',
                !done && !active && 'text-gray-400',
              )}>
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={cn('w-8 h-px mx-3', done ? 'bg-blue-400' : 'bg-gray-200')} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Photo thumbnail ───────────────────────────────────────────────────────────

function PhotoThumb({ file, onRemove }: { file: UploadedFile; onRemove: (id: string) => void }) {
  return (
    <div className="group relative rounded-xl overflow-hidden border border-gray-100 bg-white shadow-sm hover:shadow-md transition-all">
      {/* Colour placeholder */}
      <div
        className="w-full aspect-square"
        style={{ background: `linear-gradient(135deg, hsl(${file.hue},40%,80%), hsl(${file.hue},50%,65%))` }}
      >
        <div className="w-full h-full flex items-end justify-center pb-1 opacity-30">
          {/* Silhouette */}
          <svg viewBox="0 0 40 50" width="55%" fill="white">
            <circle cx="20" cy="14" r="10" />
            <ellipse cx="20" cy="42" rx="16" ry="14" />
          </svg>
        </div>
      </div>

      {/* Status badge */}
      <div className="absolute top-1.5 right-1.5">
        {file.status === 'ok' && (
          <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center shadow">
            <CheckCircle2 size={11} className="text-white" />
          </div>
        )}
        {file.status === 'error' && (
          <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center shadow">
            <X size={10} className="text-white" strokeWidth={3} />
          </div>
        )}
        {file.status === 'duplicate' && (
          <div className="w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center shadow">
            <Copy size={9} className="text-white" />
          </div>
        )}
      </div>

      {/* Hover remove */}
      <button
        onClick={() => onRemove(file.id)}
        className="absolute top-1.5 left-1.5 w-5 h-5 bg-black/50 rounded-full hidden group-hover:flex items-center justify-center"
      >
        <X size={9} className="text-white" />
      </button>

      {/* Label */}
      <div className="p-2 border-t border-gray-100">
        <p className="text-[10px] font-medium text-gray-700 truncate leading-none">{file.name}</p>
        <p className={cn('text-[9px] mt-0.5 font-medium',
          file.status === 'ok'        && 'text-gray-400',
          file.status === 'error'     && 'text-red-500',
          file.status === 'duplicate' && 'text-amber-500',
        )}>
          {file.status === 'ok' ? file.size : file.status}
        </p>
      </div>
    </div>
  )
}

// ── Step 1 — Order Selection ──────────────────────────────────────────────────

function Step1({ orders, onNext }: { orders: any[]; onNext: (order: any) => void }) {
  return (
    <div className="max-w-2xl mx-auto py-8 px-6">
      <div className="mb-7">
        <h2 className="text-xl font-bold text-gray-900 mb-1">Select an Order</h2>
        <p className="text-sm text-gray-500">Choose which order you want to upload student photos for.</p>
      </div>

      {orders.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
          <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center border border-gray-200">
            <Upload size={20} className="text-gray-300" />
          </div>
          <p className="text-sm font-semibold text-gray-500">No orders ready for upload</p>
          <p className="text-xs text-gray-400">Orders in PENDING, FAILED, or PROOFING status will appear here.</p>
        </div>
      )}

      <div className="space-y-3">
        {orders.map((order) => {
          const hasUploads = (order.uploaded_count ?? 0) > 0
          return (
            <div
              key={order.id}
              className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-200 p-5"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[11px] font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                      #{order.id}
                    </span>
                    <span className="text-[10px] font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                      {order.batch_name}
                    </span>
                    {hasUploads && (
                      <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full uppercase tracking-wide">
                        In progress
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-semibold text-gray-900 mb-2">{order.school_name}</h3>
                  <div className="flex items-center gap-4 text-[12px] text-gray-400">
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
                    {hasUploads && (
                      <span className="flex items-center gap-1 text-blue-500">
                        <Upload size={11} />
                        {order.uploaded_count} uploaded
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => onNext(order)}
                  className="shrink-0 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all shadow-sm shadow-blue-200 group-hover:scale-105"
                >
                  {hasUploads ? 'Continue' : 'Start'} Upload
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Step 2 — Upload Photos ────────────────────────────────────────────────────

function Step2({
  order,
  files,
  onFilesAdd,
  onFileRemove,
}: {
  order: any
  files: UploadedFile[]
  onFilesAdd: (f: UploadedFile[]) => void
  onFileRemove: (id: string) => void
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragging,  setDragging]  = useState(false)
  const [uploading, setUploading] = useState(false)

  const uploaded = files.filter(f => f.status === 'ok').length
  const dups     = files.filter(f => f.status === 'duplicate').length
  const errors   = files.filter(f => f.status === 'error').length
  const total    = order.student_count as number
  const pct      = total > 0 ? Math.round((uploaded / total) * 100) : 0

  const processFiles = async (rawFiles: FileList | null) => {
    if (!rawFiles || rawFiles.length === 0) return
    setUploading(true)

    const newEntries: UploadedFile[] = []
    // Cycle through hues for thumbnail colours
    const hues = [210, 160, 280, 45, 25, 190, 330, 0, 120, 60]

    for (let i = 0; i < rawFiles.length; i++) {
      const file = rawFiles[i]
      const formData = new FormData()
      formData.append('files', file)

      try {
        await api.post(`/orders/${order.id}/photos/upload/`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        newEntries.push({
          id:     `${Date.now()}-${file.name}`,
          name:   file.name,
          size:   `${(file.size / 1024 / 1024).toFixed(1)} MB`,
          status: 'ok',
          hue:    hues[i % hues.length],
        })
      } catch (err: any) {
        const isDuplicate = err.response?.status === 409
        newEntries.push({
          id:     `${Date.now()}-${file.name}`,
          name:   file.name,
          size:   `${(file.size / 1024 / 1024).toFixed(1)} MB`,
          status: isDuplicate ? 'duplicate' : 'error',
          hue:    hues[i % hues.length],
        })
      }
    }

    onFilesAdd(newEntries)
    setUploading(false)
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    processFiles(e.dataTransfer.files)
  }, [order.id])

  return (
    <div className="flex gap-5 p-6 h-full overflow-hidden">

      {/* ── Left column ── */}
      <div className="flex-1 min-w-0 flex flex-col gap-4 overflow-hidden">

        {/* Batch progress bar */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-800">Batch Progress</h3>
            <div className="flex items-center gap-4 text-[12px]">
              <span className="text-gray-400">
                Total <span className="font-semibold text-gray-700 ml-1">{total.toLocaleString()}</span>
              </span>
              <span className="text-blue-600">
                Uploaded <span className="font-bold ml-1">{uploaded}</span>
              </span>
              <span className="text-amber-500">
                Duplicates <span className="font-bold ml-1">{dups}</span>
              </span>
              <span className="text-red-500">
                Errors <span className="font-bold ml-1">{errors}</span>
              </span>
            </div>
          </div>
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="text-[11px] text-gray-400">{pct}% uploaded</span>
            <span className="text-[11px] text-gray-400">{uploaded} / {total.toLocaleString()} photos</span>
          </div>
        </div>

        {/* Drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={cn(
            'rounded-2xl border-2 border-dashed flex flex-col items-center justify-center py-10 gap-3 transition-all',
            dragging
              ? 'border-blue-400 bg-blue-50 scale-[1.01]'
              : 'border-gray-200 bg-gray-50/60 hover:border-blue-300 hover:bg-blue-50/30',
          )}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 size={28} className="text-blue-500 animate-spin" />
              <p className="text-sm text-blue-600 font-medium">Uploading photos…</p>
            </div>
          ) : (
            <>
              <div className={cn(
                'w-12 h-12 rounded-2xl flex items-center justify-center transition-colors',
                dragging ? 'bg-blue-100' : 'bg-white border border-gray-200 shadow-sm',
              )}>
                <Upload size={22} className={dragging ? 'text-blue-600' : 'text-gray-400'} />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-gray-700">Drag and drop student photos</p>
                <p className="text-[12px] text-gray-400 mt-0.5">
                  Supports JPG, PNG up to 5 MB per file. Use 400×500px portrait aspect ratio.
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={(e) => processFiles(e.target.files)}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 bg-white hover:bg-blue-50 text-blue-600 text-sm font-semibold border border-blue-200 hover:border-blue-400 px-4 py-2 rounded-xl transition-all shadow-sm"
              >
                <FileImage size={14} />
                Select Files from Device
              </button>
            </>
          )}
        </div>

        {/* Photo thumbnail grid */}
        {files.length > 0 && (
          <div className="flex-1 overflow-y-auto min-h-0">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-800">Recently Uploaded</h3>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">{files.length} files</span>
                <button className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-100 transition-colors">
                  <Filter size={12} />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2.5">
              {files.map(f => (
                <PhotoThumb key={f.id} file={f} onRemove={onFileRemove} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Right column — summary + tips ── */}
      <div className="w-52 flex-shrink-0 flex flex-col gap-3">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Upload Summary</h3>
          <div className="space-y-2">
            {[
              { label: 'Total Photos', value: total.toLocaleString(), color: 'text-gray-700',  bg: ''                     },
              { label: 'Uploaded',     value: String(uploaded),       color: 'text-blue-700',  bg: 'bg-blue-50 rounded-lg' },
              { label: 'Duplicates',   value: String(dups),           color: dups   > 0 ? 'text-amber-600' : 'text-gray-400', bg: '' },
              { label: 'Errors',       value: String(errors),         color: errors > 0 ? 'text-red-600'   : 'text-gray-400', bg: '' },
            ].map(({ label, value, color, bg }) => (
              <div key={label} className={cn('flex items-center justify-between px-2 py-1.5', bg)}>
                <span className="text-[12px] text-gray-500">{label}</span>
                <span className={cn('text-[15px] font-bold tabular-nums', color)}>{value}</span>
              </div>
            ))}
          </div>
          {(errors > 0 || dups > 0) && (
            <p className="text-[11px] text-gray-400 mt-3 px-2 leading-relaxed">
              Errors & duplicates will be reviewed in the{' '}
              <span className="font-semibold text-blue-600">Pipeline</span> after submission.
            </p>
          )}
        </div>

        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Info size={13} className="text-blue-500 shrink-0" />
            <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">Quick Tip</span>
          </div>
          <ul className="space-y-1.5 text-[11px] text-blue-700 list-disc list-inside leading-relaxed">
            <li>Name files using the student ID</li>
            <li>Use 400×500px portrait layout</li>
            <li>File size must be under 5 MB</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

// ── Step 3 — Confirm & Submit ─────────────────────────────────────────────────

function Step3({
  order,
  files,
  onBackToDashboard,
}: {
  order: any
  files: UploadedFile[]
  onBackToDashboard: () => void
}) {
  const navigate  = useNavigate()
  const uploaded  = files.filter(f => f.status === 'ok').length
  const dups      = files.filter(f => f.status === 'duplicate').length
  const errors    = files.filter(f => f.status === 'error').length

  const [submitting, setSubmitting] = useState(false)
  const [done,       setDone]       = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const handleSubmit = async () => {
    setSubmitting(true)
    setSubmitError(null)
    try {
      // Kick off AI processing — photos are already uploaded in Step 2
      await api.post(`/orders/${order.id}/process/`)
      setDone(true)
    } catch (err: any) {
      setSubmitError(err.response?.data?.error || 'Failed to submit to pipeline. Try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Success state ──
  if (done) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 py-16">
        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
          <CheckCircle2 size={32} className="text-emerald-600" />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900">Batch Submitted!</h2>
          <p className="text-sm text-gray-500 mt-1">
            {uploaded} photo{uploaded !== 1 ? 's' : ''} queued for processing in the Pipeline.
          </p>
        </div>
        <div className="flex items-center gap-3 mt-2">
          <button
            onClick={onBackToDashboard}
            className="text-sm text-gray-500 hover:text-gray-700 border border-gray-200 px-5 py-2.5 rounded-xl transition-colors hover:bg-gray-50"
          >
            Back to Dashboard
          </button>
          <button
            onClick={() => navigate('/operator/pipeline')}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all shadow-sm shadow-blue-200"
          >
            View in Pipeline
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    )
  }

  // ── Review & confirm state ──
  return (
    <div className="max-w-lg mx-auto py-10 px-6 flex flex-col gap-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">Confirm & Submit</h2>
        <p className="text-sm text-gray-500">
          Review the summary before sending photos to the processing pipeline.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
        <div className="flex justify-between pb-3 border-b border-gray-100">
          <span className="text-sm text-gray-500">Order</span>
          <span className="text-sm font-semibold text-gray-800">#{order.id}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-gray-500">Institution</span>
          <span className="text-sm font-semibold text-gray-800">{order.school_name}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-gray-500">Total Students</span>
          <span className="text-sm font-semibold text-gray-800">{order.student_count.toLocaleString()}</span>
        </div>
        <div className="flex justify-between pt-3 border-t border-gray-100">
          <span className="text-sm text-gray-500">Photos Uploaded</span>
          <span className="text-sm font-bold text-blue-600">{uploaded} photos</span>
        </div>
        {dups > 0 && (
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Duplicates detected</span>
            <span className="text-sm font-medium text-amber-500">{dups} photos</span>
          </div>
        )}
        {errors > 0 && (
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">File errors detected</span>
            <span className="text-sm font-medium text-red-500">{errors} photos</span>
          </div>
        )}
      </div>

      {(errors > 0 || dups > 0) && (
        <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl p-3.5">
          <Info size={14} className="text-blue-500 mt-0.5 shrink-0" />
          <p className="text-[12px] text-blue-700">
            Errors and duplicates will be flagged for review in the{' '}
            <strong>Processing Pipeline</strong>. You can resolve them there without re-uploading.
          </p>
        </div>
      )}

      {submitError && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
          {submitError}
        </p>
      )}

      <button
        onClick={handleSubmit}
        disabled={submitting || uploaded === 0}
        className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all shadow-sm shadow-blue-200 w-full"
      >
        {submitting
          ? <><Loader2 size={16} className="animate-spin" /> Submitting…</>
          : 'Submit to Pipeline'
        }
      </button>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function BatchUploadPage() {
  const navigate = useNavigate()
  const { orders } = useOrders()

  const [step,  setStep]  = useState<Step>(1)
  const [order, setOrder] = useState<any | null>(null)
  const [files, setFiles] = useState<UploadedFile[]>([])

  const handleFilesAdd = (incoming: UploadedFile[]) => {
    setFiles(prev => {
      const ids = new Set(prev.map(f => f.id))
      return [...prev, ...incoming.filter(f => !ids.has(f.id))]
    })
  }

  const handleFileRemove = (id: string) => setFiles(prev => prev.filter(f => f.id !== id))

  const uploadableOrders = orders.filter(o =>
    ['PENDING', 'FAILED', 'PROOFING'].includes(o.status),
  )

  const uploaded = files.filter(f => f.status === 'ok').length
  const canAdvance = step === 1 ? !!order : step === 2 ? files.length > 0 : false

  return (
    <div className="flex flex-col h-[calc(100vh-60px)]">

      {/* ── Wizard header ── */}
      <header className="bg-white border-b border-gray-100 shadow-sm flex-shrink-0">
        <div className="flex items-center justify-between px-8 py-3">
          <div className="flex items-center gap-3">
            <h1 className="text-[15px] font-semibold text-gray-900">
              Batch Upload{order ? ` — ${order.batch_name}` : ''}
            </h1>
            {order && (
              <span className="text-[11px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                {order.school_name}
              </span>
            )}
          </div>
          <StepIndicator current={step} />
          {/* Spacer to balance the header */}
          <div className="w-48" />
        </div>
      </header>

      {/* ── Step content ── */}
      <div className="flex-1 overflow-hidden">
        {step === 1 && (
          <Step1
            orders={uploadableOrders}
            onNext={(o) => { setOrder(o); setStep(2) }}
          />
        )}
        {step === 2 && order && (
          <Step2
            order={order}
            files={files}
            onFilesAdd={handleFilesAdd}
            onFileRemove={handleFileRemove}
          />
        )}
        {step === 3 && order && (
          <Step3
            order={order}
            files={files}
            onBackToDashboard={() => navigate('/operator/dashboard')}
          />
        )}
      </div>

      {/* ── Footer nav (steps 1 & 2 only) ── */}
      {step < 3 && (
        <div className="flex-shrink-0 bg-white border-t border-gray-100 px-8 py-3 flex items-center justify-between shadow-sm">
          <button
            onClick={() =>
              step === 1 ? navigate('/operator/dashboard') : setStep(s => (s - 1) as Step)
            }
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors"
          >
            <ChevronLeft size={15} />
            {step === 1 ? 'Cancel' : 'Back'}
          </button>

          {/* Centre: records ready count (matches QUEUEBITS reference) */}
          <span className="text-[12px] text-gray-400">
            {step === 2 && uploaded > 0
              ? `${uploaded} of ${order?.student_count.toLocaleString()} records ready`
              : null
            }
          </span>

          <button
            onClick={() => setStep(s => (s + 1) as Step)}
            disabled={!canAdvance}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold px-5 py-2 rounded-xl transition-all shadow-sm shadow-blue-200"
          >
            {step === 2 ? 'Continue to Confirm' : 'Continue'}
            <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  )
}
