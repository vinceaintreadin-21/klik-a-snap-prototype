import { useState, useMemo, useEffect } from "react";
import { Search, Check, X, QrCode, ArrowRight, Loader2 } from 'lucide-react'
import api from "../../../utils/api";
import { cn } from "../../../lib/utils";
import { Avatar } from "../Avatar";
import { type ReviewStudent, HUES } from "../types";

interface QRConflictPanelProps {
  orderId: number
  student: ReviewStudent
  onResolved: () => void
  onReject: () => void
}

export function QRConflictPanel({ orderId, student, onResolved, onReject }: QRConflictPanelProps) {
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
    if (!q) return allStudents
    return allStudents.filter(s =>
      s.full_name.toLowerCase().includes(q) || s.student_id.toLowerCase().includes(q)
    )
  }, [allStudents, query])

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