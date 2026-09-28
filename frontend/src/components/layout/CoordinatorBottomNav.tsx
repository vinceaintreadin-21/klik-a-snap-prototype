import { useNavigate, useLocation } from 'react-router-dom'
import {
    LayoutDashboard, Search, Users, UserPlus, CheckSquare,
} from 'lucide-react'
import { cn } from '../../lib/utils'

const NAV_ITEMS = [
    { key: 'dashboard', icon: LayoutDashboard, label: 'Home', path: '/coordinator/dashboard' },
    { key: 'lookup', icon: Search, label: 'Lookup', path: '/coordinator/lookup' },
    { key: 'students', icon: Users, label: 'Students', path: '/coordinator/students' },
    { key: 'quick-add', icon: UserPlus, label: 'Add', path: '/coordinator/quick-add' },
    { key: 'proofing', icon: CheckSquare, label: 'Proofing', path: '/coordinator/proofing' },
]

export default function CoordinatorBottomNav() {
    const navigate = useNavigate()
    const location = useLocation()

    const isActive = (path: string) =>
        location.pathname === path ||
        (path !== '/coordinator/dashboard' && location.pathname.startsWith(path))

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#e2e8f0] flex z-20 shadow-[0_-2px_12px_rgba(0,0,0,0.06)]">
            {NAV_ITEMS.map((item) => {
                const active = isActive(item.path)
                return (
                    <button
                        key={item.key}
                        onClick={() => navigate(item.path)}
                        className="flex-1 flex flex-col items-center justify-center py-2.5 gap-1 transition-colors relative">
                        {active && (
                            <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-[#004ac6] rounded-full" />
                        )}
                        <item.icon size={18} className={active ? 'text-[#004ac6]' : 'text-[#9ba3af]'} />
                        <span className={cn('text-[9px] font-medium leading-none', active ? 'text-[#004ac6]' : 'text-[#9ba3af]')}>
                            {item.label}
                        </span>
                    </button>
                )
            })}
        </nav>
    )
}
