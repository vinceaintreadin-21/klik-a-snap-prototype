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

interface ProofSubject {
    id: number
    full_name: string
    student_id: string
    grade_level: string
    section?: string
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

// ── Status badge icon ─────────────────────────────────────────────────────────

function StatusBadge({ status, size = 14 }: { status: CardReviewStatus; size?: number }) {
    if (status === 'approved') {
        return (
            <div className="w-8 h-8 rounded-full bg-[#dcfce7] flex items-center justify-center">
                <Check size={size} className="text-[#166634]" />
            </div>
        )
    }
    if (status === 'revision') {
        return (
            <div className="w-8 h-8 rounded-full bg-[#ffdad6] flex items-center justify-center">
                <RotateCcw size={size} className="text-[#b91c1c]" />
            </div>
        )
    }
    return (
        <div className="w-8 h-8 rounded-full bg-[#f1f5f9] flex items-center justify-center">
            <CreditCard size={size} className="text-[#9ba3af]" />
        </div>
    )
}

// ── Revision reason picker ────────────────────────────────────────────────────

function RevisionReasonPicker({
    selected,
    onChange,
}: {
    selected: string
    onChange: (r: string) => void
}) {
    return (
        <div className="flex flex-col gap-2">
            {REVISION_REASONS.map((r) => (
                <label
                    key={r}
                    className={cn(
                        'flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-all',
                        selected === r
                            ? 'border-[#d97706] bg-[#fffbeb]'
                            : 'border-[#e2e8f0] hover:border-[#fde68a]'
                    )}>
                    <div
                        className={cn(
                            'w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0',
                            selected === r ? 'border-[#d97706] bg-[#d97706]' : 'border-[#c8cbd9]'
                        )}>
                        {selected === r && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                    <span className="text-[13px] text-[#374151]">{r}</span>
                    <input
                        type="radio"
                        name="rev-reason"
                        className="hidden"
                        value={r}
                        checked={selected === r}
                        onChange={() => onChange(r)}
                    />
                </label>
            ))}
        </div>
    )
}

// ── ID Preview Modal ──────────────────────────────────────────────────────────

function IDPreviewModal({
    subject,
    reviewStatus,
    onApprove,
    onRevise,
    onClose,
}: {
    subject: ProofSubject
    reviewStatus: CardReviewStatus
    onApprove: () => void
    onRevise: (reason: string, note: string) => void
    onClose: () => void
}) {
    const [mode, setMode] = useState<'preview' | 'revise'>('preview')
    const [selectedReason, setSelectedReason] = useState('')
    const [note, setNote] = useState('')
    const [loading, setLoading] = useState(false)

    const hue = getHue(subject.id)
    const bg = `hsl(${hue}, 55%, 48%)`

    const handleApprove = async () => {
        setLoading(true)
        try {
            await api.post(`/students/${subject.id}/approve/`)
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
            await api.post(`/students/${subject.id}/request-revision/`, {
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
            <div
                className="absolute inset-0 bg-[rgba(15,23,42,0.4)] backdrop-blur-[2px]"
                onClick={onClose}
            />
            <div className="relative bg-white w-full sm:w-[480px] sm:rounded-2xl rounded-t-2xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.18)] max-h-[90vh] flex flex-col">

                {/* Modal header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-[#f1f5f9] shrink-0">
                    <div className="flex items-center gap-2">
                        {mode === 'revise' && (
                            <button
                                onClick={() => setMode('preview')}
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
                            <p className="text-[11px] text-[#9ba3af]">{subject.student_id}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#f1f5f9] transition-colors">
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
                                    {/* Photo thumbnail */}
                                    <div className="w-[64px] h-[80px] rounded-xl border-2 border-[#e2e8f0] bg-[#f8fafc] flex items-center justify-center shrink-0 overflow-hidden">
                                        {subject.processed_photo ? (
                                            <img
                                                src={subject.processed_photo}
                                                alt={subject.full_name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="flex flex-col items-center gap-1">
                                                <Avatar name={subject.full_name} id={subject.id} size={36} />
                                                <span className="text-[8px] text-[#c8cbd9] font-medium">PHOTO</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0 pt-0.5">
                                        <p className="text-[14px] font-bold text-[#0b1c30] leading-tight">
                                            {subject.full_name}
                                        </p>
                                        <p className="text-[11px] text-[#64748b] mt-0.5">
                                            {subject.grade_level}
                                            {subject.section ? ` · ${subject.section}` : ''}
                                        </p>
                                        <div className="mt-2.5 space-y-1">
                                            <div className="flex gap-2">
                                                <span className="text-[10px] text-[#9ba3af] w-[56px]">ID</span>
                                                <span className="text-[10px] font-mono font-semibold text-[#374151]">
                                                    {subject.student_id}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="w-10 h-10 rounded-lg border border-[#e2e8f0] bg-[#f8fafc] flex items-center justify-center shrink-0">
                                        <QrCode size={20} className="text-[#c8cbd9]" />
                                    </div>
                                </div>
                                <div className="px-4 py-1.5 border-t border-[#f1f5f9]">
                                    <span className="text-[9px] font-bold text-[#9ba3af] tracking-widest">
                                        INSTITUTION ID CARD
                                    </span>
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

                            {/* Action buttons */}
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
                        /* Revision form */
                        <div className="px-5 py-5 flex flex-col gap-4">
                            <div className="bg-[#fff8ed] border border-[#fde68a] rounded-xl px-4 py-3 flex items-start gap-2.5">
                                <AlertTriangle size={14} className="text-[#d97706] mt-0.5 shrink-0" />
                                <p className="text-[13px] text-[#92400e] leading-5">
                                    Select a reason for revision. The operator will be notified.
                                </p>
                            </div>

                            <RevisionReasonPicker
                                selected={selectedReason}
                                onChange={setSelectedReason}
                            />

                            <textarea
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                placeholder="Additional notes (optional)..."
                                rows={3}
                                className="border border-[#e2e8f0] rounded-xl px-3 py-2.5 text-[13px] text-[#374151] placeholder-[#c8cbd9] focus:outline-none focus:ring-2 focus:ring-[#fde68a] focus:border-[#d97706] transition-colors resize-none"
                            />

                            <div className="flex gap-2.5 pb-1">
                                <button
                                    onClick={() => setMode('preview')}
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

// ── Order list card ───────────────────────────────────────────────────────────

function ProofingOrderCard({
    order,
    onOpen,
}: {
    order: CoordOrder
    onOpen: (o: CoordOrder) => void
}) {
    return (
        <div className="bg-white border border-[#e2e8f0] rounded-2xl p-5 shadow-[0px_1px_2px_rgba(0,0,0,0.04)] hover:shadow-md hover:border-[#c7d4f0] transition-all">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#e8eeff] flex items-center justify-center shrink-0">
                    <CreditCard size={22} className="text-[#004ac6]" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="text-[15px] font-bold text-[#0b1c30] truncate">{order.school_name}</div>
                    <div className="text-[12px] text-[#9ba3af]">
                        {order.batch_name} · {order.student_count} subjects
                    </div>
                </div>
                <button
                    onClick={() => onOpen(order)}
                    className="flex items-center gap-2 bg-[#004ac6] text-white text-[13px] font-medium px-4 py-2 rounded-lg hover:bg-[#003da6] transition-colors shadow-sm shrink-0">
                    Review IDs
                </button>
            </div>
        </div>
    )
}

// ── Mobile subject card (proofing list) ───────────────────────────────────────

function ProofMobileCard({
    subject,
    status,
    onClick,
}: {
    subject: ProofSubject
    status: CardReviewStatus
    onClick: () => void
}) {
    const hue = getHue(subject.id)
    const bg = `hsl(${hue}, 55%, 48%)`

    return (
        <div
            onClick={onClick}
            className={cn(
                'bg-white border rounded-2xl overflow-hidden cursor-pointer active:scale-[0.99] transition-all shadow-[0px_1px_2px_rgba(0,0,0,0.04)]',
                status === 'approved' ? 'border-[#bbf7d0]' :
                    status === 'revision' ? 'border-[#fca5a5]' : 'border-[#e2e8f0]'
            )}>
            <div className="h-1.5" style={{ background: bg }} />
            <div className="flex items-center gap-3 px-4 py-3.5">
                <Avatar name={subject.full_name} id={subject.id} size={44} />
                <div className="flex-1 min-w-0">
                    <div className="text-[14px] font-bold text-[#0b1c30]">{subject.full_name}</div>
                    <div className="text-[12px] text-[#64748b]">
                        {subject.grade_level}{subject.section ? ` · ${subject.section}` : ''}
                    </div>
                    <div className="text-[11px] font-mono text-[#9ba3af]">{subject.student_id}</div>
                </div>
                <StatusBadge status={status} />
            </div>
        </div>
    )
}

// ── Desktop grid card (proofing grid) ─────────────────────────────────────────

function ProofGridCard({
    subject,
    status,
    onClick,
}: {
    subject: ProofSubject
    status: CardReviewStatus
    onClick: () => void
}) {
    const hue = getHue(subject.id)
    const bg = `hsl(${hue}, 55%, 48%)`

    const borderClass =
        status === 'approved' ? 'border-[#bbf7d0] ring-1 ring-[rgba(34,197,94,0.2)]' :
            status === 'revision' ? 'border-[#fca5a5] ring-1 ring-[rgba(239,68,68,0.2)]' :
                'border-[#e2e8f0] hover:border-[#c7d4f0]'

    const badgeBorder =
        status === 'approved' ? 'border-[#bbf7d0]' :
            status === 'revision' ? 'border-[#fca5a5]' : 'border-[#e2e8f0]'

    const badgeBg =
        status === 'approved' ? 'bg-[#dcfce7]' :
            status === 'revision' ? 'bg-[#ffdad6]' : 'bg-[#f1f5f9]'

    const BadgeIcon =
        status === 'approved' ? <Check size={11} className="text-[#166634]" /> :
            status === 'revision' ? <RotateCcw size={11} className="text-[#b91c1c]" /> :
                <CreditCard size={11} className="text-[#9ba3af]" />

    const footerBorder =
        status === 'approved' ? 'border-[#bbf7d0]' :
            status === 'revision' ? 'border-[#fca5a5]' : 'border-[#f1f5f9]'

    return (
        <div
            onClick={onClick}
            className={cn(
                'bg-white rounded-xl overflow-hidden border transition-all hover:shadow-lg cursor-pointer',
                borderClass
            )}>
            <div className="relative bg-[#f8fafc]" style={{ paddingTop: '75%' }}>
                {/* Status dot */}
                <div className="absolute top-2 right-2">
                    <div className={cn('w-6 h-6 rounded-full flex items-center justify-center border', badgeBg, badgeBorder)}>
                        {BadgeIcon}
                    </div>
                </div>
                {/* Photo or avatar */}
                <div className="absolute inset-0 flex items-center justify-center">
                    {subject.processed_photo ? (
                        <img
                            src={subject.processed_photo}
                            alt={subject.full_name}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <Avatar name={subject.full_name} id={subject.id} size={44} />
                    )}
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: bg }} />
            </div>
            <div className={cn('px-3 py-2.5 border-t', footerBorder)}>
                <div className="text-[12px] font-semibold text-[#0b1c30] truncate">{subject.full_name}</div>
                <div className="text-[10px] text-[#9ba3af] truncate">
                    {subject.grade_level}{subject.section ? ` · ${subject.section}` : ''}
                </div>
            </div>
        </div>
    )
}

// ── Stats strip ───────────────────────────────────────────────────────────────

function StatsStrip({
    approved,
    revisions,
    pending,
}: {
    approved: number
    revisions: number
    pending: number
}) {
    return (
        <div className="px-4 md:px-8 py-3 bg-[#f8fafc] border-b border-[#f1f5f9] flex items-center gap-5 overflow-x-auto">
            {[
                { label: 'Approved', count: approved, color: '#166534', dot: '#22c55e' },
                { label: 'Revisions', count: revisions, color: '#b91c1c', dot: '#ef4444' },
                { label: 'Pending', count: pending, color: '#92400e', dot: '#d97706' },
            ].map(({ label, count, color, dot }) => (
                <div key={label} className="flex items-center gap-2 shrink-0">
                    <span className="w-2 h-2 rounded-full" style={{ background: dot }} />
                    <span className="text-[13px] text-[#64748b]">
                        {label}: <strong style={{ color }}>{count}</strong>
                    </span>
                </div>
            ))}
        </div>
    )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CoordinatorProofingPage() {
    const [proofingOrders, setProofingOrders] = useState<CoordOrder[]>([])
    const [selectedOrder, setSelectedOrder] = useState<CoordOrder | null>(null)
    const [subjects, setSubjects] = useState<ProofSubject[]>([])
    const [cardStatuses, setCardStatuses] = useState<Record<number, CardReviewStatus>>({})
    const [previewSubject, setPreviewSubject] = useState<ProofSubject | null>(null)
    const [loadingOrders, setLoadingOrders] = useState(true)
    const [loadingSubjects, setLoadingSubjects] = useState(false)

    // Fetch orders in PROOFING status
    useEffect(() => {
        setLoadingOrders(true)
        api.get('/coordinator/proofing-orders/')
            .then((res) => setProofingOrders(res.data))
            .catch(() => toast.error('Failed to load proofing orders'))
            .finally(() => setLoadingOrders(false))
    }, [])

    const openOrder = useCallback(async (order: CoordOrder) => {
        setSelectedOrder(order)
        setLoadingSubjects(true)
        try {
            const res = await api.get(`/orders/${order.id}/students/`)
            const data: ProofSubject[] = res.data
            setSubjects(data)
            const init: Record<number, CardReviewStatus> = {}
            data.forEach((s) => {
                if (s.is_approved) init[s.id] = 'approved'
                else if (s.photo_status === 'MANUAL_REVIEW') init[s.id] = 'revision'
                else init[s.id] = 'pending'
            })
            setCardStatuses(init)
        } catch {
            toast.error('Failed to load subjects')
        } finally {
            setLoadingSubjects(false)
        }
    }, [])

    const handleApprove = (subjectId: number) => {
        setCardStatuses((prev) => ({ ...prev, [subjectId]: 'approved' }))
        setPreviewSubject(null)
    }

    const handleRevise = (subjectId: number) => {
        setCardStatuses((prev) => ({ ...prev, [subjectId]: 'revision' }))
        setPreviewSubject(null)
    }

    const approvedCount = Object.values(cardStatuses).filter((s) => s === 'approved').length
    const revisionCount = Object.values(cardStatuses).filter((s) => s === 'revision').length
    const pendingCount = Object.values(cardStatuses).filter((s) => s === 'pending').length

    // ── Order list view ────────────────────────────────────────────────────────

    if (!selectedOrder) {
        return (
            <div className="flex flex-col gap-0">
                {/* Header */}
                <div className="px-4 md:px-8 pt-6 pb-4 border-b border-[#eceef0] bg-white">
                    <div className="flex items-center gap-3">
                        <h1 className="text-[22px] md:text-[24px] font-bold text-[#0b1c30] tracking-[-0.3px]">
                            Proofing
                        </h1>
                        {proofingOrders.length > 0 && (
                            <span className="bg-[#fef3c7] text-[#92400e] text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                                {proofingOrders.length} pending
                            </span>
                        )}
                    </div>
                    <p className="text-[13px] text-[#64748b] mt-1">
                        Review final ID card outputs for photographed subjects.
                    </p>
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
                            <ProofingOrderCard key={order.id} order={order} onOpen={openOrder} />
                        ))
                    )}
                </div>
            </div>
        )
    }

    // ── Card grid / review view ────────────────────────────────────────────────

    return (
        <div className="flex flex-col gap-0">
            {previewSubject && (
                <IDPreviewModal
                    subject={previewSubject}
                    reviewStatus={cardStatuses[previewSubject.id] ?? 'pending'}
                    onApprove={() => handleApprove(previewSubject.id)}
                    onRevise={(_r, _n) => handleRevise(previewSubject.id)}
                    onClose={() => setPreviewSubject(null)}
                />
            )}

            {/* Header */}
            <div className="px-4 md:px-8 pt-6 pb-4 border-b border-[#eceef0] bg-white">
                <button
                    onClick={() => { setSelectedOrder(null); setSubjects([]); setCardStatuses({}) }}
                    className="flex items-center gap-1.5 text-[12px] text-[#9ba3af] hover:text-[#004ac6] transition-colors mb-3">
                    <ArrowLeft size={12} />
                    Back to orders
                </button>
                <div className="flex items-center gap-3">
                    <h1 className="text-[20px] md:text-[22px] font-bold text-[#0b1c30] tracking-[-0.3px]">
                        {selectedOrder.school_name}
                    </h1>
                    <span className="bg-[#004ac6] text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                        {subjects.length} IDs
                    </span>
                    {pendingCount > 0 && (
                        <span className="bg-[#fef3c7] text-[#92400e] text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                            {pendingCount} pending
                        </span>
                    )}
                </div>
                <p className="text-[13px] text-[#64748b] mt-1">
                    {selectedOrder.batch_name} · {subjects.length} subjects
                </p>
            </div>

            <StatsStrip
                approved={approvedCount}
                revisions={revisionCount}
                pending={pendingCount}
            />

            {loadingSubjects ? (
                <div className="flex items-center justify-center py-16">
                    <div className="w-8 h-8 border-2 border-[#004ac6] border-t-transparent rounded-full animate-spin" />
                </div>
            ) : (
                <>
                    {/* Mobile list */}
                    <div className="md:hidden px-4 py-4 bg-[#f7f8fa] flex flex-col gap-3 pb-[100px]">
                        {subjects.map((s) => (
                            <ProofMobileCard
                                key={s.id}
                                subject={s}
                                status={cardStatuses[s.id] ?? 'pending'}
                                onClick={() => setPreviewSubject(s)}
                            />
                        ))}
                        {subjects.length === 0 && (
                            <div className="flex flex-col items-center py-16 gap-2">
                                <CreditCard size={24} className="text-[#c8cbd9]" />
                                <p className="text-[13px] text-[#9ba3af]">No ID cards to review yet</p>
                            </div>
                        )}
                    </div>

                    {/* Desktop grid */}
                    <div className="hidden md:block px-8 py-6 bg-[#f7f8fa]">
                        <div className="grid grid-cols-5 xl:grid-cols-6 gap-4">
                            {subjects.map((s) => (
                                <ProofGridCard
                                    key={s.id}
                                    subject={s}
                                    status={cardStatuses[s.id] ?? 'pending'}
                                    onClick={() => setPreviewSubject(s)}
                                />
                            ))}
                        </div>
                        {subjects.length === 0 && (
                            <div className="flex flex-col items-center py-16 gap-2">
                                <CreditCard size={24} className="text-[#c8cbd9]" />
                                <p className="text-[13px] text-[#9ba3af]">No ID cards to review yet</p>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    )
}
