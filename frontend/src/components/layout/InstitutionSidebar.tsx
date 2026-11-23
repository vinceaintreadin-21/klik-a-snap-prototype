import CollapsibleSidebar, { type SidebarToggleProps } from './CollapsibleSidebar'
import { useNavigate, useLocation } from 'react-router-dom'
import {
    LayoutDashboard, ClipboardList, Users, CheckSquare,
} from 'lucide-react'
import SidebarNavButton from './SidebarNavButton'
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

export default function InstitutionSidebar(toggleProps: SidebarToggleProps) {
    const navigate = useNavigate()
    const location = useLocation()

    const isActive = (path: string) =>
        location.pathname === path ||
        (path !== '/client/dashboard' && location.pathname.startsWith(path))

    return (
        <CollapsibleSidebar
            {...toggleProps}
            brand="QueueBits"
            role="Institution"
        >
            {/* Nav */}
            <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
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
                                    ? 'bg-[#f3e8ff] text-[#7e22ce] font-semibold'
                                    : 'text-[#64748b] hover:bg-[#f8fafc] font-normal'
                            )}>
                            {active && (
                                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-[#7e22ce] rounded-full" />
                            )}
                            <item.icon
                                size={15}
                                className={cn('shrink-0', active ? 'text-[#7e22ce]' : 'text-[#9ba3af]')}
                            />
                        </SidebarNavButton>
                    )
                })}
            </nav>
        </CollapsibleSidebar>
    )
}
