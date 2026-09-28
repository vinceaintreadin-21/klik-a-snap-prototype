import { useState, useRef } from 'react'
import { Bug, ChevronDown, RefreshCw, Upload, X, Loader2 } from 'lucide-react'
import api from '../../../../utils/api'
import { cn } from '../../../../lib/utils'
import { type ReviewStudent } from '../types'

interface ErrorRetryPanelProps {
  orderId: number
  student: ReviewStudent
  onResolved: () => void
  onReject: () => void
}

export function ErrorRetryPanel({ orderId, student, onResolved, onReject }: ErrorRetryPanelProps) {
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