import { useState } from 'react'
import {
    X, CreditCard, QrCode, CheckCircle2, RotateCcw,
    AlertTriangle, ArrowLeft,
} from 'lucide-react'
import { cn } from '../../lib/utils'
import type { CardReviewStatus } from './institutionTypes'
import { REVISION_REASONS } from './institutionTypes'
import api from '../../utils/api'

interface IDPreviewStudent {
    id: number
    name: string
    student_id: string
    department?: string
    role?: string
    processed_photo?: string
    initials: string
    hue: number
}

interface IDPreviewModalProps {
    student: IDPreviewStudent
    reviewStatus: CardReviewStatus
    onApprove: () => void
    onRevise: (studentId: number, reason: string, note: string) => void
    onClose: () => void
}

export default function IDPreviewModal({
    student,
    reviewStatus,
    onApprove,
    onRevise,
    onClose,
}: IDPreviewModalProps) {
    const [mode, setMode] = useState<'preview' | 'revise'>('preview')
    const [selectedReason, setSelectedReason] = useState('')
    const [note, setNote] = useState('')
    const [loading, setLoading] = useState(false)

    const bgColor = `hsl(${student.hue}, 55%, 48%)`

    const handleApprove = async () => {
        setLoading(true)
        try {
            await api.post(`/students/${student.id}/approve/`)
            onApprove()
        } catch (err: any) {
            console.error('Approve failed:', err)
        } finally {
            setLoading(false)
        }
    }

    const handleSubmitRevision = async () => {
        if (!selectedReason) return
        setLoading(true)
        try {
            await api.post(`/students/${student.id}/request-revision/`, {
                reason: selectedReason,
                note,
            })
            onRevise(student.id, selectedReason, note)
        } catch (err: any) {
            console.error('Revision request failed:', err)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-[rgba(15,23,42,0.4)] backdrop-blur-[2px]" onClick={onClose} />
            <div className="relative bg-white rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.18)] w-[520px] overflow-hidden">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-[#f1f5f9]">
                    <div className="flex items-center gap-2">
                        {mode === 'revise' && (
                            <button onClick={() => setMode('preview')}
                                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#f1f5f9] transition-colors mr-1">
                                <ArrowLeft size={14} className="text-[#64748b]" />
                            </button>
                        )}
                        <div className="w-8 h-8 rounded-lg bg-[#e8eeff] flex items-center justify-center">
                            <CreditCard size={15} className="text-[#004ac6]" />
                        </div>
                        <div>
                            <h2 className="text-[15px] font-bold text-[#0b1c30]">
                                {mode === 'preview' ? 'ID Card Preview' : 'Request Revision'}
                            </h2>
                            <p className="text-[11px] text-[#9ba3af]">{student.student_id}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#f1f5f9] transition-colors">
                        <X size={16} className="text-[#64748b]" />
                    </button>
                </div>

                {mode === 'preview' ? (
                    <div className="px-6 py-5 flex flex-col gap-5">
                        {/* ID card visual */}
                        <div className="mx-auto w-[340px] rounded-2xl overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.12)] border border-[#e2e8f0]">
                            <div className="h-3" style={{ background: bgColor }} />
                            <div className="bg-white px-5 py-4 flex items-start gap-4">
                                {/* Photo */}
                                <div className="w-[72px] h-[88px] rounded-xl border-2 border-[#e2e8f0] bg-[#f8fafc] flex items-center justify-center shrink-0 overflow-hidden">
                                    {student.processed_photo ? (
                                        <img src={student.processed_photo} alt={student.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="flex flex-col items-center gap-1">
                                            <div className="w-10 h-10 rounded-full flex items-center justify-center text-[14px] font-bold text-white"
                                                style={{ background: bgColor }}>
                                                {student.initials}
                                            </div>
                                            <span className="text-[8px] text-[#c8cbd9] font-medium">PHOTO</span>
                                        </div>
                                    )}
                                </div>
                                {/* Info */}
                                <div className="flex-1 min-w-0 pt-1">
                                    <p className="text-[15px] font-bold text-[#0b1c30] leading-tight">{student.name}</p>
                                    <p className="text-[11px] text-[#64748b] mt-0.5">{student.role ?? 'Student'}</p>
                                    <div className="mt-3 space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] text-[#9ba3af] w-[64px]">ID Number</span>
                                            <span className="text-[10px] font-semibold text-[#374151] font-mono">{student.student_id}</span>
                                        </div>
                                        {student.department && (
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] text-[#9ba3af] w-[64px]">Department</span>
                                                <span className="text-[10px] font-medium text-[#374151]">{student.department}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="w-[44px] h-[44px] rounded-lg border border-[#e2e8f0] bg-[#f8fafc] flex items-center justify-center shrink-0">
                                    <QrCode size={24} className="text-[#c8cbd9]" />
                                </div>
                            </div>
                            <div className="px-5 py-2 border-t border-[#f1f5f9] flex items-center justify-between">
                                <div className="flex gap-px">
                                    {Array.from({ length: 16 }).map((_, i) => (
                                        <div key={i} className="w-[3px] h-[6px] rounded-sm" style={{ background: i < 9 ? bgColor : '#e2e8f0' }} />
                                    ))}
                                </div>
                                <span className="text-[9px] font-bold text-[#9ba3af] tracking-widest uppercase">Institution ID</span>
                            </div>
                        </div>

                        {/* Status banner */}
                        {reviewStatus !== 'pending' && (
                            <div className={cn(
                                'flex items-center gap-2 px-3.5 py-2.5 rounded-lg border text-[13px] font-medium',
                                reviewStatus === 'approved'
                                    ? 'bg-[#f0fdf4] border-[#bbf7d0] text-[#166534]'
                                    : 'bg-[#fff5f5] border-[#fca5a5] text-[#b91c1c]'
                            )}>
                                {reviewStatus === 'approved'
                                    ? <><CheckCircle2 size={15} /> This ID has been approved</>
                                    : <><AlertTriangle size={15} /> Revision requested for this ID</>}
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-3">
                            <button
                                onClick={handleApprove}
                                disabled={loading || reviewStatus === 'approved'}
                                className={cn(
                                    'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[14px] font-semibold transition-all shadow-sm',
                                    reviewStatus === 'approved'
                                        ? 'bg-[#dcfce7] text-[#166534] border border-[#bbf7d0] cursor-default'
                                        : 'bg-[#004ac6] text-white hover:bg-[#003da6] disabled:opacity-50'
                                )}>
                                <CheckCircle2 size={16} />
                                {reviewStatus === 'approved' ? 'Approved' : loading ? 'Approving…' : 'Approve ID'}
                            </button>
                            <button
                                onClick={() => setMode('revise')}
                                disabled={loading}
                                className={cn(
                                    'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[14px] font-semibold border transition-all',
                                    reviewStatus === 'revision'
                                        ? 'bg-[#fff5f5] text-[#b91c1c] border-[#fca5a5] cursor-default'
                                        : 'bg-white text-[#d97706] border-[#fde68a] hover:bg-[#fffbeb]'
                                )}>
                                <RotateCcw size={16} />
                                {reviewStatus === 'revision' ? 'Revision Sent' : 'Request Revision'}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="px-6 py-5 flex flex-col gap-4">
                        <div className="bg-[#fff8ed] border border-[#fde68a] rounded-xl px-4 py-3 flex items-start gap-2.5">
                            <AlertTriangle size={14} className="text-[#d97706] mt-0.5 shrink-0" />
                            <div>
                                <p className="text-[13px] font-semibold text-[#92400e]">Requesting revision for {student.name}</p>
                                <p className="text-[12px] text-[#92400e] opacity-80 mt-0.5">Select a reason below. The operator will be notified and the ID will be flagged for correction.</p>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-[12px] font-semibold text-[#374151] uppercase tracking-[0.4px]">Reason for Revision</label>
                            {REVISION_REASONS.map((reason) => (
                                <label key={reason}
                                    className={cn(
                                        'flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-all',
                                        selectedReason === reason
                                            ? 'border-[#d97706] bg-[#fffbeb]'
                                            : 'border-[#e2e8f0] hover:border-[#fde68a] hover:bg-[#fffdf5]'
                                    )}>
                                    <div className={cn(
                                        'w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all',
                                        selectedReason === reason ? 'border-[#d97706] bg-[#d97706]' : 'border-[#c8cbd9]'
                                    )}>
                                        {selectedReason === reason && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                    </div>
                                    <span className="text-[13px] text-[#374151]">{reason}</span>
                                    <input type="radio" name="reason" value={reason} className="hidden"
                                        checked={selectedReason === reason} onChange={() => setSelectedReason(reason)} />
                                </label>
                            ))}
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-[12px] font-semibold text-[#374151] uppercase tracking-[0.4px]">
                                Additional Notes <span className="text-[#9ba3af] normal-case font-normal">(optional)</span>
                            </label>
                            <textarea
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                placeholder="Describe the issue in more detail..."
                                rows={3}
                                className="border border-[#e2e8f0] rounded-xl px-3 py-2.5 text-[13px] text-[#374151] placeholder-[#c8cbd9] focus:outline-none focus:ring-2 focus:ring-[#fde68a] focus:border-[#d97706] transition-colors resize-none"
                            />
                        </div>

                        <div className="flex items-center gap-2.5">
                            <button onClick={() => setMode('preview')}
                                className="px-4 py-2.5 rounded-xl border border-[#e2e8f0] text-[13px] text-[#64748b] hover:bg-[#f8fafc] transition-colors">
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmitRevision}
                                disabled={!selectedReason || loading}
                                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#dc2626] text-white text-[13px] font-semibold hover:bg-[#b91c1c] disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm">
                                <RotateCcw size={15} />
                                {loading ? 'Submitting…' : 'Submit Revision'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
