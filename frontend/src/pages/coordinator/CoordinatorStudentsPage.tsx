import { useState, useEffect, useCallback } from 'react'
import { Search, Users, QrCode, Camera, Check } from 'lucide-react'
import { cn } from '../../lib/utils'
import api from '../../utils/api'
import toast from 'react-hot-toast'
import CoordQRModal from '../../components/coordinator/CoordQRModal'
import type { CoordStudent, CoordOrder } from '../../components/coordinator/coordinatorTypes'
import { PHOTO_STATUS_CFG, getInitials, getHue } from '../../components/coordinator/coordinatorTypes'

function Avatar({ name, id, size = 36 }: { name: string; id: number; size?: number }) {
    const hue = getHue(id)
    return (
        <div className="rounded-full flex items-center justify-center text-white font-bold shrink-0"
            style={{ width: size, height: size, fontSize: size * 0.33, background: `hsl(${hue}, 55%, 48%)` }}>
            {getInitials(name)}
        </div>
    )
}

export default function CoordinatorStudentsPage() {
    const [orders, setOrders] = useState<CoordOrder[]>([])
    const [selectedOrder, setSelectedOrder] = useState<number | null>(null)
    const [students, setStudents] = useState<CoordStudent[]>([])
    const [loading, setLoading] = useState(false)
    const [filter, setFilter] = useState<'all' | 'pending' | 'photographed'>('all')
    const [search, setSearch] = useState('')
    const [qrStudent, setQrStudent] = useState<CoordStudent | null>(null)

    const fetchStudents = useCallback(async (orderId: number) => {
        setLoading(true)
        try {
            const res = await api.get(`/coordinator/orders/${orderId}/students/`)
            setStudents(res.data)
        } catch {
            toast.error('Failed to load students')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        api.get('/coordinator/orders/')
            .then((res) => {
                setOrders(res.data)
                if (res.data.length > 0) setSelectedOrder(res.data[0].id)
            })
            .catch(() => toast.error('Failed to load orders'))
    }, [])

    useEffect(() => {
        if (selectedOrder) fetchStudents(selectedOrder)
    }, [selectedOrder, fetchStudents])

    // Poll every 10s
    useEffect(() => {
        if (!selectedOrder) return
        const interval = setInterval(() => fetchStudents(selectedOrder), 10000)
        return () => clearInterval(interval)
    }, [selectedOrder, fetchStudents])

    const handleMarkPhotographed = async (studentId: number) => {
        try {
            const res = await api.post(`/coordinator/students/${studentId}/mark-photographed/`)
            setStudents((prev) =>
                prev.map((s) => s.id === studentId ? { ...s, is_photographed: res.data.is_photographed } : s)
            )
        } catch {
            toast.error('Failed to update status')
        }
    }

    const total = students.length
    const done = students.filter((s) => s.is_photographed).length
    const pend = students.filter((s) => !s.is_photographed).length

    const filtered = students.filter((s) => {
        const matchFilter =
            filter === 'all' ||
            (filter === 'photographed' && s.is_photographed) ||
            (filter === 'pending' && !s.is_photographed)
        const matchSearch =
            !search ||
            s.full_name.toLowerCase().includes(search.toLowerCase()) ||
            s.student_id.toLowerCase().includes(search.toLowerCase())
        return matchFilter && matchSearch
    })

    return (
        <div className="flex flex-col gap-0">
            {qrStudent && <CoordQRModal student={qrStudent} onClose={() => setQrStudent(null)} />}

            {/* Header */}
            <div className="px-4 md:px-8 pt-6 pb-4 border-b border-[#eceef0] bg-white">
                <div className="flex items-center gap-3">
                    <h1 className="text-[22px] md:text-[24px] font-bold text-[#0b1c30] tracking-[-0.3px]">Students</h1>
                    <span className="bg-[#004ac6] text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full">{total}</span>
                </div>
                <p className="text-[13px] text-[#64748b] mt-1">Real-time photo status for all students in this batch.</p>

                {orders.length > 1 && (
                    <div className="mt-3 relative inline-block">
                        <select
                            value={selectedOrder ?? ''}
                            onChange={(e) => setSelectedOrder(Number(e.target.value))}
                            className="appearance-none bg-[#f8fafc] border border-[#e2e8f0] rounded-lg text-[13px] text-[#374151] pl-3 pr-8 py-2 cursor-pointer focus:outline-none hover:border-[#004ac6] transition-colors">
                            {orders.map((o) => (
                                <option key={o.id} value={o.id}>{o.school_name} — {o.batch_name}</option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            {/* Progress strip */}
            {total > 0 && (
                <div className="px-4 md:px-8 py-3 bg-[#f8fafc] border-b border-[#f1f5f9] flex items-center gap-5">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-[#22c55e]" />
                        <span className="text-[13px] text-[#64748b]">Done: <strong className="text-[#166534]">{done}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-[#d97706]" />
                        <span className="text-[13px] text-[#64748b]">Pending: <strong className="text-[#d97706]">{pend}</strong></span>
                    </div>
                    <div className="flex-1 h-[4px] bg-[#e2e8f0] rounded-full overflow-hidden">
                        <div className="h-full bg-[#22c55e] rounded-full transition-all"
                            style={{ width: `${total > 0 ? (done / total) * 100 : 0}%` }} />
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="px-4 md:px-8 py-3 border-b border-[#f1f5f9] bg-white flex items-center gap-2 overflow-x-auto">
                {(['all', 'pending', 'photographed'] as const).map((f) => (
                    <button key={f} onClick={() => setFilter(f)}
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
                    <input type="text" placeholder="Search..."
                        value={search} onChange={(e) => setSearch(e.target.value)}
                        className="bg-[#f8fafc] border border-[#e2e8f0] rounded-lg pl-7 pr-3 py-1.5 text-[12px] text-[#374151] placeholder-[#9ba3af] focus:outline-none focus:border-[#004ac6] focus:ring-2 focus:ring-[#e8eeff] w-[130px] transition-all" />
                </div>
            </div>

            {/* Loading */}
            {loading && (
                <div className="flex items-center justify-center py-12">
                    <div className="w-6 h-6 border-2 border-[#004ac6] border-t-transparent rounded-full animate-spin" />
                </div>
            )}

            {/* ── Mobile card list ── */}
            {!loading && (
                <div className="md:hidden px-4 py-4 bg-[#f7f8fa] flex flex-col gap-3 pb-[80px]">
                    {filtered.map((s) => (
                        <div key={s.id}
                            className={cn(
                                'bg-white border rounded-xl px-4 py-3 shadow-[0px_1px_2px_rgba(0,0,0,0.04)] flex items-center gap-3',
                                s.is_photographed ? 'border-[#bbf7d0]' : 'border-[#e2e8f0]'
                            )}>
                            <div className="relative shrink-0">
                                <Avatar name={s.full_name} id={s.id} size={42} />
                                {s.is_photographed && (
                                    <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#22c55e] border-2 border-white flex items-center justify-center">
                                        <Check size={8} className="text-white" />
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-[14px] font-semibold text-[#0b1c30] truncate">{s.full_name}</div>
                                <div className="text-[11px] text-[#9ba3af]">{s.student_id} · {s.grade_level}</div>
                                {s.is_walk_in && (
                                    <span className="text-[10px] font-bold text-[#004ac6]">Walk-in</span>
                                )}
                            </div>
                            {!s.is_photographed && (
                                <button onClick={() => handleMarkPhotographed(s.id)}
                                    className="w-10 h-10 rounded-xl bg-[#004ac6] flex items-center justify-center shadow-sm active:scale-95 transition-transform">
                                    <Camera size={16} className="text-white" />
                                </button>
                            )}
                            <button onClick={() => s.qr_code_url && setQrStudent(s)}
                                disabled={!s.qr_code_url}
                                className="w-10 h-10 rounded-xl bg-[#f1f5f9] flex items-center justify-center active:scale-95 transition-transform ml-1 disabled:opacity-30">
                                <QrCode size={16} className="text-[#64748b]" />
                            </button>
                        </div>
                    ))}
                    {filtered.length === 0 && (
                        <div className="flex flex-col items-center py-12 gap-2">
                            <Users size={24} className="text-[#c8cbd9]" />
                            <p className="text-[13px] text-[#9ba3af]">No students match</p>
                        </div>
                    )}
                </div>
            )}

            {/* ── Desktop table ── */}
            {!loading && (
                <div className="hidden md:block px-8 py-6 bg-[#f7f8fa] flex-1">
                    <div className="bg-white border border-[#e2e8f0] rounded-2xl overflow-hidden shadow-[0px_1px_2px_rgba(0,0,0,0.04)]">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-[rgba(248,250,252,0.9)] border-b border-[#f1f5f9]">
                                    <th className="text-left px-6 py-3.5 text-[11px] font-bold text-[#64748b] tracking-[0.55px] uppercase">Student</th>
                                    <th className="text-left px-6 py-3.5 text-[11px] font-bold text-[#64748b] tracking-[0.55px] uppercase">Student ID</th>
                                    <th className="text-left px-6 py-3.5 text-[11px] font-bold text-[#64748b] tracking-[0.55px] uppercase">Grade</th>
                                    <th className="text-left px-6 py-3.5 text-[11px] font-bold text-[#64748b] tracking-[0.55px] uppercase">Photo Status</th>
                                    <th className="text-right px-6 py-3.5 text-[11px] font-bold text-[#64748b] tracking-[0.55px] uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((s) => {
                                    const statusKey = s.photo_status in PHOTO_STATUS_CFG ? s.photo_status : 'PENDING'
                                    const cfg = PHOTO_STATUS_CFG[statusKey as keyof typeof PHOTO_STATUS_CFG]
                                    return (
                                        <tr key={s.id} className="border-b border-[#f8fafc] hover:bg-[#fafbfd] transition-colors">
                                            <td className="px-6 py-3.5">
                                                <div className="flex items-center gap-3">
                                                    <Avatar name={s.full_name} id={s.id} size={36} />
                                                    <div>
                                                        <div className="text-[14px] font-medium text-[#0b1c30]">{s.full_name}</div>
                                                        {s.is_walk_in && (
                                                            <span className="text-[10px] font-bold text-[#004ac6] bg-[#e8eeff] px-1.5 py-0.5 rounded-full">Walk-in</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-3.5 font-mono text-[13px] text-[#64748b]">{s.student_id}</td>
                                            <td className="px-6 py-3.5 text-[13px] text-[#64748b]">{s.grade_level}</td>
                                            <td className="px-6 py-3.5">
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold"
                                                    style={{ background: cfg.bg, color: cfg.text }}>
                                                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.dot }} />
                                                    {s.is_photographed ? 'Photographed' : cfg.label}
                                                </span>
                                            </td>
                                            <td className="px-6 py-3.5">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    {s.qr_code_url && (
                                                        <button onClick={() => setQrStudent(s)}
                                                            className="p-1.5 rounded-lg hover:bg-[#e8eeff] transition-colors" title="Show QR">
                                                            <QrCode size={14} className="text-[#004ac6]" />
                                                        </button>
                                                    )}
                                                    {!s.is_photographed && (
                                                        <button onClick={() => handleMarkPhotographed(s.id)}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#004ac6] text-white text-[12px] font-medium hover:bg-[#003da6] transition-colors shadow-sm">
                                                            <Camera size={12} />
                                                            Mark Done
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                        {filtered.length === 0 && (
                            <div className="flex flex-col items-center py-14 gap-2">
                                <Users size={24} className="text-[#c8cbd9]" />
                                <p className="text-[13px] text-[#9ba3af]">No students match your filter</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
