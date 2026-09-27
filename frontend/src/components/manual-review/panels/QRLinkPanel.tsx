import { useState, useMemo, useRef, useEffect } from 'react'
import { Search, Check, X, QrCode, Loader2 } from 'lucide-react'
import api from '../../../utils/api'
import { cn } from '../../../lib/utils'
import { Avatar } from '../Avatar'
import { type ReviewStudent, HUES } from '../types'

interface QRLinkPanelProps {
  orderId: number
  student: ReviewStudent
  onResolved: () => void
  onReject: () => void
}

export function QRLinkPanel({ orderId, student, onResolved, onReject }: QRLinkPanelProps) {
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