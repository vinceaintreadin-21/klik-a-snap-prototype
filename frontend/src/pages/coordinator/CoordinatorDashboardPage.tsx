import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, Clock, UserPlus, Search, Camera, Check } from 'lucide-react'
import api from '../../utils/api'
import toast from 'react-hot-toast'
import CoordQRModal from '../../components/coordinator/CoordQRModal'
import type { CoordStudent, CoordOrder } from '../../components/coordinator/coordinatorTypes'
import { getInitials, getHue } from '../../components/coordinator/coordinatorTypes'

function Avatar({ name, id, size = 36 }: { name: string; id: number; size?: number }) {
    const hue = getHue(id)
    return (
        <div className="rounded-full flex items-center justify-center text-white font-bold shrink-0"
            style={{ width: size, height: size, fontSize: size * 0.33, background: `hsl(${hue}, 55%, 48%)` }}>
            {getInitials(name)}
        </div>
    )
}

export default function CoordinatorDashboardPage() {
    const navigate = useNavigate()
    const [orders, setOrders] = useState<CoordOrder[]>([])
    const [selectedOrder, setSelectedOrder] = useState<number | null>(null)
    const [students, setStudents] = useState<CoordStudent[]>([])
    const [loadingList, setLoadingList] = useState(false)
    const [qrStudent, setQrStudent] = useState<CoordStudent | null>(null)

    const fetchStudents = useCallback(async (orderId: number) => {
        setLoadingList(true)
        try {
            const res = await api.get(`/coordinator/orders/${orderId}/students/`)
            setStudents(res.data)
        } catch {
            toast.error('Failed to load students')
        } finally {
            setLoadingList(false)
        }
    }, [])

    useEffect(() => {
        api.get('/coordinator/orders/')
            .then((res) => {
                setOrders(res.data)
                if (res.data.length > 0) {
                    setSelectedOrder(res.data[0].id)
                }
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

    const photographed = students.filter((s) => s.is_photographed).length
    const total = students.length
    const pending = students.filter((s) => !s.is_photographed).length
    const walkIns = students.filter((s) => s.is_walk_in).length
    const pct = total > 0 ? Math.round((photographed / total) * 100) : 0

    const nextUp = students.filter((s) => !s.is_photographed).slice(0, 3)
    const recent = students.filter((s) => s.is_photographed).slice(0, 4)
    const activeOrder = orders.find((o) => o.id === selectedOrder)

    return (
        <div className="flex flex-col gap-0">
            {qrStudent && <CoordQRModal student={qrStudent} onClose={() => setQrStudent(null)} />}

            {/* Page header */}
            <div className="px-4 md:px-8 pt-6 pb-4 border-b border-[#eceef0] bg-white">
                <h1 className="text-[22px] md:text-[24px] font-bold text-[#0b1c30] tracking-[-0.3px]">Photo Day Dashboard</h1>
                {activeOrder && (
                    <p className="text-[13px] md:text-[14px] text-[#64748b] mt-1">
                        {activeOrder.school_name} · {activeOrder.batch_name}
                    </p>
                )}

                {/* Order switcher */}
                {orders.length > 1 && (
                    <div className="mt-3 relative inline-block">
                        <select
                            value={selectedOrder ?? ''}
                            onChange={(e) => setSelectedOrder(Number(e.target.value))}
                            className="appearance-none bg-[#f8fafc] border border-[#e2e8f0] rounded-lg text-[13px] text-[#374151] pl-3 pr-8 py-2 cursor-pointer focus:outline-none hover:border-[#004ac6] transition-colors">
                            {orders.map((o) => (
                                <option key={o.id} value={o.id}>
                                    {o.school_name} — {o.batch_name}
                                </option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            <div className="px-4 md:px-8 py-5 flex flex-col gap-5">
                {/* Progress hero */}
                <div className="bg-[#004ac6] rounded-2xl p-5 md:p-6 text-white shadow-[0_4px_24px_rgba(0,74,198,0.25)]">
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <div className="text-[36px] md:text-[48px] font-black leading-none">{pct}%</div>
                            <div className="text-[13px] font-medium text-[rgba(255,255,255,0.75)] mt-1">Batch Complete</div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                            <div className="flex items-center gap-1.5 text-[13px] font-semibold">
                                <div className="w-2 h-2 rounded-full bg-[rgba(255,255,255,0.9)]" />
                                {photographed} photographed
                            </div>
                            <div className="flex items-center gap-1.5 text-[13px] text-[rgba(255,255,255,0.6)]">
                                <div className="w-2 h-2 rounded-full bg-[rgba(255,255,255,0.3)]" />
                                {pending} remaining
                            </div>
                        </div>
                    </div>
                    <div className="h-3 bg-[rgba(255,255,255,0.2)] rounded-full overflow-hidden">
                        <div className="h-full bg-white rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="flex items-center justify-between mt-2">
                        <span className="text-[11px] text-[rgba(255,255,255,0.6)]">0</span>
                        <span className="text-[11px] text-[rgba(255,255,255,0.6)]">{total} total</span>
                    </div>
                </div>

                {/* Stat cards */}
                <div className="grid grid-cols-3 gap-3">
                    <div className="bg-white border border-[#e2e8f0] rounded-xl p-4 shadow-[0px_1px_2px_rgba(0,0,0,0.04)]">
                        <div className="w-9 h-9 rounded-lg bg-[#f0fdf4] flex items-center justify-center mb-3">
                            <CheckCircle2 size={16} className="text-[#22c55e]" />
                        </div>
                        <div className="text-[24px] font-bold text-[#0b1c30] leading-none">{photographed}</div>
                        <div className="text-[11px] text-[#64748b] mt-1 leading-tight">Photographed</div>
                    </div>
                    <div className="bg-white border border-[#e2e8f0] rounded-xl p-4 shadow-[0px_1px_2px_rgba(0,0,0,0.04)]">
                        <div className="w-9 h-9 rounded-lg bg-[#fff9f0] flex items-center justify-center mb-3">
                            <Clock size={16} className="text-[#d97706]" />
                        </div>
                        <div className="text-[24px] font-bold text-[#0b1c30] leading-none">{pending}</div>
                        <div className="text-[11px] text-[#64748b] mt-1 leading-tight">Pending</div>
                    </div>
                    <div className="bg-white border border-[#e2e8f0] rounded-xl p-4 shadow-[0px_1px_2px_rgba(0,0,0,0.04)]">
                        <div className="w-9 h-9 rounded-lg bg-[#e8eeff] flex items-center justify-center mb-3">
                            <UserPlus size={16} className="text-[#004ac6]" />
                        </div>
                        <div className="text-[24px] font-bold text-[#0b1c30] leading-none">{walkIns}</div>
                        <div className="text-[11px] text-[#64748b] mt-1 leading-tight">Walk-ins</div>
                    </div>
                </div>

                {/* Quick search shortcut */}
                <button
                    onClick={() => navigate('/coordinator/lookup')}
                    className="w-full flex items-center gap-3 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl px-4 py-3 hover:border-[#004ac6] hover:bg-[#f0f4ff] transition-all group">
                    <Search size={16} className="text-[#9ba3af] group-hover:text-[#004ac6] transition-colors" />
                    <span className="text-[14px] text-[#9ba3af] group-hover:text-[#64748b] transition-colors">
                        Search a student to show QR code...
                    </span>
                    <div className="ml-auto flex items-center gap-1 text-[11px] text-[#9ba3af] bg-white border border-[#e2e8f0] rounded-md px-2 py-0.5 font-mono shrink-0">⌘F</div>
                </button>

                {/* Next up */}
                {nextUp.length > 0 && (
                    <div className="bg-white border border-[#e2e8f0] rounded-2xl overflow-hidden shadow-[0px_1px_2px_rgba(0,0,0,0.04)]">
                        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#f1f5f9]">
                            <span className="text-[14px] font-semibold text-[#0b1c30]">Next Up</span>
                            <span className="text-[11px] text-[#9ba3af]">{pending} waiting</span>
                        </div>
                        {nextUp.map((s) => (
                            <div key={s.id}
                                className="flex items-center gap-3 px-5 py-3.5 border-b border-[#f8fafc] last:border-0 hover:bg-[#fafbfd] transition-colors">
                                <Avatar name={s.full_name} id={s.id} size={38} />
                                <div className="flex-1 min-w-0">
                                    <div className="text-[14px] font-medium text-[#0b1c30] truncate">{s.full_name}</div>
                                    <div className="text-[12px] text-[#9ba3af]">{s.grade_level} · {s.student_id}</div>
                                </div>
                                <button
                                    onClick={() => handleMarkPhotographed(s.id)}
                                    className="flex items-center gap-1.5 bg-[#004ac6] text-white text-[12px] font-semibold px-3 py-1.5 rounded-lg hover:bg-[#003da6] transition-colors shadow-sm shrink-0">
                                    <Camera size={12} />
                                    Mark
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Recently photographed */}
                {recent.length > 0 && (
                    <div className="bg-white border border-[#e2e8f0] rounded-2xl overflow-hidden shadow-[0px_1px_2px_rgba(0,0,0,0.04)]">
                        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#f1f5f9]">
                            <span className="text-[14px] font-semibold text-[#0b1c30]">Recently Photographed</span>
                            <button onClick={() => navigate('/coordinator/students')}
                                className="text-[12px] text-[#004ac6] hover:underline font-medium">
                                View All
                            </button>
                        </div>
                        {recent.map((s) => (
                            <div key={s.id}
                                className="flex items-center gap-3 px-5 py-3 border-b border-[#f8fafc] last:border-0">
                                <Avatar name={s.full_name} id={s.id} size={34} />
                                <div className="flex-1 min-w-0">
                                    <div className="text-[13px] font-medium text-[#374151] truncate">{s.full_name}</div>
                                    <div className="text-[11px] text-[#9ba3af]">{s.grade_level}</div>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-5 h-5 rounded-full bg-[#dcfce7] flex items-center justify-center">
                                        <Check size={10} className="text-[#166634]" />
                                    </div>
                                    {s.qr_code_url && (
                                        <button onClick={() => setQrStudent(s)}
                                            className="p-1 rounded hover:bg-[#e8eeff] transition-colors">
                                            <Search size={11} className="text-[#004ac6]" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {total === 0 && !loadingList && (
                    <div className="flex flex-col items-center justify-center py-12 gap-3 bg-white border border-[#e2e8f0] rounded-2xl">
                        <Camera size={28} className="text-[#c8cbd9]" />
                        <p className="text-[14px] font-semibold text-[#9ba3af]">No students yet</p>
                        <p className="text-[12px] text-[#c8cbd9] text-center max-w-[200px]">
                            Students will appear here once the order is created
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}
