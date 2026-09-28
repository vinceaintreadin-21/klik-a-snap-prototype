import { useState, useMemo } from 'react'
import {
    ChevronRight, ChevronDown, ChevronLeft, Search,
     Eye, QrCode, ClipboardList,
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { useOrders } from '../../context/OrderContext'
import { STATUS_CFG } from '../../components/institutions/institutionTypes'
import api from '../../utils/api'

const PER_PAGE = 10

function ProgressBar({ pct, label }: { pct: number; label: string }) {
    const isHold = label === 'HOLD'
    const isDone = label === 'Done'
    const barColor = isHold ? '#ba1a1a' : '#004ac6'
    const labelColor = isHold ? '#ba1a1a' : isDone ? '#22c55e' : '#64748b'
    return (
        <div className="flex items-center gap-2 w-[200px]">
            <div className="flex-1 h-[5px] bg-[#f1f5f9] rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${pct}%`, background: barColor }} />
            </div>
            <span className="text-[11px] font-bold shrink-0" style={{ color: labelColor }}>{label}</span>
        </div>
    )
}

export default function InstitutionOrdersPage() {
    const { orders, progress } = useOrders()
    const [statusFilter, setStatusFilter] = useState('All Statuses')
    const [search, setSearch] = useState('')
    const [page, setPage] = useState(1)

    const filtered = useMemo(() => {
        return orders.filter((o) => {
            const matchStatus = statusFilter === 'All Statuses' || o.status === statusFilter
            const matchSearch = !search ||
                String(o.id).includes(search) ||
                (o.batch_name ?? '').toLowerCase().includes(search.toLowerCase()) ||
                (o.school_name ?? '').toLowerCase().includes(search.toLowerCase())
            return matchStatus && matchSearch
        })
    }, [orders, statusFilter, search])

    const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
    const pageData = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

    const getProgressInfo = (order: any) => {
        const p = progress[order.id]
        if (!p) return { pct: 0, label: order.status === 'COMPLETED' ? 'Done' : order.status === 'PROOFING' ? 'HOLD' : '0%' }
        const pct = p.total > 0 ? Math.round((p.processed / p.total) * 100) : 0
        const label = order.status === 'COMPLETED' ? 'Done'
            : order.status === 'PROOFING' ? 'HOLD'
                : `${pct}%`
        return { pct, label }
    }

    const handleDownloadQR = async (orderId: number) => {
        try {
            const res = await api.get(`/orders/${orderId}/qr-codes/download/`, { responseType: 'blob' })
            const url = URL.createObjectURL(res.data)
            const a = document.createElement('a')
            a.href = url
            a.download = `qr-codes-order-${orderId}.zip`
            a.click()
            URL.revokeObjectURL(url)
        } catch (err: any) {
            alert(err.response?.data?.error || 'Failed to download QR codes.')
        }
    }

    return (
        <div className="flex flex-col min-h-full">
            {/* Header */}
            <div className="px-8 pt-7 pb-6 border-b border-[#eceef0] bg-white">
                <nav className="flex items-center gap-1.5 text-[12px] mb-3">
                    <span className="text-[#9ba3af]">Institution</span>
                    <ChevronRight size={11} className="text-[#c8cbd9]" />
                    <span className="text-[#374151] font-medium">Orders</span>
                </nav>
                <div className="flex items-center gap-3">
                    <h1 className="text-[24px] font-bold text-[#0b1c30] leading-tight tracking-[-0.3px]">Orders</h1>
                    <span className="bg-[#004ac6] text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full">{orders.length} Total</span>
                </div>
                <p className="text-[14px] text-[#64748b] mt-1">Manage and track your institution's ID card orders.</p>
            </div>

            {/* Filters */}
            <div className="px-8 py-3.5 border-b border-[#f1f5f9] bg-white flex items-center gap-3">
                <div className="relative flex-1 max-w-[300px]">
                    <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ba3af] pointer-events-none" />
                    <input type="text" placeholder="Search by order ID or batch…"
                        value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                        className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-lg pl-9 pr-4 py-2 text-[13px] text-[#374151] placeholder-[#9ba3af] focus:outline-none focus:ring-2 focus:ring-[#e8eeff] focus:border-[#004ac6] transition-colors" />
                </div>
                <div className="relative">
                    <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
                        className="appearance-none bg-[#f8fafc] border border-[#e2e8f0] rounded-lg text-[13px] text-[#374151] pl-3 pr-8 py-2 cursor-pointer focus:outline-none hover:border-[#004ac6] transition-colors">
                        <option>All Statuses</option>
                        <option>PENDING</option>
                        <option>PROCESSING</option>
                        <option>PROOFING</option>
                        <option>APPROVED</option>
                        <option>COMPLETED</option>
                        <option>CANCELLED</option>
                    </select>
                    <ChevronDown size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9ba3af] pointer-events-none" />
                </div>
            </div>

            <div className="px-8 py-6 bg-[#f7f8fa] flex-1">
                <div className="bg-white border border-[#e2e8f0] rounded-2xl overflow-hidden shadow-[0px_1px_2px_rgba(0,0,0,0.04)]">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-[rgba(248,250,252,0.9)] border-b border-[#f1f5f9]">
                                <th className="text-left px-6 py-3.5 text-[11px] font-bold text-[#64748b] tracking-[0.55px] uppercase">Order ID</th>
                                <th className="text-left px-6 py-3.5 text-[11px] font-bold text-[#64748b] tracking-[0.55px] uppercase">Batch Name</th>
                                <th className="text-left px-6 py-3.5 text-[11px] font-bold text-[#64748b] tracking-[0.55px] uppercase">Status</th>
                                <th className="text-left px-6 py-3.5 text-[11px] font-bold text-[#64748b] tracking-[0.55px] uppercase">Students</th>
                                <th className="text-left px-6 py-3.5 text-[11px] font-bold text-[#64748b] tracking-[0.55px] uppercase">Progress</th>
                                <th className="text-left px-6 py-3.5 text-[11px] font-bold text-[#64748b] tracking-[0.55px] uppercase">Created</th>
                                <th className="text-right px-6 py-3.5 text-[11px] font-bold text-[#64748b] tracking-[0.55px] uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pageData.map((order) => {
                                const cfg = STATUS_CFG[order.status] ?? STATUS_CFG['PROCESSING']
                                const { pct, label } = getProgressInfo(order)
                                return (
                                    <tr key={order.id} className="border-b border-[#f8fafc] hover:bg-[#fafbfd] transition-colors">
                                        <td className="px-6 py-4">
                                            <span className="font-mono text-[13px] font-semibold text-[#004ac6]">#{order.id}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-[13px] font-medium text-[#374151]">{order.batch_name}</div>
                                            <div className="text-[11px] text-[#9ba3af]">{order.school_name}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold"
                                                style={{ background: cfg.bg, color: cfg.text }}>
                                                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: cfg.text }} />
                                                {order.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-[14px] font-medium text-[#374151]">{order.student_count}</span>
                                            <span className="text-[12px] text-[#9ba3af] ml-1">students</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <ProgressBar pct={pct} label={label} />
                                        </td>
                                        <td className="px-6 py-4 text-[13px] text-[#9ba3af]">
                                            {new Date(order.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-1">
                                                <button className="p-1.5 rounded-lg hover:bg-[#f1f5f9] transition-colors" title="View">
                                                    <Eye size={14} className="text-[#64748b]" />
                                                </button>
                                                <button
                                                    onClick={() => handleDownloadQR(order.id)}
                                                    className="p-1.5 rounded-lg hover:bg-[#e8eeff] transition-colors" title="Download QR Codes">
                                                    <QrCode size={14} className="text-[#004ac6]" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>

                    {filtered.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-16 gap-2">
                            <ClipboardList size={28} className="text-[#c8cbd9]" />
                            <p className="text-[14px] text-[#9ba3af]">No orders match your filters</p>
                        </div>
                    )}

                    <div className="bg-[#f8fafc] border-t border-[#f1f5f9] flex items-center justify-between px-6 py-3">
                        <span className="text-[12px] text-[#9ba3af]">
                            Showing {filtered.length === 0 ? 0 : (page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filtered.length)} of {filtered.length} orders
                        </span>
                        <div className="flex items-center gap-1.5">
                            <button
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="px-3 py-1.5 rounded-lg border border-[#e2e8f0] text-[12px] text-[#9ba3af] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white transition-colors flex items-center gap-1">
                                <ChevronLeft size={12} /> Previous
                            </button>
                            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p) => (
                                <button key={p} onClick={() => setPage(p)}
                                    className={cn(
                                        'w-7 h-7 flex items-center justify-center rounded-lg text-[12px] font-medium transition-all',
                                        page === p ? 'bg-[#004ac6] text-white' : 'border border-[#e2e8f0] text-[#64748b] hover:bg-white'
                                    )}>
                                    {p}
                                </button>
                            ))}
                            <button
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="px-3 py-1.5 rounded-lg border border-[#e2e8f0] text-[12px] text-[#64748b] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white transition-colors flex items-center gap-1">
                                Next <ChevronRight size={12} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
