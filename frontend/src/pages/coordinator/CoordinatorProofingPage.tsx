import { useState, useEffect, useCallback } from 'react'
import {
    CheckCircle2, RotateCcw, AlertTriangle, CreditCard,
    QrCode, X, ArrowLeft, Check,
} from 'lucide-react'
import { cn } from '../../lib/utils'
import api from '../../utils/api'
import toast from 'react-hot-toast'
import type { CoordOrder } from '../../components/coordinator/coordinatorTypes'
import { REVISION_REASONS, getInitials, getHue } from '../../components/coordinator/coordinatorTypes'

// ── Types ─────────────────────────────────────────────────────────────────────

type CardReviewStatus = 'pending' | 'approved' | 'revision'

interface ProofStudent {
    id: number
    full_name: string
    student_id: string
    grade_level: string
    photo_status: string
    is_approved: boolean
    processed_photo?: string
}

// ── Avatar ────────────────────────────────────────────────────────────────────

function Avatar({ name, id, size = 36 }: { name: string; id: number; size?: number }) {
    const hue = getHue(id)
    return (
        <div
            className="rounded-full flex items-center justify-center text-white font-bold shrink-0"
            style={{ width: size, height: size, fontSize: size * 0.33, background: `hsl(${hue}, 55%, 48%)` }}>
            {getInitials(name)}
        </div>
    )
}

// ── ID Preview Modal ──────────────────────────────────────────────────────────

function IDPreviewModal({
    student,
    reviewStatus,
    onApprove,
    onRevise,
    onClose,
}: {
    student: ProofStudent
    reviewStatus: CardReviewStatus
    onApprove: () => void
    onRevise: (reason: string, note: string) => void
    onClose: () => void
}) {
    const [mode, setMode] = useState<'preview' | 'revise'>('preview')
    const [selectedReason, setSelectedReason] = useState('')
    const [note, setNote] = useState('')
    const [loading, setLoading] = useState(false)

    const hue = getHue(student.id)
    const bg = `hsl(${hue}, 55%, 48%)`

    const handleApprove = async () => {
        setLoading(true)
        try {
            await api.post(`/students/${student.id}/approve/`)
            onApprove()
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Failed to approve')
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
            onRevise(selectedReason, note)
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Failed to request revision')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
            <div className="absolute inset-0 bg-[rgba(15,23,42,0.4)] backdrop-blur-[2px]" onClick={onClose} />
            <div className="relative bg-white w-full sm:w-[480px] sm:rounded-2xl rounded-t-2xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.18)] max-h-[90vh] flex flex-col">

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-[#f1f5f9] shrink-0">
                    <div className="flex items-center gap-2">
                        {mode === 'revise' && (
                            <button onClick={() => setMode('preview')}
                                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#f1f5f9] transition-colors">
                                <ArrowLeft size={14} className="text-[#64748b]" />
                            </button>
                        )}
                        <div className="w-8 h-8 rounded-lg bg-[#e8eeff] flex items-center justify-center">
                            <CreditCard size={15} className="text-[#004ac6]" />
                        </div>
                        <div>
                            <h2 className="text-[15px] font-bold text-[#0b1c30]">
                                {mode === 'preview' ? 'ID Preview' : 'Request Revision'}
                            </h2>
                            <p className="text-[11px] text-[#9ba3af]">{student.student_id}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#f1f5f9] transition-colors">
                        <X size={16} className="text-[#64748b]" />
                    </button>
                </div>

                <div className="overflow-y-auto flex-1">
                    {mode === 'preview' ? (
                        <div className="px-5 py-5 flex flex-col gap-5">
                            {/* ID card visual */}
                            <div className="mx-auto w-full max-w-[320px] rounded-2xl overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.12)] border border-[#e2e8f0]">
                                <div className="h-3" style={{ background: bg }} />
                                <div className="bg-white px-4 py-4 flex items-start gap-3">
                                    {/* Photo / Avatar */}
                                    <div className="w-[64px] h-[80px] rounded-xl border-2 border-[#e2e8f0] bg-[#f8fafc] flex items-center justify-center shrink-0 overflow-hidden">
                                        {student.processed_photo ? (
                                            <img src={student.processed_photo} alt={student.full_name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="flex flex-col items-center gap-1">
                                                <Avatar name={student.full_name} id={student.id} size={36} />
                                                <span className="text-[8px] text-[#c8cbd9] font-medium">PHOTO</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0 pt-0.5">
                                        <p className="text-[14px] font-bold text-[#0b1c30] leading-tight">{student.full_name}</p>
                                        <p className="text-[11px] text-[#64748b] mt-0.5">{student.grade_level}</p>
                                        <div className="mt-2.5 space-y-1">
                                            <div className="flex gap-2">
                                                <span className="text-[10px] text-[#9ba3af] w-[56px]">ID</span>
                                                <span className="text-[10px] font-mono font-semibold text-[#374151]">{student.student_id}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="w-10 h-10 rounded-lg border border-[#e2e8f0] bg-[#f8fafc] flex items-center justify-center shrink-0">
                                        <QrCode size={20} className="text-[#c8cbd9]" />
                                    </div>
                                </div>
                                <div className="px-4 py-1.5 border-t border-[#f1f5f9]">
                                    <span className="text-[9px] font-bold text-[#9ba3af] tracking-widest">INSTITUTION ID CARD</span>
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
                                        : <><AlertTriangle size={15} /> Revision requested</>}
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex gap-2.5">
                                <button
                                    onClick={handleApprove}
                                    disabled={loading || reviewStatus === 'approved'}
                                    className={cn(
                                        'flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[14px] font-semibold transition-all shadow-sm',
                                        reviewStatus === 'approved'
                                            ? 'bg-[#dcfce7] text-[#166534] border border-[#bbf7d0] cursor-default'
                                            : 'bg-[#004ac6] text-white hover:bg-[#003da6] disabled:opacity-50'
                                    )}>
                                    <CheckCircle2 size={16} />
                                    {reviewStatus === 'approved' ? 'Approved' : loading ? 'Approving…' : 'Approve'}
                                </button>
                                <button
                                    onClick={() => setMode('revise')}
                                    disabled={loading}
                                    className={cn(
                                        'flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[14px] font-semibold border transition-all',
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
                        <div className="px-5 py-5 flex flex-col gap-4">
                            <div className="bg-[#fff8ed] border border-[#fde68a] rounded-xl px-4 py-3 flex items-start gap-2.5">
                                <AlertTriangle size={14} className="text-[#d97706] mt-0.5 shrink-0" />
                                <p className="text-[13px] text-[#92400e] leading-5">
                                    Select a reason for revision. The operator will be notified.
                                </p>
                            </div>

                            <div className="flex flex-col gap-2">
                                {REVISION_REASONS.map((r) => (
                                    <label key={r}
                                        className={cn(
                                            'flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-all',
                                            selectedReason === r ? 'border-[#d97706] bg-[#fffbeb]' : 'border-[#e2e8f0] hover:border-[#fde68a]'
                                        )}>
                                        <div className={cn(
                                            'w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0',
                                            selectedReason === r ? 'border-[#d97706] bg-[#d97706]' : 'border-[#c8cbd9]'
                                        )}>
                                            {selectedReason === r && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                        </div>
                                        <span className="text-[13px] text-[#374151]">{r}</span>
                                        <input type="radio" name="rev-reason" className="hidden" value={r}
                                            checked={selectedReason === r} onChange={() => setSelectedReason(r)} />
                                    </label>
                                ))}
                            </div>

                            <textarea value={note} onChange={(e) => setNote(e.target.value)}
                                placeholder="Additional notes (optional)..."
                                rows={3}
                                className="border border-[#e2e8f0] rounded-xl px-3 py-2.5 text-[13px] text-[#374151] placeholder-[#c8cbd9] focus:outline-none focus:ring-2 focus:ring-[#fde68a] focus:border-[#d97706] transition-colors resize-none" />

                            <div className="flex gap-2.5 pb-1">
                                <button onClick={() => setMode('preview')}
                                    className="px-4 py-3 rounded-xl border border-[#e2e8f0] text-[13px] text-[#64748b] hover:bg-[#f8fafc] transition-colors">
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSubmitRevision}
                                    disabled={!selectedReason || loading}
                                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[#dc2626] text-white text-[13px] font-semibold hover:bg-[#b91c1c] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                                    <RotateCcw size={15} />
                                    {loading ? 'Submitting…' : 'Submit Revision'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function CoordinatorProofingPage() {
    const [proofingOrders, setProofingOrders] = useState<CoordOrder[]>([])
    const [selectedOrder, setSelectedOrder] = useState<CoordOrder | null>(null)
    const [students, setStudents] = useState<ProofStudent[]>([])
    const [cardStatuses, setCardStatuses] = useState<Record<number, CardReviewStatus>>({})
    const [previewStudent, setPreviewStudent] = useState<ProofStudent | null>(null)
    const [loadingOrders, setLoadingOrders] = useState(true)
    const [loadingStudents, setLoadingStudents] = useState(false)

    // Fetch orders in proofing state
    useEffect(() => {
        setLoadingOrders(true)
        api.get('/coordinator/proofing-orders/')
            .then((res) => setProofingOrders(res.data))
            .catch(() => toast.error('Failed to load proofing orders'))
            .finally(() => setLoadingOrders(false))
    }, [])

    const openOrder = useCallback(async (order: CoordOrder) => {
        setSelectedOrder(order)
        setLoadingStudents(true)
        try {
            const res = await api.get(`/orders/${order.id}/students/`)
            const data: ProofStudent[] = res.data
            setStudents(data)
            const init: Record<number, CardReviewStatus> = {}
            data.forEach((s) => {
                if (s.is_approved) init[s.id] = 'approved'
                else if (s.photo_status === 'MANUAL_REVIEW') init[s.id] = 'revision'
                else init[s.id] = 'pending'
            })
            setCardStatuses(init)
        } catch {
            toast.error('Failed to load students')
        } finally {
            setLoadingStudents(false)
        }
    }, [])

    const handleApprove = (studentId: number) => {
        setCardStatuses((prev) => ({ ...prev, [studentId]: 'approved' }))
        setPreviewStudent(null)
    }

    const handleRevise = (studentId: number, _reason: string, _note: string) => {
        setCardStatuses((prev) => ({ ...prev, [studentId]: 'revision' }))
        setPreviewStudent(null)
    }

    const approvedCount = Object.values(cardStatuses).filter((s) => s === 'approved').length
    const revisionCount = Object.values(cardStatuses).filter((s) => s === 'revision').length
    const pendingCount = Object.values(cardStatuses).filter((s) => s === 'pending').length

    // ── Order list view ────────────────────────────────────────────────────────

    if (!selectedOrder) {
        return (
            <div className="flex flex-col gap-0">
                <div className="px-4 md:px-8 pt-6 pb-4 border-b border-[#eceef0] bg-white">
                    <div className="flex items-center gap-3">
                        <h1 className="text-[22px] md:text-[24px] font-bold text-[#0b1c30] tracking-[-0.3px]">Proofing</h1>
                        {proofingOrders.length > 0 && (
                            <span className="bg-[#fef3c7] text-[#92400e] text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                                {proofingOrders.length} pending
                            </span>
                        )}
                    </div>
                    <p className="text-[13px] text-[#64748b] mt-1">Review final ID card outputs for photographed students.</p>
                </div>

                <div className="px-4 md:px-8 py-5 pb-[100px] md:pb-6 bg-[#f7f8fa] flex flex-col gap-3">
                    {loadingOrders ? (
                        <div className="flex items-center justify-center py-16">
                            <div className="w-6 h-6 border-2 border-[#004ac6] border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : proofingOrders.length === 0 ? (
                        <div className="bg-white border border-[#e2e8f0] rounded-2xl flex flex-col items-center justify-center py-16 gap-3 shadow-[0px_1px_2px_rgba(0,0,0,0.04)]">
                            <CheckCircle2 size={28} className="text-[#c8cbd9]" />
                            <p className="text-[14px] font-semibold text-[#9ba3af]">No orders pending review</p>
                            <p className="text-[12px] text-[#c8cbd9] text-center max-w-[220px]">
                                Orders will appear here once ID cards are ready for proofing.
                            </p>
                        </div>
                    ) : (
                        proofingOrders.map((order) => (
                            <div key={order.id}
                                className="bg-white border border-[#e2e8f0] rounded-2xl p-5 shadow-[0px_1px_2px_rgba(0,0,0,0.04)] hover:shadow-md hover:border-[#c7d4f0] transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-[#e8eeff] flex items-center justify-center shrink-0">
                                        <CreditCard size={22} className="text-[#004ac6]" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-[15px] font-bold text-[#0b1c30] truncate">{order.school_name}</div>
                                        <div className="text-[12px] text-[#9ba3af]">{order.batch_name} · {order.student_count} students</div>
                                    </div>
                                    <button
                                        onClick={() => openOrder(order)}
                                        className="flex items-center gap-2 bg-[#004ac6] text-white text-[13px] font-medium px-4 py-2 rounded-lg hover:bg-[#003da6] transition-colors shadow-sm shrink-0">
                                        Review IDs
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        )
    }

    // ── Detail / card grid view ────────────────────────────────────────────────

    return (
        <div className="flex flex-col gap-0">
            {previewStudent && (
                <IDPreviewModal
                    student={previewStudent}
                    reviewStatus={cardStatuses[previewStudent.id] ?? 'pending'}
                    onApprove={() => handleApprove(previewStudent.id)}
                    onRevise={(r, n) => handleRevise(previewStudent.id, r, n)}
                    onClose={() => setPreviewStudent(null)}
                />
            )}

            {/* Header */}
            <div className="px-4 md:px-8 pt-6 pb-4 border-b border-[#eceef0] bg-white">
                <button
                    onClick={() => { setSelectedOrder(null); setStudents([]); setCardStatuses({}) }}
                    className="flex items-center gap-1.5 text-[12px] text-[#9ba3af] hover:text-[#004ac6] transition-colors mb-3">
                    <ArrowLeft size={12} />
                    Back to orders
                </button>
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-[20px] md:text-[22px] font-bold text-[#0b1c30] tracking-[-0.3px]">
                                {selectedOrder.school_name}
                            </h1>
                        </div>
                        <p className="text-[13px] text-[#64748b] mt-1">
                            {selectedOrder.batch_name} · {students.length} students
                        </p>
                    </div>
                </div>
            </div>

            {/* Stats strip */}
            <div className="px-4 md:px-8 py-3 bg-[#f8fafc] border-b border-[#f1f5f9] flex items-center gap-5 overflow-x-auto">
                {[
                    { label: 'Approved', count: approvedCount, color: '#166534', dot: '#22c55e' },
                    { label: 'Revisions', count: revisionCount, color: '#b91c1c', dot: '#ef4444' },
                    { label: 'Pending', count: pendingCount, color: '#92400e', dot: '#d97706' },
                ].map(({ label, count, color, dot }) => (
                    <div key={label} className="flex items-center gap-2 shrink-0">
                        <span className="w-2 h-2 rounded-full" style={{ background: dot }} />
                        <span className="text-[13px] text-[#64748b]">{label}: <strong style={{ color }}>{count}</strong></span>
                    </div>
                ))}
            </div>

            {/* Card grid */}
            {loadingStudents ? (
                <div className="flex items-center justify-center py-16">
                    <div className="w-8 h-8 border-2 border-[#004ac6] border-t-transparent rounded-full animate-spin" />
                </div>
            ) : (
                <>
                    {/* Mobile: list */}
                    <div className="md:hidden px-4 py-4 bg-[#f7f8fa] flex flex-col gap-3 pb-[100px]">
                        {students.map((student) => {
                            const status = cardStatuses[student.id] ?? 'pending'
                            const hue = getHue(student.id)
                            const bg = `hsl(${hue}, 55%, 48%)`
                            return (
                                <div key={student.id}
                                    onClick={() => setPreviewStudent(student)}
                                    className={cn(
                                        'bg-white border rounded-2xl overflow-hidden cursor-pointer active:scale-[0.99] transition-all shadow-[0px_1px_2px_rgba(0,0,0,0.04)]',
                                        status === 'approved' ? 'border-[#bbf7d0]' :
                                            status === 'revision' ? 'border-[#fca5a5]' : 'border-[#e2e8f0]'
                                    )}>
                                    <div className="h-1.5" style={{ background: bg }} />
                                    <div className="flex items-center gap-3 px-4 py-3.5">
                                        <Avatar name={student.full_name} id={student.id} size={44} />
                                        <div className="flex-1 min-w-0">
                                            <div className="text-[14px] font-bold text-[#0b1c30]">{student.full_name}</div>
                                            <div className="text-[12px] text-[#64748b]">{student.grade_level}</div>
                                            <div className="text-[11px] font-mono text-[#9ba3af]">{student.student_id}</div>
                                        </div>
                                        <div className="shrink-0">
                                            {status === 'approved' ? (
                                                <div className="w-8 h-8 rounded-full bg-[#dcfce7] flex items-center justify-center">
                                                    <Check size={14} className="text-[#166634]" />
                                                </div>
                                            ) : status === 'revision' ? (
                                                <div className="w-8 h-8 rounded-full bg-[#ffdad6] flex items-center justify-center">
                                                    <RotateCcw size={14} className="text-[#b91c1c]" />
                                                </div>
                                            ) : (
                                                <div className="w-8 h-8 rounded-full bg-[#f1f5f9] flex items-center justify-center">
                                                    <CreditCard size={14} className="text-[#9ba3af]" />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    {/* Desktop: grid */}
                    <div className="hidden md:block px-8 py-6 bg-[#f7f8fa]">
                        <div className="grid grid-cols-5 xl:grid-cols-6 gap-4">
                            {students.map((student) => {
                                const status = cardStatuses[student.id] ?? 'pending'
                                const hue = getHue(student.id)
                                const bg = `hsl(${hue}, 55%, 48%)`
                                return (
                                    <div key={student.id}
                                        onClick={() => setPreviewStudent(student)}
                                        className={cn(
                                            'bg-white rounded-xl overflow-hidden border transition-all hover:shadow-lg cursor-pointer',
                                            status === 'approved' ? 'border-[#bbf7d0] ring-1 ring-[rgba(34,197,94,0.2)]' :
                                                status === 'revision' ? 'border-[#fca5a5] ring-1 ring-[rgba(239,68,68,0.2)]' :
                                                    'border-[#e2e8f0] hover:border-[#c7d4f0]'
                                        )}>
                                        <div className="relative bg-[#f8fafc]" style={{ paddingTop: '75%' }}>
                                            <div className="absolute top-2 right-2">
                                                {status === 'approved' ? (
                                                    <div className="w-6 h-6 rounded-full bg-[#dcfce7] flex items-center justify-center border border-[#bbf7d0]">
                                                        <Check size={11} className="text-[#166634]" />
                                                    </div>
                                                ) : status === 'revision' ? (
                                                    <div className="w-6 h-6 rounded-full bg-[#ffdad6] flex items-center justify-center border border-[#fca5a5]">
                                                        <RotateCcw size={11} className="text-[#b91c1c]" />
                                                    </div>
                                                ) : (
                                                    <div className="w-6 h-6 rounded-full bg-[#f1f5f9] flex items-center justify-center border border-[#e2e8f0]">
                                                        <CreditCard size={11} className="text-[#9ba3af]" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                {student.processed_photo ? (
                                                    <img src={student.processed_photo} alt={student.full_name}
                                                        className="w-full h-full object-cover" />
                                                ) : (
                                                    <Avatar name={student.full_name} id={student.id} size={44} />
                                                )}
                                            </div>
                                            <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: bg }} />
                                        </div>
                                        <div className={cn(
                                            'px-3 py-2.5 border-t',
                                            status === 'approved' ? 'border-[#bbf7d0]' :
                                                status === 'revision' ? 'border-[#fca5a5]' : 'border-[#f1f5f9]'
                                        )}>
                                            <div className="text-[12px] font-semibold text-[#0b1c30] truncate">{student.full_name}</div>
                                            <div className="text-[10px] text-[#9ba3af] truncate mt-0.5">{student.grade_level}</div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>

                        {students.length === 0 && (
                            <div className="flex flex-col items-center py-16 gap-2">
                                <CreditCard size={28} className="text-[#c8cbd9]" />
                                <p className="text-[14px] text-[#9ba3af]">No student records found for this order.</p>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    )
}
