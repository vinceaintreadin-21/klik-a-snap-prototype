import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
    LayoutDashboard, ClipboardList, Users, CheckSquare, LogOut,
} from 'lucide-react'
import { cn } from '../../lib/utils'

interface NavItem {
    key: string
    icon: React.ElementType
    label: string
    path: string
}

const NAV_ITEMS: NavItem[] = [
    { key: 'dashboard', icon: LayoutDashboard, label: 'Dashboard', path: '/client/dashboard' },
    { key: 'orders', icon: ClipboardList, label: 'Orders', path: '/client/orders' },
    { key: 'coordinators', icon: Users, label: 'Coordinators', path: '/client/coordinators' },
    { key: 'proofing', icon: CheckSquare, label: 'Proofing & Approvals', path: '/client/proofing' },
]

export default function InstitutionSidebar() {
    const navigate = useNavigate()
    const location = useLocation()
    const { user, logout } = useAuth()

    const isActive = (path: string) =>
        location.pathname === path ||
        (path !== '/client/dashboard' && location.pathname.startsWith(path))

    const initials = user?.username
        ? user.username.slice(0, 2).toUpperCase()
        : 'IN'

    return (
        <aside className="fixed left-0 top-0 h-full w-[200px] bg-white border-r border-[#e2e8f0] flex flex-col z-10 shadow-sm">

            {/* Logo */}
            <div className="flex items-center gap-2.5 px-4 py-5 border-b border-[#e8eaed]">
                <div className="w-8 h-8 rounded-lg bg-[#004ac6] flex items-center justify-center shrink-0">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <rect x="1" y="1" width="6" height="6" rx="1.5" fill="white" opacity="0.9" />
                        <rect x="9" y="1" width="6" height="6" rx="1.5" fill="white" opacity="0.6" />
                        <rect x="1" y="9" width="6" height="6" rx="1.5" fill="white" opacity="0.6" />
                        <rect x="9" y="9" width="6" height="6" rx="1.5" fill="white" opacity="0.9" />
                    </svg>
                </div>
                <div>
                    <div className="text-[13px] font-bold text-[#0b1c30] tracking-tight leading-none">QueueBits</div>
                    <div className="text-[9px] font-semibold text-[#004ac6] tracking-[0.08em] uppercase leading-none mt-0.5">Institution</div>
                </div>
            </div>

            {/* Nav */}
            <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
                {NAV_ITEMS.map((item) => {
                    const active = isActive(item.path)
                    return (
                        <button
                            key={item.key}
                            onClick={() => navigate(item.path)}
                            className={cn(
                                'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13px] transition-all duration-150 relative',
                                active
                                    ? 'bg-[#e8eeff] text-[#004ac6] font-semibold'
                                    : 'text-[#64748b] hover:bg-[#f8fafc] font-normal'
                            )}>
                            {active && (
                                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-[#004ac6] rounded-full" />
                            )}
                            <item.icon
                                size={15}
                                className={cn('shrink-0', active ? 'text-[#004ac6]' : 'text-[#9ba3af]')}
                            />
                            <span className="text-left leading-tight">{item.label}</span>
                        </button>
                    )
                })}
            </nav>

            {/* User profile */}
            <div className="px-4 py-4 border-t border-[#e8eaed]">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {initials}
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="text-[12px] font-semibold text-[#0b1c30] truncate">{user?.username ?? 'Institution'}</div>
                        <div className="text-[10px] text-[#9ba3af] truncate">Institution</div>
                    </div>
                    <button
                        onClick={() => logout()}
                        className="text-[#9ba3af] hover:text-red-500 transition-colors shrink-0"
                        title="Sign out">
                        <LogOut size={13} />
                    </button>
                </div>
            </div>
        </aside>
    )
}
