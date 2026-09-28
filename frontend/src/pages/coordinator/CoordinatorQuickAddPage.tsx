import { useState, useEffect } from 'react'
import {
    UserPlus, CheckCircle2, QrCode, Info, Loader2, ChevronDown,
} from 'lucide-react'
import api from '../../utils/api'
import toast from 'react-hot-toast'
import CoordQRModal from '../../components/coordinator/CoordQRModal'
import type { CoordOrder, CoordStudent } from '../../components/coordinator/coordinatorTypes'
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

const GRADE_OPTIONS = [
    'Grade 7', 'Grade 8', 'Grade 9-A', 'Grade 9-B',
    'Grade 10-A', 'Grade 10-B', 'Grade 11-A', 'Grade 11-B', 'Grade 11-C',
    'Grade 12-A', 'Grade 12-B', 'Grade 12-C',
    'Year 1', 'Year 2', 'Year 3', 'Year 4',
    'Undergraduate', 'Postgraduate', 'PhD', 'Faculty',
]

export default function CoordinatorQuickAddPage() {
    const [orders, setOrders] = useState<CoordOrder[]>([])
    const [selectedOrder, setSelectedOrder] = useState<number | null>(null)
    const [name, setName] = useState('')
    const [grade, setGrade] = useState('')
    const [loading, setLoading] = useState(false)
    const [added, setAdded] = useState<CoordStudent | null>(null)
    const [qrOpen, setQrOpen] = useState(false)

    useEffect(() => {
        api.get('/coordinator/orders/')
            .then((res) => {
                setOrders(res.data)
                if (res.data.length > 0) setSelectedOrder(res.data[0].id)
            })
            .catch(() => toast.error('Failed to load orders'))
    }, [])

    const handleSubmit = async () => {
        if (!name.trim() || !selectedOrder) return
        setLoading(true)
        try {
            const res = await api.post(`/orders/${selectedOrder}/students/quick-add/`, {
                full_name: name.trim(),
                grade_level: grade.trim(),
            })
            setAdded(res.data)
            toast.success(`${res.data.full_name} added`)
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Failed to add student')
        } finally {
            setLoading(false)
        }
    }

    const handleReset = () => {
        setName('')
        setGrade('')
        setAdded(null)
        setQrOpen(false)
    }

    return (
        <div className="flex flex-col gap-0">
            {qrOpen && added && (
                <CoordQRModal student={added} onClose={() => setQrOpen(false)} />
            )}

            {/* Header */}
            <div className="px-4 md:px-8 pt-6 pb-4 border-b border-[#eceef0] bg-white">
                <h1 className="text-[22px] md:text-[24px] font-bold text-[#0b1c30] tracking-[-0.3px]">Quick Add</h1>
                <p className="text-[13px] text-[#64748b] mt-1">Register a walk-in student and instantly generate their QR code.</p>
            </div>

            <div className="px-4 md:px-8 py-6 bg-[#f7f8fa] pb-[100px] md:pb-8">
                {!added ? (
                    <div className="bg-white border border-[#e2e8f0] rounded-2xl p-5 md:p-6 max-w-[520px] shadow-[0px_1px_4px_rgba(0,0,0,0.05)]">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-[#e8eeff] flex items-center justify-center shrink-0">
                                <UserPlus size={18} className="text-[#004ac6]" />
                            </div>
                            <div>
                                <h2 className="text-[15px] font-bold text-[#0b1c30]">Walk-in Registration</h2>
                                <p className="text-[12px] text-[#9ba3af]">Student will be added to the batch in real time</p>
                            </div>
                        </div>

                        <div className="flex flex-col gap-4">
                            {/* Order selector */}
                            {orders.length > 1 && (
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[12px] font-semibold text-[#374151] uppercase tracking-[0.4px]">Order</label>
                                    <div className="relative">
                                        <select value={selectedOrder ?? ''} onChange={(e) => setSelectedOrder(Number(e.target.value))}
                                            className="appearance-none w-full border border-[#e2e8f0] rounded-xl px-4 py-3 text-[15px] text-[#374151] focus:outline-none focus:ring-2 focus:ring-[#e8eeff] focus:border-[#004ac6] transition-colors bg-white">
                                            {orders.map((o) => (
                                                <option key={o.id} value={o.id}>{o.school_name} — {o.batch_name}</option>
                                            ))}
                                        </select>
                                        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9ba3af] pointer-events-none" />
                                    </div>
                                </div>
                            )}

                            {/* Name */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[12px] font-semibold text-[#374151] uppercase tracking-[0.4px]">
                                    Full Name <span className="text-[#ba1a1a]">*</span>
                                </label>
                                <input type="text" placeholder="e.g. Alex Johnson"
                                    value={name} onChange={(e) => setName(e.target.value)}
                                    className="border border-[#e2e8f0] rounded-xl px-4 py-3 text-[15px] text-[#374151] placeholder-[#c8cbd9] focus:outline-none focus:ring-2 focus:ring-[#e8eeff] focus:border-[#004ac6] transition-colors" />
                            </div>

                            {/* Grade */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[12px] font-semibold text-[#374151] uppercase tracking-[0.4px]">Grade / Level</label>
                                <div className="relative">
                                    <select value={grade} onChange={(e) => setGrade(e.target.value)}
                                        className="appearance-none w-full border border-[#e2e8f0] rounded-xl px-4 py-3 text-[15px] text-[#374151] focus:outline-none focus:ring-2 focus:ring-[#e8eeff] focus:border-[#004ac6] transition-colors bg-white">
                                        <option value="">Select grade...</option>
                                        {GRADE_OPTIONS.map((g) => (
                                            <option key={g}>{g}</option>
                                        ))}
                                    </select>
                                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9ba3af] pointer-events-none" />
                                </div>
                            </div>

                            {/* Info */}
                            <div className="flex items-start gap-2.5 bg-[#f0f9ff] border border-[#bae6fd] rounded-xl px-3.5 py-3">
                                <Info size={14} className="text-[#0284c7] mt-0.5 shrink-0" />
                                <p className="text-[12px] text-[#0369a1] leading-4">
                                    A unique QR code will be instantly generated and the student will be added to the operator's order in real time.
                                </p>
                            </div>

                            <button onClick={handleSubmit} disabled={!name.trim() || !selectedOrder || loading}
                                className="flex items-center justify-center gap-2 py-3.5 rounded-xl bg-[#004ac6] text-white text-[15px] font-semibold hover:bg-[#003da6] disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm">
                                {loading
                                    ? <><Loader2 size={18} className="animate-spin" /> Adding…</>
                                    : <><UserPlus size={18} /> Register & Generate QR</>}
                            </button>
                        </div>
                    </div>
                ) : (
                    /* ── Success state ── */
                    <div className="bg-white border border-[#e2e8f0] rounded-2xl p-5 md:p-6 max-w-[520px] shadow-[0px_1px_4px_rgba(0,0,0,0.05)]">
                        <div className="flex flex-col items-center gap-4 py-2">
                            <div className="w-16 h-16 rounded-2xl bg-[#dcfce7] flex items-center justify-center">
                                <CheckCircle2 size={30} className="text-[#22c55e]" />
                            </div>
                            <div className="text-center">
                                <p className="text-[18px] font-bold text-[#0b1c30]">Student Added!</p>
                                <p className="text-[13px] text-[#64748b] mt-1">QR code generated and batch updated.</p>
                            </div>
                        </div>

                        {/* Student card */}
                        <div className="flex items-center gap-3 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl px-4 py-3.5 mt-4">
                            <Avatar name={added.full_name} id={added.id} size={44} />
                            <div className="flex-1 min-w-0">
                                <div className="text-[15px] font-bold text-[#0b1c30]">{added.full_name}</div>
                                <div className="text-[12px] text-[#9ba3af]">{added.grade_level}</div>
                                <div className="text-[11px] font-mono text-[#64748b] mt-0.5">{added.student_id}</div>
                            </div>
                            <span className="text-[11px] font-bold text-[#004ac6] bg-[#e8eeff] px-2.5 py-1 rounded-full shrink-0">Walk-in</span>
                        </div>

                        {/* QR preview / full QR */}
                        <div className="flex justify-center my-5">
                            {added.qr_code_url ? (
                                <div className="bg-white border-2 border-[#e2e8f0] rounded-xl p-4 inline-flex shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
                                    <img src={added.qr_code_url} alt="QR code" className="w-[140px] h-[140px] object-contain" />
                                </div>
                            ) : (
                                <div className="w-[140px] h-[140px] bg-[#f8fafc] border-2 border-[#e2e8f0] rounded-xl flex flex-col items-center justify-center gap-2">
                                    <QrCode size={32} className="text-[#c8cbd9]" />
                                    <span className="text-[11px] text-[#9ba3af]">Generating…</span>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-3">
                            {added.qr_code_url && (
                                <button onClick={() => setQrOpen(true)}
                                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[#004ac6] text-white text-[14px] font-semibold hover:bg-[#003da6] transition-colors shadow-sm">
                                    <QrCode size={16} />
                                    Show Full QR
                                </button>
                            )}
                            <button onClick={handleReset}
                                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-white border border-[#e2e8f0] text-[#374151] text-[14px] font-semibold hover:bg-[#f8fafc] transition-colors">
                                <UserPlus size={16} />
                                Add Another
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
