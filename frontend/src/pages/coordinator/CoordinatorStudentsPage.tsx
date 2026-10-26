import { useState, useEffect, useCallback } from 'react'
import { Search, Users, QrCode, Camera, Check } from 'lucide-react'
import { cn } from '../../lib/utils'
import api from '../../utils/api'
import toast from 'react-hot-toast'
import CoordQRModal from '../../components/coordinator/CoordQRModal'
import type { CoordSubject, CoordOrder } from '../../components/coordinator/coordinatorTypes'
import { PHOTO_STATUS_CFG, getInitials, getHue } from '../../components/coordinator/coordinatorTypes'

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

// ── Order switcher ────────────────────────────────────────────────────────────

function OrderSwitcher({
    orders,
    selected,
    onChange,
}: {
    orders: CoordOrder[]
    selected: number | null
    onChange: (id: number) => void
}) {
    if (orders.length <= 1) return null
    return (
        <div className="mt-3 relative inline-block">
            <select
                value={selected ?? ''}
                onChange={(e) => onChange(Number(e.target.value))}
                className="appearance-none bg-[#f8fafc] border border-[#e2e8f0] rounded-lg text-[13px] text-[#374151] pl-3 pr-8 py-2 cursor-pointer focus:outline-none hover:border-[#004ac6] transition-colors">
                {orders.map((o) => (
                    <option key={o.id} value={o.id}>
                        {o.school_name} — {o.batch_name}
                    </option>
                ))}
            </select>
        </div>
    )
}

// ── Mobile subject card ───────────────────────────────────────────────────────

function SubjectMobileCard({
    subject,
    onMark,
    onQR,
}: {
    subject: CoordSubject
    onMark: (id: number) => void
    onQR: (s: CoordSubject) => void
}) {
    return (
        <div
            className={cn(
                'bg-white border rounded-xl px-4 py-3 shadow-[0px_1px_2px_rgba(0,0,0,0.04)] flex items-center gap-3',
                subject.is_photographed ? 'border-[#bbf7d0]' : 'border-[#e2e8f0]'
            )}>
            <div className="relative shrink-0">
                <Avatar name={subject.full_name} id={subject.id} size={42} />
                {subject.is_photographed && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#22c55e] border-2 border-white flex items-center justify-center">
                        <Check size={8} className="text-white" />
                    </div>
                )}
            </div>
            <div className="flex-1 min-w-0">
                <div className="text-[14px] font-semibold text-[#0b1c30] truncate">{subject.full_name}</div>
                <div className="text-[11px] text-[#9ba3af]">
                    {subject.student_id} · {subject.grade_level}
                    {subject.section ? ` · ${subject.section}` : ''}
                </div>
                {subject.is_walk_in && (
                    <span className="text-[10px] font-bold text-[#004ac6]">Walk-in</span>
                )}
            </div>
            {!subject.is_photographed && (
                <button
                    onClick={() => onMark(subject.id)}
                    className="w-10 h-10 rounded-xl bg-[#004ac6] flex items-center justify-center shadow-sm active:scale-95 transition-transform">
                    <Camera size={16} className="text-white" />
                </button>
            )}
            <button
                onClick={() => subject.qr_code_url && onQR(subject)}
                disabled={!subject.qr_code_url}
                className="w-10 h-10 rounded-xl bg-[#f1f5f9] flex items-center justify-center active:scale-95 transition-transform ml-1 disabled:opacity-30">
                <QrCode size={16} className="text-[#64748b]" />
            </button>
        </div>
    )
}

// ── Desktop table row ─────────────────────────────────────────────────────────

function SubjectTableRow({
    subject,
    onMark,
    onQR,
}: {
    subject: CoordSubject
    onMark: (id: number) => void
    onQR: (s: CoordSubject) => void
}) {
    const statusKey = subject.photo_status in PHOTO_STATUS_CFG ? subject.photo_status : 'PENDING'
    const cfg = PHOTO_STATUS_CFG[statusKey as keyof typeof PHOTO_STATUS_CFG]

    return (
        <tr className="border-b border-[#f8fafc] hover:bg-[#fafbfd] transition-colors">
            <td className="px-6 py-3.5">
                <div className="flex items-center gap-3">
                    <Avatar name={subject.full_name} id={subject.id} size={36} />
                    <div>
                        <div className="text-[14px] font-medium text-[#0b1c30]">{subject.full_name}</div>
                        {subject.is_walk_in && (
                            <span className="text-[10px] font-bold text-[#004ac6] bg-[#e8eeff] px-1.5 py-0.5 rounded-full">
                                Walk-in
                            </span>
                        )}
                    </div>
                </div>
            </td>
            <td className="px-6 py-3.5 font-mono text-[13px] text-[#64748b]">{subject.student_id}</td>
            <td className="px-6 py-3.5 text-[13px] text-[#64748b]">
                {subject.grade_level}{subject.section ? ` · ${subject.section}` : ''}
            </td>
            <td className="px-6 py-3.5">
                <span
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold"
                    style={{ background: cfg.bg, color: cfg.text }}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.dot }} />
                    {subject.is_photographed ? 'Photographed' : cfg.label}
                </span>
            </td>
            <td className="px-6 py-3.5">
                <div className="flex items-center justify-end gap-1.5">
                    {subject.qr_code_url && (
                        <button
                            onClick={() => onQR(subject)}
                            className="p-1.5 rounded-lg hover:bg-[#e8eeff] transition-colors"
                            title="Show QR">
                            <QrCode size={14} className="text-[#004ac6]" />
                        </button>
                    )}
                    {!subject.is_photographed && (
                        <button
                            onClick={() => onMark(subject.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#004ac6] text-white text-[12px] font-medium hover:bg-[#003da6] transition-colors shadow-sm">
                            <Camera size={12} />
                            Mark Done
                        </button>
                    )}
                </div>
            </td>
        </tr>
    )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CoordinatorStudentsPage() {
    const [orders, setOrders] = useState<CoordOrder[]>([])
    const [selectedOrder, setSelected] = useState<number | null>(null)
    const [subjects, setSubjects] = useState<CoordSubject[]>([])
    const [loading, setLoading] = useState(false)
    const [filter, setFilter] = useState<'all' | 'pending' | 'photographed'>('all')
    const [search, setSearch] = useState('')
    const [qrSubject, setQrSubject] = useState<CoordSubject | null>(null)

    const fetchSubjects = useCallback(async (orderId: number) => {
        setLoading(true)
        try {
            const res = await api.get(`/coordinator/orders/${orderId}/students/`)
            setSubjects(res.data)
        } catch {
            toast.error('Failed to load subjects')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        api.get('/coordinator/orders/')
            .then((res) => {
                setOrders(res.data)
                if (res.data.length > 0) setSelected(res.data[0].id)
            })
            .catch(() => toast.error('Failed to load orders'))
    }, [])

    useEffect(() => {
        if (selectedOrder) fetchSubjects(selectedOrder)
    }, [selectedOrder, fetchSubjects])

    // Poll every 10 s
    useEffect(() => {
        if (!selectedOrder) return
        const id = setInterval(() => fetchSubjects(selectedOrder), 10_000)
        return () => clearInterval(id)
    }, [selectedOrder, fetchSubjects])

    const handleMarkPhotographed = async (subjectId: number) => {
        try {
            const res = await api.post(`/coordinator/students/${subjectId}/mark-photographed/`)
            setSubjects((prev) =>
                prev.map((s) => s.id === subjectId ? { ...s, is_photographed: res.data.is_photographed } : s)
            )
        } catch {
            toast.error('Failed to update status')
        }
    }

    const total = subjects.length
    const done = subjects.filter((s) => s.is_photographed).length
    const pend = subjects.filter((s) => !s.is_photographed).length

    const filtered = subjects.filter((s) => {
        const matchFilter =
            filter === 'all' ||
            (filter === 'photographed' && s.is_photographed) ||
            (filter === 'pending' && !s.is_photographed)
        const q = search.toLowerCase()
        const matchSearch =
            !search ||
            s.full_name.toLowerCase().includes(q) ||
            s.student_id.toLowerCase().includes(q)
        return matchFilter && matchSearch
    })

    return (
        <div className="flex flex-col gap-0">
            {qrSubject && <CoordQRModal subject={qrSubject} onClose={() => setQrSubject(null)} />}

            {/* Header */}
            <div className="px-4 md:px-8 pt-6 pb-4 border-b border-[#eceef0] bg-white">
                <div className="flex items-center gap-3">
                    <h1 className="text-[22px] md:text-[24px] font-bold text-[#0b1c30] tracking-[-0.3px]">Subjects</h1>
                    <span className="bg-[#004ac6] text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                        {total}
                    </span>
                </div>
                <p className="text-[13px] text-[#64748b] mt-1">
                    Real-time photo status for all subjects in this batch.
                </p>
                <OrderSwitcher orders={orders} selected={selectedOrder} onChange={setSelected} />
            </div>

            {/* Progress strip */}
            {total > 0 && (
                <div className="px-4 md:px-8 py-3 bg-[#f8fafc] border-b border-[#f1f5f9] flex items-center gap-5">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-[#22c55e]" />
                        <span className="text-[13px] text-[#64748b]">
                            Done: <strong className="text-[#166534]">{done}</strong>
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-[#d97706]" />
                        <span className="text-[13px] text-[#64748b]">
                            Pending: <strong className="text-[#d97706]">{pend}</strong>
                        </span>
                    </div>
                    <div className="flex-1 h-[4px] bg-[#e2e8f0] rounded-full overflow-hidden">
                        <div
                            className="h-full bg-[#22c55e] rounded-full transition-all"
                            style={{ width: `${total > 0 ? (done / total) * 100 : 0}%` }}
                        />
                    </div>
                </div>
            )}

            {/* Filters + search */}
            <div className="px-4 md:px-8 py-3 border-b border-[#f1f5f9] bg-white flex items-center gap-2 overflow-x-auto">
                {(['all', 'pending', 'photographed'] as const).map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={cn(
                            'px-3 py-1.5 rounded-lg text-[12px] font-medium shrink-0 transition-all border',
                            filter === f
                                ? 'bg-[#004ac6] text-white border-[#004ac6]'
                                : 'bg-[#f8fafc] text-[#64748b] border-[#e2e8f0] hover:border-[#004ac6]'
                        )}>
                        {f.charAt(0).toUpperCase() + f.slice(1)}{' '}
                        ({f === 'all' ? total : f === 'pending' ? pend : done})
                    </button>
                ))}
                <div className="relative ml-auto shrink-0">
                    <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#9ba3af]" />
                    <input
                        type="text"
                        placeholder="Search..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="bg-[#f8fafc] border border-[#e2e8f0] rounded-lg pl-7 pr-3 py-1.5 text-[12px] text-[#374151] placeholder-[#9ba3af] focus:outline-none focus:border-[#004ac6] focus:ring-2 focus:ring-[#e8eeff] w-[130px] transition-all"
                    />
                </div>
            </div>

            {/* Loading */}
            {loading && (
                <div className="flex items-center justify-center py-12">
                    <div className="w-6 h-6 border-2 border-[#004ac6] border-t-transparent rounded-full animate-spin" />
                </div>
            )}

            {/* Mobile card list */}
            {!loading && (
                <div className="md:hidden px-4 py-4 bg-[#f7f8fa] flex flex-col gap-3 pb-[80px]">
                    {filtered.map((s) => (
                        <SubjectMobileCard
                            key={s.id}
                            subject={s}
                            onMark={handleMarkPhotographed}
                            onQR={setQrSubject}
                        />
                    ))}
                    {filtered.length === 0 && (
                        <div className="flex flex-col items-center py-12 gap-2">
                            <Users size={24} className="text-[#c8cbd9]" />
                            <p className="text-[13px] text-[#9ba3af]">No subjects match</p>
                        </div>
                    )}
                </div>
            )}

            {/* Desktop table */}
            {!loading && (
                <div className="hidden md:block px-8 py-6 bg-[#f7f8fa] flex-1">
                    <div className="bg-white border border-[#e2e8f0] rounded-2xl overflow-hidden shadow-[0px_1px_2px_rgba(0,0,0,0.04)]">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-[rgba(248,250,252,0.9)] border-b border-[#f1f5f9]">
                                    <th className="text-left px-6 py-3.5 text-[11px] font-bold text-[#64748b] tracking-[0.55px] uppercase">Subject</th>
                                    <th className="text-left px-6 py-3.5 text-[11px] font-bold text-[#64748b] tracking-[0.55px] uppercase">Subject ID</th>
                                    <th className="text-left px-6 py-3.5 text-[11px] font-bold text-[#64748b] tracking-[0.55px] uppercase">Grade / Section</th>
                                    <th className="text-left px-6 py-3.5 text-[11px] font-bold text-[#64748b] tracking-[0.55px] uppercase">Photo Status</th>
                                    <th className="text-right px-6 py-3.5 text-[11px] font-bold text-[#64748b] tracking-[0.55px] uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((s) => (
                                    <SubjectTableRow
                                        key={s.id}
                                        subject={s}
                                        onMark={handleMarkPhotographed}
                                        onQR={setQrSubject}
                                    />
                                ))}
                            </tbody>
                        </table>
                        {filtered.length === 0 && (
                            <div className="flex flex-col items-center py-14 gap-2">
                                <Users size={24} className="text-[#c8cbd9]" />
                                <p className="text-[13px] text-[#9ba3af]">No subjects match your filter</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
