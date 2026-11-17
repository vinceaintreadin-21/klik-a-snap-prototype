import CollapsibleSidebar, { type SidebarToggleProps } from './CollapsibleSidebar'
import { useNavigate, useLocation } from 'react-router-dom'
import { useOrders } from '../../context/OrderContext'
import {
    LayoutDashboard, Search, Users, UserPlus, CheckSquare,
} from 'lucide-react'
import SidebarNavButton from './SidebarNavButton'
import { cn } from '../../lib/utils'
import type { ActiveBatch } from './CoordinatorLayout'

interface NavItem {
    key: string
    icon: React.ElementType
    label: string
    path: string
}

const NAV_ITEMS: NavItem[] = [
    { key: 'dashboard', icon: LayoutDashboard, label: 'Dashboard', path: '/coordinator/dashboard' },
    { key: 'lookup', icon: Search, label: 'Subject Lookup', path: '/coordinator/lookup' },
    { key: 'students', icon: Users, label: 'Subjects', path: '/coordinator/students' },
    { key: 'quick-add', icon: UserPlus, label: 'Quick Add', path: '/coordinator/quick-add' },
    { key: 'proofing', icon: CheckSquare, label: 'Proofing', path: '/coordinator/proofing' },
]

interface CoordinatorSidebarProps extends SidebarToggleProps {
    activeBatch?: ActiveBatch | null
}

export default function CoordinatorSidebar({ activeBatch, ...toggleProps }: CoordinatorSidebarProps) {
    const navigate = useNavigate()
    const location = useLocation()
    const { clearOrders } = useOrders()

    const isActive = (path: string) =>
        location.pathname === path ||
        (path !== '/coordinator/dashboard' && location.pathname.startsWith(path))

    return (
        <CollapsibleSidebar
            {...toggleProps}
            brand="Photo Day"
            role="Coordinator"
            avatarClassName="bg-[#004ac6]"
            onLogout={clearOrders}
            desktopOnly
        >
            {/* Active batch badge */}
            <div className={cn('mx-3 mt-3 mb-1 bg-[#e8eeff] rounded-xl px-3 py-2.5', toggleProps.collapsed && 'md:hidden')}>
                <div className="text-[10px] font-bold text-[#004ac6] uppercase tracking-[0.4px] mb-0.5">Active Batch</div>
                <div className="text-[12px] font-semibold text-[#0b1c30] leading-tight truncate">
                    {activeBatch?.school_name ?? '—'}
                </div>
                <div className="text-[10px] text-[#64748b] mt-0.5 truncate">
                    {activeBatch?.batch_name ?? 'Loading...'}
                </div>
            </div>

            {/* Nav */}
            <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
                {NAV_ITEMS.map((item) => {
                    const active = isActive(item.path)
                    return (
                        <SidebarNavButton
                            key={item.key}
                            collapsed={toggleProps.collapsed}
                            label={item.label}
                            aria-current={active ? 'page' : undefined}
                            onClick={() => navigate(item.path)}
                            className={cn(
                                'gap-2.5 px-3 py-2.5 rounded-lg text-[13px] transition-all duration-150',
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
                        </SidebarNavButton>
                    )
                })}
            </nav>
        </CollapsibleSidebar>
    )
}
