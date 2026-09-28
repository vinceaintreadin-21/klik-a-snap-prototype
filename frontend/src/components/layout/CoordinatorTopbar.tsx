import { Bell, UserPlus, Camera } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function CoordinatorTopbar() {
    const navigate = useNavigate()

    return (
        <header
            className="fixed top-0 left-0 md:left-[200px] right-0 h-[56px] bg-white border-b border-[#e8eaed] flex items-center px-4 md:px-6 justify-between z-10 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">

            {/* Mobile logo — hidden on desktop (sidebar handles branding) */}
            <div className="flex items-center gap-2 md:hidden">
                <div className="w-7 h-7 rounded-lg bg-[#004ac6] flex items-center justify-center">
                    <Camera size={13} className="text-white" />
                </div>
                <span className="text-[13px] font-bold text-[#0b1c30]">Photo Day</span>
            </div>
            <div className="hidden md:block" />

            {/* Right actions */}
            <div className="flex items-center gap-1.5">
                <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#f8fafc] transition-colors">
                    <Bell size={15} className="text-[#64748b]" />
                </button>
                <button
                    onClick={() => navigate('/coordinator/quick-add')}
                    className="flex items-center gap-1.5 bg-[#004ac6] text-white text-[13px] font-medium px-3 py-1.5 rounded-lg hover:bg-[#003da6] transition-colors shadow-sm">
                    <UserPlus size={13} />
                    <span className="hidden sm:inline">Quick Add</span>
                </button>
            </div>
        </header>
    )
}
