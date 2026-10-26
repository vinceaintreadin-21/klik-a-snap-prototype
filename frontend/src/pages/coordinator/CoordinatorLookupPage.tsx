import { useState, useEffect, useRef } from 'react'
import { Search, X, QrCode, CheckCircle2, Clock, Camera } from 'lucide-react'
import api from '../../utils/api'
import toast from 'react-hot-toast'
import CoordQRModal from '../../components/coordinator/CoordQRModal'
import type { CoordSubject } from '../../components/coordinator/coordinatorTypes'
import { getInitials, getHue } from '../../components/coordinator/coordinatorTypes'

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

// ── Result card ───────────────────────────────────────────────────────────────

function ResultCard({
    subject,
    onShowQR,
    onMark,
}: {
    subject: CoordSubject
    onShowQR: (s: CoordSubject) => void
    onMark: (s: CoordSubject) => void
}) {
    return (
        <div className="bg-white border border-[#e2e8f0] rounded-2xl p-4 shadow-[0px_1px_2px_rgba(0,0,0,0.04)] hover:shadow-md hover:border-[#c7d4f0] transition-all">
            <div className="flex items-center gap-3">
                <Avatar name={subject.full_name} id={subject.id} size={48} />
                <div className="flex-1 min-w-0">
                    <div className="text-[15px] font-bold text-[#0b1c30]">{subject.full_name}</div>
                    <div className="text-[12px] text-[#9ba3af]">
                        {subject.student_id} · {subject.grade_level}
                    </div>
                    {subject.section && (
                        <div className="text-[12px] text-[#64748b]">{subject.section}</div>
                    )}
                    {subject.is_walk_in && (
                        <span className="inline-block text-[10px] font-bold text-[#004ac6] bg-[#e8eeff] px-1.5 py-0.5 rounded-full mt-0.5">
                            Walk-in
                        </span>
                    )}
                </div>
                <div className="shrink-0">
                    {subject.is_photographed ? (
                        <div className="flex items-center gap-1.5 text-[12px] font-medium text-[#166534] bg-[#dcfce7] px-2.5 py-1 rounded-full">
                            <CheckCircle2 size={12} />
                            Photographed
                        </div>
                    ) : (
                        <div className="flex items-center gap-1.5 text-[12px] font-medium text-[#d97706] bg-[#fef3c7] px-2.5 py-1 rounded-full">
                            <Clock size={12} />
                            Pending
                        </div>
                    )}
                </div>
            </div>

            <div className="flex gap-2 mt-4">
                {subject.qr_code_url && (
                    <button
                        onClick={() => onShowQR(subject)}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#004ac6] text-white text-[13px] font-semibold hover:bg-[#003da6] transition-colors shadow-sm">
                        <QrCode size={15} />
                        Show QR Code
                    </button>
                )}
                {!subject.is_photographed && (
                    <button
                        onClick={() => onMark(subject)}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white border border-[#e2e8f0] text-[#374151] text-[13px] font-semibold hover:bg-[#f8fafc] transition-colors">
                        <Camera size={15} className="text-[#64748b]" />
                        Mark Done
                    </button>
                )}
            </div>
        </div>
    )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CoordinatorLookupPage() {
    const [query, setQuery] = useState('')
    const [results, setResults] = useState<CoordSubject[]>([])
    const [searching, setSearching] = useState(false)
    const [qrSubject, setQrSubject] = useState<CoordSubject | null>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    // Debounced search — fires after 300 ms, min 2 chars
    useEffect(() => {
        if (query.trim().length < 2) { setResults([]); return }
        const t = setTimeout(async () => {
            setSearching(true)
            try {
                const res = await api.get(`/coordinator/students/search/?q=${encodeURIComponent(query)}`)
                setResults(res.data)
            } catch {
                setResults([])
            } finally {
                setSearching(false)
            }
        }, 300)
        return () => clearTimeout(t)
    }, [query])

    const handleMarkPhotographed = async (subject: CoordSubject) => {
        try {
            const res = await api.post(`/coordinator/students/${subject.id}/mark-photographed/`)
            setResults((prev) =>
                prev.map((s) => s.id === subject.id ? { ...s, is_photographed: res.data.is_photographed } : s)
            )
        } catch {
            toast.error('Failed to update status')
        }
    }

    return (
        <div className="flex flex-col gap-0">
            {qrSubject && <CoordQRModal subject={qrSubject} onClose={() => setQrSubject(null)} />}

            {/* Header */}
            <div className="px-4 md:px-8 pt-6 pb-4 border-b border-[#eceef0] bg-white">
                <h1 className="text-[22px] md:text-[24px] font-bold text-[#0b1c30] tracking-[-0.3px]">Subject Lookup</h1>
                <p className="text-[13px] text-[#64748b] mt-1">
                    Search by name or subject ID to display QR code.
                </p>
            </div>

            <div className="px-4 md:px-8 py-5 flex flex-col gap-4">
                {/* Large search input */}
                <div className="relative">
                    <Search
                        size={18}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9ba3af] pointer-events-none"
                    />
                    <input
                        ref={inputRef}
                        autoFocus
                        type="text"
                        placeholder="Type subject name or ID..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="w-full bg-white border-2 border-[#e2e8f0] focus:border-[#004ac6] rounded-xl pl-12 pr-12 py-4 text-[16px] text-[#374151] placeholder-[#9ba3af] focus:outline-none focus:ring-4 focus:ring-[#e8eeff] transition-all shadow-[0px_1px_4px_rgba(0,0,0,0.05)]"
                    />
                    {query && (
                        <button
                            onClick={() => setQuery('')}
                            className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full bg-[#f1f5f9] hover:bg-[#e2e8f0] transition-colors">
                            <X size={12} className="text-[#64748b]" />
                        </button>
                    )}
                </div>

                {/* Searching indicator */}
                {searching && (
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 border-2 border-[#004ac6] border-t-transparent rounded-full animate-spin" />
                        <span className="text-[12px] text-[#9ba3af]">Searching...</span>
                    </div>
                )}

                {/* Results */}
                {query.trim().length >= 2 && !searching && (
                    results.length > 0 ? (
                        <div className="flex flex-col gap-3">
                            <p className="text-[12px] text-[#9ba3af] font-medium uppercase tracking-[0.4px]">
                                {results.length} result{results.length !== 1 ? 's' : ''}
                            </p>
                            {results.map((s) => (
                                <ResultCard
                                    key={s.id}
                                    subject={s}
                                    onShowQR={setQrSubject}
                                    onMark={handleMarkPhotographed}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-16 gap-3">
                            <div className="w-14 h-14 rounded-2xl bg-[#f1f5f9] flex items-center justify-center">
                                <Search size={22} className="text-[#c8cbd9]" />
                            </div>
                            <div className="text-center">
                                <p className="text-[14px] font-semibold text-[#374151]">No subject found</p>
                                <p className="text-[13px] text-[#9ba3af] mt-0.5">
                                    Check spelling or use Quick Add for walk-ins
                                </p>
                            </div>
                        </div>
                    )
                )}

                {/* Empty state */}
                {query.trim().length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 gap-3">
                        <div className="w-16 h-16 rounded-2xl bg-[#e8eeff] flex items-center justify-center">
                            <QrCode size={28} className="text-[#004ac6]" />
                        </div>
                        <p className="text-[14px] text-[#64748b] text-center leading-5 max-w-[260px]">
                            Search a subject to instantly display their QR code for photo day
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}
