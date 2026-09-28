import { useState, useEffect, useCallback } from 'react'
import {
    ChevronRight, ChevronDown, Search, Plus, Eye, Send,
    MoreVertical, Users,
} from 'lucide-react'
import { LINK_STATUS_CFG } from '../../components/institutions/institutionTypes'
import GenerateCoordinatorModal from '../../components/institutions/GenerateCoordinatorModal'
import api from '../../utils/api'

interface Coordinator {
    id: number
    name: string
    email: string
    link_status: 'Active' | 'Expired' | 'Pending'
    photos_captured: number
    photo_limit: number
}

export default function InstitutionCoordinatorsPage() {
    const [coords, setCoords] = useState<Coordinator[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [linkFilter, setLinkFilter] = useState('All')
    const [showModal, setShowModal] = useState(false)

    const fetchCoordinators = useCallback(async () => {
        setLoading(true)
        try {
            const res = await api.get('/institution/coordinators/')
            // Backend returns coordinator invite records — map to UI shape
            const data = res.data?.coordinators ?? res.data ?? []
            setCoords(data.map((c: any) => ({
                id: c.id,
                name: c.name ?? c.coordinator_name ?? c.username ?? 'Unnamed',
                email: c.email ?? c.coordinator_email ?? '',
                link_status: c.link_status ?? (c.is_active ? 'Active' : c.accepted ? 'Active' : c.expires_at && new Date(c.expires_at) < new Date() ? 'Expired' : 'Pending'),
                photos_captured: c.photos_captured ?? 0,
                photo_limit: c.photo_limit ?? 200,
            })))
        } catch (err) {
            console.error('Failed to load coordinators', err)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { fetchCoordinators() }, [fetchCoordinators])

    const filtered = coords.filter((c) => {
        const matchSearch = !search ||
            c.name.toLowerCase().includes(search.toLowerCase()) ||
            c.email.toLowerCase().includes(search.toLowerCase())
        const matchLink = linkFilter === 'All' || c.link_status === linkFilter
        return matchSearch && matchLink
    })

    const activeCount = coords.filter((c) => c.link_status === 'Active').length
    const expiredCount = coords.filter((c) => c.link_status === 'Expired').length
    const pendingCount = coords.filter((c) => c.link_status === 'Pending').length

    const getInitials = (name: string) => name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    const getHue = (id: number) => (id * 47) % 360

    return (
        <div className="flex flex-col min-h-full">
            {showModal && (
                <GenerateCoordinatorModal
                    onClose={() => setShowModal(false)}
                    onSuccess={() => { setShowModal(false); fetchCoordinators() }}
                />
            )}

            {/* Header */}
            <div className="px-8 pt-7 pb-6 border-b border-[#eceef0] bg-white">
                <nav className="flex items-center gap-1.5 text-[12px] mb-3">
                    <span className="text-[#9ba3af]">Institution</span>
                    <ChevronRight size={11} className="text-[#c8cbd9]" />
                    <span className="text-[#374151] font-medium">Coordinators</span>
                </nav>
                <div className="flex items-start justify-between">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-[24px] font-bold text-[#0b1c30] leading-tight tracking-[-0.3px]">Coordinators</h1>
                            <span className="bg-[#004ac6] text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full">{coords.length} Members</span>
                        </div>
                        <p className="text-[14px] text-[#64748b] mt-1">Staff authorized to capture student photos via mobile capture link.</p>
                    </div>
                    <button onClick={() => setShowModal(true)}
                        className="flex items-center gap-2 bg-[#004ac6] text-white text-[14px] font-medium px-4 py-2.5 rounded-lg hover:bg-[#003da6] transition-colors shadow-sm">
                        <Plus size={15} />
                        Generate New Coordinator
                    </button>
                </div>
            </div>

            {/* Stats strip */}
            <div className="px-8 py-3 bg-[#f8fafc] border-b border-[#f1f5f9] flex items-center gap-6">
                {[
                    { label: 'Active', count: activeCount, color: '#15803d', dot: '#22c55e' },
                    { label: 'Expired', count: expiredCount, color: '#b91c1c', dot: '#ef4444' },
                    { label: 'Pending', count: pendingCount, color: '#1d4ed8', dot: '#3b82f6' },
                ].map(({ label, count, color, dot }) => (
                    <div key={label} className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ background: dot }} />
                        <span className="text-[13px] text-[#64748b]">{label}:</span>
                        <span className="text-[13px] font-semibold" style={{ color }}>{count}</span>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="px-8 py-3.5 border-b border-[#f1f5f9] bg-white flex items-center gap-3">
                <div className="relative flex-1 max-w-[300px]">
                    <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ba3af] pointer-events-none" />
                    <input type="text" placeholder="Search by name or email…"
                        value={search} onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-lg pl-9 pr-4 py-2 text-[13px] text-[#374151] placeholder-[#9ba3af] focus:outline-none focus:ring-2 focus:ring-[#e8eeff] focus:border-[#004ac6] transition-colors" />
                </div>
                <div className="relative">
                    <select value={linkFilter} onChange={(e) => setLinkFilter(e.target.value)}
                        className="appearance-none bg-[#f8fafc] border border-[#e2e8f0] rounded-lg text-[13px] text-[#374151] pl-3 pr-8 py-2 cursor-pointer focus:outline-none hover:border-[#004ac6] transition-colors">
                        <option value="All">All Link Status</option>
                        <option value="Active">Active</option>
                        <option value="Expired">Expired</option>
                        <option value="Pending">Pending</option>
                    </select>
                    <ChevronDown size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9ba3af] pointer-events-none" />
                </div>
            </div>

            <div className="px-8 py-6 bg-[#f7f8fa] flex-1">
                <div className="bg-white border border-[#e2e8f0] rounded-2xl overflow-hidden shadow-[0px_1px_2px_rgba(0,0,0,0.04)]">
                    {loading ? (
                        <div className="flex items-center justify-center py-16">
                            <div className="w-6 h-6 border-2 border-[#004ac6] border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : (
                        <>
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="bg-[rgba(248,250,252,0.9)] border-b border-[#f1f5f9]">
                                        <th className="text-left px-6 py-3.5 text-[11px] font-bold text-[#64748b] tracking-[0.55px] uppercase">Coordinator</th>
                                        <th className="text-left px-6 py-3.5 text-[11px] font-bold text-[#64748b] tracking-[0.55px] uppercase">Email</th>
                                        <th className="text-left px-6 py-3.5 text-[11px] font-bold text-[#64748b] tracking-[0.55px] uppercase">Link Status</th>
                                        <th className="text-left px-6 py-3.5 text-[11px] font-bold text-[#64748b] tracking-[0.55px] uppercase">Photos Captured</th>
                                        <th className="text-right px-6 py-3.5 text-[11px] font-bold text-[#64748b] tracking-[0.55px] uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map((c) => {
                                        const lsCfg = LINK_STATUS_CFG[c.link_status]
                                        const hue = getHue(c.id)
                                        const bgHue = `hsl(${hue}, 55%, 48%)`
                                        const photosPct = Math.round((c.photos_captured / Math.max(c.photo_limit, 1)) * 100)
                                        return (
                                            <tr key={c.id} className="border-b border-[#f8fafc] hover:bg-[#fafbfd] transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-white text-[12px] font-bold"
                                                            style={{ background: bgHue }}>{getInitials(c.name)}</div>
                                                        <div>
                                                            <div className="text-[14px] font-medium text-[#0b1c30]">{c.name}</div>
                                                            <div className="text-[11px] text-[#9ba3af]">Photo Coordinator</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-[13px] text-[#64748b]">{c.email}</td>
                                                <td className="px-6 py-4">
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-medium"
                                                        style={{ background: lsCfg.bg, color: lsCfg.text }}>
                                                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: lsCfg.dot }} />
                                                        {c.link_status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-[90px] h-[4px] bg-[#f1f5f9] rounded-full overflow-hidden">
                                                            <div className="h-full bg-[#004ac6] rounded-full" style={{ width: `${photosPct}%` }} />
                                                        </div>
                                                        <span className="text-[13px] text-[#374151] font-medium shrink-0">
                                                            {c.photos_captured}<span className="text-[#9ba3af] font-normal"> / {c.photo_limit}</span>
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <button className="p-1.5 rounded-lg hover:bg-[#f1f5f9] transition-colors" title="View">
                                                            <Eye size={14} className="text-[#64748b]" />
                                                        </button>
                                                        <button className="p-1.5 rounded-lg hover:bg-[#e8eeff] transition-colors" title="Resend link">
                                                            <Send size={14} className="text-[#004ac6]" />
                                                        </button>
                                                        <button className="p-1.5 rounded-lg hover:bg-[#f1f5f9] transition-colors" title="More options">
                                                            <MoreVertical size={14} className="text-[#64748b]" />
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
                                    <Users size={28} className="text-[#c8cbd9]" />
                                    <p className="text-[14px] text-[#9ba3af]">
                                        {coords.length === 0 ? 'No coordinators yet' : 'No coordinators found'}
                                    </p>
                                    {coords.length === 0 && (
                                        <button onClick={() => setShowModal(true)}
                                            className="text-[13px] text-[#004ac6] hover:underline font-medium">
                                            Generate your first coordinator →
                                        </button>
                                    )}
                                </div>
                            )}

                            <div className="bg-[#f8fafc] border-t border-[#f1f5f9] flex items-center justify-between px-6 py-3">
                                <span className="text-[12px] text-[#9ba3af]">Showing {filtered.length} of {coords.length} coordinators</span>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
