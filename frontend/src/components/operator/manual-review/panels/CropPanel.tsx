import { useState } from 'react'
import { ScanFace, Info, Check, X, Loader2 } from 'lucide-react'
import api from '../../../../utils/api'
import { type ReviewStudent, type CropBox } from '../types'

interface CropPanelProps {
  orderId: number
  student: ReviewStudent
  crop: CropBox
  onResolved: () => void
  onReject: () => void
}

export function CropPanel({ orderId, student, crop, onResolved, onReject }: CropPanelProps) {
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
      const img = new Image()
      img.src = student.original_photo_url
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve()
        img.onerror = () => reject()
      })
      const W = img.naturalWidth
      const H = img.naturalHeight

      const formData = new FormData()
      formData.append('crop_x', String(Math.round((crop.x / 100) * W)))
      formData.append('crop_y', String(Math.round((crop.y / 100) * H)))
      formData.append('crop_width', String(Math.round((crop.w / 100) * W)))
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