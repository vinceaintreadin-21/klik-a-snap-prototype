import { useState } from 'react'
import { Bell, Plus, Search } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function InstitutionTopbar() {
    const navigate = useNavigate()
    const [query, setQuery] = useState('')

    return (
        <header
            className="fixed top-0 right-0 z-10 h-[56px] bg-white border-b border-[#e8eaed] flex items-center justify-between px-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
            style={{ left: 200 }}>

            {/* Search */}
            <div className="relative w-[280px]">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ba3af] pointer-events-none" />
                <input
                    type="text"
                    placeholder="Search orders, students…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full bg-[#f8fafc] rounded-lg pl-9 pr-4 py-[6px] text-[13px] text-[#374151] placeholder-[#9ba3af] focus:outline-none focus:ring-2 focus:ring-[#e8eeff] focus:border-[#004ac6] border border-[#e2e8f0] transition-colors"
                />
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-1">
                <button className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-[#f8fafc] transition-colors border border-transparent hover:border-[#e2e8f0]">
                    <Bell size={16} className="text-[#64748b]" />
                </button>

                <div className="w-px h-7 bg-[#e2e8f0] mx-2" />

                <button
                    onClick={() => navigate('/client/orders/new')}
                    className="flex items-center gap-1.5 bg-[#004ac6] text-white text-[13px] font-medium px-4 py-[7px] rounded-lg hover:bg-[#003da6] transition-colors shadow-sm">
                    <Plus size={14} />
                    New Order
                </button>
            </div>
        </header>
    )
}
