import { Bell, Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function InstitutionTopbar() {
    const navigate = useNavigate()

    return (
        <header
            className="fixed top-0 left-[var(--sidebar-width)] right-0 z-10 h-[56px] bg-white border-b border-[#e8eaed] flex items-center justify-end px-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">

            {/* Right actions */}
            <div className="flex items-center gap-1">
                <button className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-[#f8fafc] transition-colors border border-transparent hover:border-[#e2e8f0]">
                    <Bell size={16} className="text-[#64748b]" />
                </button>

                <div className="w-px h-7 bg-[#e2e8f0] mx-2" />

                <button
                    onClick={() => navigate('/client/orders/new')}
                    className="flex items-center gap-1.5 bg-[#7e22ce] text-white text-[13px] font-medium px-4 py-[7px] rounded-lg hover:bg-[#6b21a8] transition-colors shadow-sm">
                    <Plus size={14} />
                    New Order
                </button>
            </div>
        </header>
    )
}
