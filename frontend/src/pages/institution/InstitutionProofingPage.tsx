import { useState, useCallback } from 'react'
import {
    ChevronRight, CreditCard, CheckCircle2, RotateCcw,
    ArrowLeft, Check,
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { STATUS_CFG } from '../../components/institutions/institutionTypes'
import type { CardReviewStatus } from '../../components/institutions/institutionTypes'
import IDPreviewModal from '../../components/institutions/IDPreviewModal'
import api from '../../utils/api'
import { useOrders } from '../../context/OrderContext'

interface ProofStudent {
    id: number
    name: string
    student_id: string
    department?: string
    role?: string
    processed_photo?: string
    photo_status: string
    fail_reason?: string
}

export default function InstitutionProofingPage() {
    const { orders } = useOrders()

    // Proofing orders = those in PROOFING status
    const proofingOrders = orders.filter((o) => o.status === 'PROOFING' || o.status === 'PENDING APPROVAL')

    const [stage, setStage] = useState<'orders' | 'detail'>('orders')
    const [selectedOrder, setSelectedOrder] = useState<any | null>(null)
    const [students, setStudents] = useState<ProofStudent[]>([])
    const [loadingStudents, setLoadingStudents] = useState(false)
    const [previewStudent, setPreviewStudent] = useState<ProofStudent | null>(null)
    const [cardStatuses, setCardStatuses] = useState<Record<number, CardReviewStatus>>({})
    const [batchApproved, setBatchApproved] = useState(false)
    const [approvingBatch, setApprovingBatch] = useState(false)

    const fetchStudents = useCallback(async (orderId: number) => {
        setLoadingStudents(true)
        try {
            const res = await api.get(`/orders/${orderId}/students/`)
            const data: ProofStudent[] = res.data
            setStudents(data)
            // Seed statuses from existing backend state
            const initialStatuses: Record<number, CardReviewStatus> = {}
            data.forEach((s) => {
                if (s.photo_status === 'PROCESSED') initialStatuses[s.id] = 'approved'
                else if (s.photo_status === 'REVISION') initialStatuses[s.id] = 'revision'
                else initialStatuses[s.id] = 'pending'
            })
            setCardStatuses(initialStatuses)
        } catch (err) {
            console.error('Failed to load students', err)
        } finally {
            setLoadingStudents(false)
        }
    }, [])

    const openOrder = (order: any) => {
        setSelectedOrder(order)
        setStage('detail')
        setBatchApproved(false)
        fetchStudents(order.id)
    }

    const handleApprove = (studentId: number) => {
        setCardStatuses((prev) => ({ ...prev, [studentId]: 'approved' }))
        setPreviewStudent(null)
    }

    const handleRevise = (studentId: number, _reason: string, _note: string) => {
        setCardStatuses((prev) => ({ ...prev, [studentId]: 'revision' }))
        setPreviewStudent(null)
    }

    const handleApproveBatch = async () => {
        if (!selectedOrder) return
        setApprovingBatch(true)
        try {
            await api.post(`/orders/${selectedOrder.id}/approve/`)
            setBatchApproved(true)
        } catch (err: any) {
            alert(err.response?.data?.error || 'Failed to approve batch.')
        } finally {
            setApprovingBatch(false)
        }
    }

    const approvedCount = Object.values(cardStatuses).filter((s) => s === 'approved').length
    const revisionCount = Object.values(cardStatuses).filter((s) => s === 'revision').length
    const pendingCount = Object.values(cardStatuses).filter((s) => s === 'pending').length

    const getInitials = (name: string) => name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    const getHue = (id: number) => (id * 47) % 360

    // ── Orders list ──────────────────────────────────────────────────────────────

    if (stage === 'orders') {
        return (
            <div className="flex flex-col min-h-full">
                <div className="px-8 pt-7 pb-6 border-b border-[#eceef0] bg-white">
                    <nav className="flex items-center gap-1.5 text-[12px] mb-3">
                        <span className="text-[#9ba3af]">Institution</span>
                        <ChevronRight size={11} className="text-[#c8cbd9]" />
                        <span className="text-[#374151] font-medium">Proofing & Approvals</span>
                    </nav>
                    <div className="flex items-center gap-3">
                        <h1 className="text-[24px] font-bold text-[#0b1c30] leading-tight tracking-[-0.3px]">Proofing & Approvals</h1>
                        <span className="bg-[#004ac6] text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full">{proofingOrders.length} Orders</span>
                        {proofingOrders.length > 0 && (
                            <span className="bg-[#ffdad6] text-[#93000a] text-[11px] font-bold px-2.5 py-0.5 rounded-full">{proofingOrders.length} Pending</span>
                        )}
                    </div>
                    <p className="text-[14px] text-[#64748b] mt-1">Review final ID card outputs and approve or request revisions before production.</p>
                </div>

                <div className="px-8 py-6 bg-[#f7f8fa] flex-1 flex flex-col gap-4">
                    {proofingOrders.length === 0 ? (
                        <div className="bg-white border border-[#e2e8f0] rounded-2xl flex flex-col items-center justify-center py-20 gap-3 shadow-[0px_1px_2px_rgba(0,0,0,0.04)]">
                            <CheckCircle2 size={32} className="text-[#c8cbd9]" />
                            <p className="text-[15px] font-semibold text-[#9ba3af]">No orders pending approval</p>
                            <p className="text-[13px] text-[#c8cbd9]">Orders in PROOFING status will appear here for review.</p>
                        </div>
                    ) : (
                        proofingOrders.map((order) => {
                            const cfg = STATUS_CFG[order.status] ?? STATUS_CFG['PROCESSING']
                            return (
                                <div
                                    key={order.id}
                                    onClick={() => openOrder(order)}
                                    className="bg-white border border-[#e2e8f0] rounded-2xl p-6 shadow-[0px_1px_2px_rgba(0,0,0,0.04)] hover:shadow-md hover:border-[#c7d4f0] transition-all cursor-pointer">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex items-start gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-[#e8eeff] flex items-center justify-center shrink-0">
                                                <CreditCard size={22} className="text-[#004ac6]" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2.5 mb-1">
                                                    <span className="text-[15px] font-bold text-[#0b1c30]">{order.school_name}</span>
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold"
                                                        style={{ background: cfg.bg, color: cfg.text }}>
                                                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.text }} />
                                                        {order.status}
                                                    </span>
                                                </div>
                                                <p className="text-[13px] text-[#64748b]">{order.batch_name}</p>
                                                <div className="flex items-center gap-4 mt-2 text-[12px] text-[#9ba3af]">
                                                    <span><strong className="text-[#374151]">{order.student_count}</strong> students</span>
                                                    <span>Created {new Date(order.created_at).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); openOrder(order) }}
                                            className="flex items-center gap-2 bg-[#004ac6] text-white text-[13px] font-medium px-4 py-2 rounded-lg hover:bg-[#003da6] transition-colors shadow-sm shrink-0">
                                            Review IDs
                                            <ChevronRight size={14} />
                                        </button>
                                    </div>
                                </div>
                            )
                        })
                    )}

                    {/* All non-proofing orders in a lighter section */}
                    {orders.filter((o) => o.status !== 'PROOFING' && o.status !== 'PENDING APPROVAL').length > 0 && (
                        <div className="mt-2">
                            <p className="text-[12px] font-semibold text-[#9ba3af] uppercase tracking-wide mb-3">Other Orders</p>
                            {orders.filter((o) => o.status !== 'PROOFING' && o.status !== 'PENDING APPROVAL').map((order) => {
                                const cfg = STATUS_CFG[order.status] ?? STATUS_CFG['PROCESSING']
                                return (
                                    <div key={order.id} className="bg-white border border-[#f1f5f9] rounded-xl p-4 mb-2 opacity-60 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-[#f8fafc] flex items-center justify-center">
                                                <CreditCard size={15} className="text-[#c8cbd9]" />
                                            </div>
                                            <div>
                                                <span className="text-[13px] font-medium text-[#374151]">#{order.id} — {order.batch_name}</span>
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ml-2"
                                                    style={{ background: cfg.bg, color: cfg.text }}>
                                                    {order.status}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>
        )
    }

    // ── Detail stage ─────────────────────────────────────────────────────────────

    const order = selectedOrder!
    const cfg = STATUS_CFG[order.status] ?? STATUS_CFG['PROCESSING']

    return (
        <div className="flex flex-col min-h-full">
            {previewStudent && (
                <IDPreviewModal
                    student={{
                        ...previewStudent,
                        initials: getInitials(previewStudent.name),
                        hue: getHue(previewStudent.id),
                    }}
                    reviewStatus={cardStatuses[previewStudent.id] ?? 'pending'}
                    onApprove={() => handleApprove(previewStudent.id)}
                    onRevise={handleRevise}
                    onClose={() => setPreviewStudent(null)}
                />
            )}

            {/* Header */}
            <div className="px-8 pt-7 pb-6 border-b border-[#eceef0] bg-white">
                <nav className="flex items-center gap-1.5 text-[12px] mb-3">
                    <span className="text-[#9ba3af]">Institution</span>
                    <ChevronRight size={11} className="text-[#c8cbd9]" />
                    <button onClick={() => setStage('orders')} className="text-[#9ba3af] hover:text-[#004ac6] transition-colors">
                        Proofing & Approvals
                    </button>
                    <ChevronRight size={11} className="text-[#c8cbd9]" />
                    <span className="text-[#374151] font-medium">#{order.id}</span>
                </nav>
                <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                        <button onClick={() => setStage('orders')}
                            className="w-9 h-9 flex items-center justify-center rounded-lg border border-[#e2e8f0] hover:bg-[#f8fafc] transition-colors mt-0.5 shrink-0">
                            <ArrowLeft size={15} className="text-[#64748b]" />
                        </button>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-[24px] font-bold text-[#0b1c30] leading-tight tracking-[-0.3px]">{order.school_name}</h1>
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold"
                                    style={{ background: cfg.bg, color: cfg.text }}>
                                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.text }} />
                                    {order.status}
                                </span>
                            </div>
                            <p className="text-[14px] text-[#64748b] mt-1">
                                {order.batch_name} · {order.student_count} Students
                            </p>
                        </div>
                    </div>
                    <div className="flex items-end flex-col gap-3">
                        <div className="flex flex-col gap-1.5 items-end">
                            <div className="flex items-center gap-3 text-[12px]">
                                <span className="text-[#64748b]">{approvedCount} approved</span>
                                {revisionCount > 0 && <span className="text-[#ba1a1a] font-medium">{revisionCount} revisions</span>}
                                {pendingCount > 0 && <span className="text-[#9ba3af]">{pendingCount} pending</span>}
                            </div>
                            {students.length > 0 && (
                                <div className="w-[160px] h-[5px] bg-[#f1f5f9] rounded-full overflow-hidden">
                                    <div className="h-full bg-[#004ac6] rounded-full transition-all"
                                        style={{ width: `${((approvedCount + revisionCount) / students.length) * 100}%` }} />
                                </div>
                            )}
                        </div>
                        <button
                            onClick={handleApproveBatch}
                            disabled={pendingCount > 0 || batchApproved || approvingBatch || students.length === 0}
                            className={cn(
                                'flex items-center gap-2 text-[14px] font-medium px-4 py-2.5 rounded-lg transition-colors shadow-sm',
                                batchApproved
                                    ? 'bg-[#dcfce7] text-[#166534] border border-[#bbf7d0]'
                                    : pendingCount > 0 || students.length === 0
                                        ? 'bg-[#f1f5f9] text-[#9ba3af] cursor-not-allowed'
                                        : 'bg-[#004ac6] text-white hover:bg-[#003da6]'
                            )}>
                            <CheckCircle2 size={15} />
                            {batchApproved ? 'Batch Approved'
                                : approvingBatch ? 'Approving…'
                                    : pendingCount > 0 ? `${pendingCount} Pending Review`
                                        : 'Approve Batch'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats strip */}
            <div className="px-8 py-3 bg-[#f8fafc] border-b border-[#f1f5f9] flex items-center gap-6">
                {[
                    { label: 'Total', count: students.length, color: '#64748b', bg: '#f1f5f9' },
                    { label: 'Approved', count: approvedCount, color: '#166534', bg: '#dcfce7' },
                    { label: 'Revisions', count: revisionCount, color: '#b91c1c', bg: '#ffdad6' },
                    { label: 'Pending', count: pendingCount, color: '#d97706', bg: '#fef3c7' },
                ].map(({ label, count, color, bg }) => (
                    <div key={label} className="flex items-center gap-2">
                        <span className="text-[13px] text-[#64748b]">{label}:</span>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] font-bold"
                            style={{ background: bg, color }}>{count}</span>
                    </div>
                ))}
            </div>

            {/* Card grid */}
            <div className="p-8 bg-[#f7f8fa] flex-1">
                {loadingStudents ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="w-8 h-8 border-2 border-[#004ac6] border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : students.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-2">
                        <CreditCard size={32} className="text-[#c8cbd9]" />
                        <p className="text-[14px] text-[#9ba3af]">No student records found for this order.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-6 gap-4">
                        {students.map((student) => {
                            const status = cardStatuses[student.id] ?? 'pending'
                            const hue = getHue(student.id)
                            const bgColor = `hsl(${hue}, 55%, 48%)`
                            return (
                                <div
                                    key={student.id}
                                    onClick={() => setPreviewStudent(student)}
                                    className={cn(
                                        'bg-white rounded-xl overflow-hidden border transition-all hover:shadow-lg cursor-pointer',
                                        status === 'approved' ? 'border-[#bbf7d0] ring-1 ring-[rgba(34,197,94,0.2)]' :
                                            status === 'revision' ? 'border-[#fca5a5] ring-1 ring-[rgba(239,68,68,0.2)]' :
                                                'border-[#e2e8f0] hover:border-[#c7d4f0]'
                                    )}>
                                    {/* Photo area */}
                                    <div className="relative bg-[#f8fafc]" style={{ paddingTop: '75%' }}>
                                        <div className="absolute top-2 right-2">
                                            {status === 'approved' ? (
                                                <div className="w-6 h-6 rounded-full bg-[#dcfce7] flex items-center justify-center border border-[#bbf7d0]">
                                                    <Check size={11} className="text-[#166534]" />
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
                                                <img src={student.processed_photo} alt={student.name}
                                                    className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-12 h-12 rounded-full flex items-center justify-center text-[13px] font-bold text-white"
                                                    style={{ background: bgColor }}>{getInitials(student.name)}</div>
                                            )}
                                        </div>
                                        <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: bgColor }} />
                                    </div>
                                    <div className={cn(
                                        'px-3 py-2.5 border-t',
                                        status === 'approved' ? 'border-[#bbf7d0]' :
                                            status === 'revision' ? 'border-[#fca5a5]' : 'border-[#f1f5f9]'
                                    )}>
                                        <div className="text-[12px] font-semibold text-[#0b1c30] truncate">{student.name}</div>
                                        <div className="text-[10px] text-[#9ba3af] truncate mt-0.5">{student.role ?? 'Student'}</div>
                                        <div className="text-[10px] font-mono text-[#c8cbd9] mt-0.5">{student.student_id}</div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}
