import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    ClipboardList, AlertTriangle, CheckCircle2, Users,
    ChevronRight, ChevronDown, ChevronUp, Eye, QrCode,
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { useOrders } from '../../context/OrderContext'
import { useAuth } from '../../context/AuthContext'
import { STATUS_CFG } from '../../components/institutions/institutionTypes'
import api from '../../utils/api'

function ProgressBar({ pct, label }: { pct: number; label: string }) {
    const isHold = label === 'HOLD'
    const isDone = label === 'Done'
    const barColor = isHold ? '#ba1a1a' : '#004ac6'
    const labelColor = isHold ? '#ba1a1a' : isDone ? '#22c55e' : '#64748b'
    return (
        <div className="flex items-center gap-2 min-w-[140px]">
            <div className="flex-1 h-[5px] bg-[#f1f5f9] rounded-full overflow-hidden min-w-[80px]">
                <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: barColor }} />
            </div>
            <span className="text-[11px] font-bold shrink-0" style={{ color: labelColor }}>{label}</span>
        </div>
    )
}

export default function InstitutionDashboardPage() {
    const navigate = useNavigate()
    const { user } = useAuth()
    const { orders, progress } = useOrders()
    const [statusFilter, setStatusFilter] = useState('All Statuses')
    const [institutionName, setInstitutionName] = useState<string>('')

    useEffect(() => {
        api.get('/institution/profile/').then((res) => {
            setInstitutionName(res.data?.name ?? '')
        }).catch(() => { })
    }, [])

    const activeOrders = orders.filter((o) => !['COMPLETED', 'CANCELLED'].includes(o.status))
    const pendingApproval = orders.filter((o) => o.status === 'PROOFING')
    const completedOrders = orders.filter((o) => o.status === 'COMPLETED')
    const totalStudents = orders.reduce((sum, o) => sum + (o.student_count ?? 0), 0)

    const displayName = institutionName || user?.username || 'Institution'

    const getProgressInfo = (order: any) => {
        const p = progress[order.id]
        if (!p) return { pct: 0, label: order.status === 'COMPLETED' ? 'Done' : order.status === 'PROOFING' ? 'HOLD' : '0%' }
        const pct = p.total > 0 ? Math.round((p.processed / p.total) * 100) : 0
        const label = order.status === 'COMPLETED' ? 'Done'
            : order.status === 'PROOFING' ? 'HOLD'
                : `${pct}%`
        return { pct, label }
    }

    const recentOrders = [...orders]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .filter((o) => statusFilter === 'All Statuses' || o.status === statusFilter)
        .slice(0, 5)

    return (
        <div className="flex flex-col min-h-full">
            {/* Page header */}
            <div className="px-8 pt-7 pb-6 border-b border-[#eceef0] bg-white">
                <nav className="flex items-center gap-1.5 text-[12px] mb-3">
                    <span className="text-[#9ba3af]">Institution</span>
                    <ChevronRight size={11} className="text-[#c8cbd9]" />
                    <span className="text-[#374151] font-medium">Dashboard</span>
                </nav>
                <div>
                    <h1 className="text-[24px] font-bold text-[#0b1c30] leading-tight tracking-[-0.3px]">Dashboard</h1>
                    <p className="text-[14px] text-[#64748b] mt-1">Welcome back, {displayName}. Here's your ID production summary.</p>
                </div>
            </div>

            <div className="p-8 flex flex-col gap-6 bg-[#f7f8fa] min-h-full">
                {/* Stat cards */}
                <div className="grid grid-cols-4 gap-4">
                    {/* Active Orders */}
                    <div className="bg-white border border-[#e2e8f0] rounded-2xl p-5 shadow-[0px_1px_3px_rgba(0,0,0,0.04)]">
                        <div className="flex items-start justify-between mb-4">
                            <div className="w-10 h-10 rounded-xl bg-[#e8eeff] flex items-center justify-center">
                                <ClipboardList size={18} className="text-[#004ac6]" />
                            </div>
                            {activeOrders.length > 0 && (
                                <span className="text-[11px] font-semibold text-[#004ac6] bg-[#e8eeff] px-2 py-0.5 rounded-full">
                                    {activeOrders.length} active
                                </span>
                            )}
                        </div>
                        <div className="text-[30px] font-bold text-[#0b1c30] leading-none">{activeOrders.length}</div>
                        <div className="text-[13px] text-[#64748b] mt-1.5 mb-3">Active Orders</div>
                        <div className="h-[4px] bg-[#e8eeff] rounded-full overflow-hidden">
                            <div className="h-full bg-[#004ac6] rounded-full" style={{ width: `${Math.min((activeOrders.length / Math.max(orders.length, 1)) * 100, 100)}%` }} />
                        </div>
                    </div>

                    {/* Pending Approval */}
                    <div className={cn(
                        'rounded-2xl p-5 shadow-[0px_1px_3px_rgba(186,26,26,0.05)]',
                        pendingApproval.length > 0
                            ? 'bg-[#fff5f5] border border-[rgba(186,26,26,0.2)]'
                            : 'bg-white border border-[#e2e8f0]'
                    )}>
                        <div className="flex items-start justify-between mb-4">
                            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center',
                                pendingApproval.length > 0 ? 'bg-[rgba(186,26,26,0.1)]' : 'bg-[#fef3c7]')}>
                                <AlertTriangle size={18} className={pendingApproval.length > 0 ? 'text-[#ba1a1a]' : 'text-[#d97706]'} />
                            </div>
                            {pendingApproval.length > 0 && (
                                <span className="text-[10px] font-bold text-[#ba1a1a] bg-[rgba(186,26,26,0.1)] px-2 py-0.5 rounded-full uppercase tracking-wide">Urgent</span>
                            )}
                        </div>
                        <div className={cn('text-[30px] font-bold leading-none', pendingApproval.length > 0 ? 'text-[#93000a]' : 'text-[#0b1c30]')}>
                            {String(pendingApproval.length).padStart(2, '0')}
                        </div>
                        <div className={cn('text-[13px] mt-1.5', pendingApproval.length > 0 ? 'text-[#b91c1c]' : 'text-[#64748b]')}>
                            Pending Approval
                        </div>
                        {pendingApproval.length > 0 && (
                            <p className="text-[12px] text-[#b91c1c] opacity-70 mt-2 leading-4">Requires immediate attention</p>
                        )}
                    </div>

                    {/* Completed */}
                    <div className="bg-white border border-[#e2e8f0] rounded-2xl p-5 shadow-[0px_1px_3px_rgba(0,0,0,0.04)]">
                        <div className="flex items-start justify-between mb-4">
                            <div className="w-10 h-10 rounded-xl bg-[#f0fdf4] flex items-center justify-center">
                                <CheckCircle2 size={18} className="text-[#22c55e]" />
                            </div>
                            <span className="text-[11px] font-semibold text-[#166534] bg-[#dcfce7] px-2 py-0.5 rounded-full flex items-center gap-0.5">
                                <ChevronUp size={10} />All time
                            </span>
                        </div>
                        <div className="text-[30px] font-bold text-[#0b1c30] leading-none">{completedOrders.length}</div>
                        <div className="text-[13px] text-[#64748b] mt-1.5">Completed Orders</div>
                    </div>

                    {/* Total Students */}
                    <div className="bg-white border border-[#e2e8f0] rounded-2xl p-5 shadow-[0px_1px_3px_rgba(0,0,0,0.04)]">
                        <div className="flex items-start justify-between mb-4">
                            <div className="w-10 h-10 rounded-xl bg-[#fef9ec] flex items-center justify-center">
                                <Users size={18} className="text-[#d97706]" />
                            </div>
                        </div>
                        <div className="text-[30px] font-bold text-[#0b1c30] leading-none">{totalStudents.toLocaleString()}</div>
                        <div className="text-[13px] text-[#64748b] mt-1.5">Total Students</div>
                        <div className="text-[12px] text-[#9ba3af] mt-2">Across all orders</div>
                    </div>
                </div>

                {/* Main layout */}
                <div className="grid grid-cols-12 gap-5">
                    {/* Recent Orders */}
                    <div className="col-span-8 bg-white border border-[#e2e8f0] rounded-2xl overflow-hidden shadow-[0px_1px_2px_rgba(0,0,0,0.04)] flex flex-col">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-[#f1f5f9]">
                            <div className="flex items-center gap-2.5">
                                <span className="text-[15px] font-semibold text-[#0b1c30]">Recent Orders</span>
                                <span className="bg-[#004ac6] text-white text-[11px] font-bold px-2 py-0.5 rounded-full">{orders.length}</span>
                            </div>
                            <div className="flex items-center gap-2.5">
                                <div className="relative">
                                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                                        className="appearance-none bg-[#f8fafc] border border-[#e2e8f0] rounded-lg text-[12px] text-[#374151] pl-3 pr-7 py-1.5 cursor-pointer focus:outline-none hover:border-[#004ac6] transition-colors">
                                        <option>All Statuses</option>
                                        <option>PROCESSING</option>
                                        <option>PROOFING</option>
                                        <option>COMPLETED</option>
                                    </select>
                                    <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#9ba3af] pointer-events-none" />
                                </div>
                                <button onClick={() => navigate('/client/orders')} className="text-[13px] text-[#004ac6] hover:underline font-medium">
                                    View All →
                                </button>
                            </div>
                        </div>

                        {orders.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 gap-2">
                                <ClipboardList size={28} className="text-[#c8cbd9]" />
                                <p className="text-[14px] text-[#9ba3af]">No orders yet</p>
                                <button onClick={() => navigate('/client/orders/new')}
                                    className="text-[13px] text-[#004ac6] hover:underline font-medium">
                                    Create your first order →
                                </button>
                            </div>
                        ) : (
                            <>
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr className="bg-[rgba(248,250,252,0.8)] border-b border-[#f1f5f9]">
                                            <th className="text-left px-6 py-3 text-[11px] font-bold text-[#64748b] tracking-[0.55px] uppercase">Order ID</th>
                                            <th className="text-left px-6 py-3 text-[11px] font-bold text-[#64748b] tracking-[0.55px] uppercase">Batch</th>
                                            <th className="text-left px-6 py-3 text-[11px] font-bold text-[#64748b] tracking-[0.55px] uppercase">Status</th>
                                            <th className="text-left px-6 py-3 text-[11px] font-bold text-[#64748b] tracking-[0.55px] uppercase">Students</th>
                                            <th className="text-left px-6 py-3 text-[11px] font-bold text-[#64748b] tracking-[0.55px] uppercase">Progress</th>
                                            <th className="text-right px-6 py-3 text-[11px] font-bold text-[#64748b] tracking-[0.55px] uppercase">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {recentOrders.map((order) => {
                                            const cfg = STATUS_CFG[order.status] ?? STATUS_CFG['PROCESSING']
                                            const { pct, label } = getProgressInfo(order)
                                            return (
                                                <tr key={order.id} className="border-b border-[#f8fafc] hover:bg-[#fafbfd] transition-colors">
                                                    <td className="px-6 py-4">
                                                        <span className="font-mono text-[13px] font-semibold text-[#004ac6]">#{order.id}</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="text-[13px] font-medium text-[#374151] truncate max-w-[140px]">{order.batch_name}</div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold"
                                                            style={{ background: cfg.bg, color: cfg.text }}>
                                                            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: cfg.text }} />
                                                            {order.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-[14px] font-medium text-[#374151]">{order.student_count}</td>
                                                    <td className="px-6 py-4">
                                                        <ProgressBar pct={pct} label={label} />
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex items-center justify-end gap-1">
                                                            <button
                                                                onClick={() => navigate('/client/orders')}
                                                                className="p-1.5 rounded-lg hover:bg-[#f1f5f9] transition-colors" title="View">
                                                                <Eye size={13} className="text-[#64748b]" />
                                                            </button>
                                                            <button className="p-1.5 rounded-lg hover:bg-[#e8eeff] transition-colors" title="Download QR Codes">
                                                                <QrCode size={13} className="text-[#004ac6]" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                                <div className="bg-[#f8fafc] border-t border-[#f1f5f9] flex items-center justify-between px-6 py-3">
                                    <span className="text-[12px] text-[#9ba3af]">Showing {recentOrders.length} of {orders.length} orders</span>
                                    <button onClick={() => navigate('/client/orders')}
                                        className="px-3 py-1.5 rounded-lg border border-[#e2e8f0] text-[12px] text-[#64748b] hover:bg-white transition-colors">
                                        View All
                                    </button>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Pending Actions */}
                    <div className="col-span-4 bg-white border border-[#e2e8f0] rounded-2xl overflow-hidden shadow-[0px_1px_2px_rgba(0,0,0,0.04)] flex flex-col">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-[#f1f5f9]">
                            <span className="text-[15px] font-semibold text-[#0b1c30]">Pending Actions</span>
                            {pendingApproval.length > 0 && (
                                <span className="bg-[#ba1a1a] text-white text-[10px] font-bold px-2 py-0.5 rounded-full tracking-wide uppercase">Priority</span>
                            )}
                        </div>
                        <div className="flex flex-col gap-3 p-4 flex-1">
                            {pendingApproval.length > 0 ? (
                                pendingApproval.slice(0, 2).map((order) => (
                                    <div key={order.id} className="rounded-xl border-l-[3px] border-[#ba1a1a] border border-[rgba(186,26,26,0.15)] bg-[#fff5f5] p-4">
                                        <div className="flex items-start gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-[rgba(186,26,26,0.1)] flex items-center justify-center shrink-0 mt-0.5">
                                                <AlertTriangle size={14} className="text-[#ba1a1a]" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-1 mb-1">
                                                    <span className="text-[13px] font-semibold text-[#0b1c30] leading-tight">Approve #{order.id}</span>
                                                    <span className="text-[10px] font-bold text-[#ba1a1a] shrink-0">Critical</span>
                                                </div>
                                                <p className="text-[12px] text-[#64748b] leading-4 mb-2.5">
                                                    {order.student_count} IDs require verification before production.
                                                </p>
                                                <button onClick={() => navigate('/client/proofing')}
                                                    className="text-[12px] font-semibold text-[#004ac6] hover:underline">
                                                    Launch Proofing Tool →
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="flex flex-col items-center justify-center flex-1 gap-2 py-8">
                                    <CheckCircle2 size={28} className="text-[#c8cbd9]" />
                                    <p className="text-[14px] text-[#9ba3af] font-medium">All caught up!</p>
                                    <p className="text-[12px] text-[#c8cbd9] text-center">No pending actions at this time.</p>
                                </div>
                            )}

                            {orders.length === 0 && (
                                <div className="rounded-xl border border-[#e2e8f0] bg-white p-4">
                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-[#e8eeff] flex items-center justify-center shrink-0 mt-0.5">
                                            <ClipboardList size={14} className="text-[#004ac6]" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <span className="text-[13px] font-semibold text-[#0b1c30] leading-tight">Create your first order</span>
                                            <p className="text-[12px] text-[#64748b] leading-4 mt-1 mb-2.5">Upload a student list to begin ID card production.</p>
                                            <button onClick={() => navigate('/client/orders/new')}
                                                className="text-[12px] font-semibold text-[#004ac6] hover:underline">
                                                New Order →
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
