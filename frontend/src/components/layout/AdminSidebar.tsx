import CollapsibleSidebar, { type SidebarToggleProps } from './CollapsibleSidebar'
import { useNavigate, useLocation } from 'react-router-dom'
import { useState } from 'react'
import {
  LayoutDashboard, ShoppingBag, Building2, Users, BarChart2,
  ScrollText, ChevronDown, GitBranch,
} from 'lucide-react'
import SidebarNavButton from './SidebarNavButton'
import { cn } from '../../lib/utils'

type AdminView = 'dashboard' | 'orders' | 'institutions' | 'operators' | 'analytics' | 'logs' | 'processing-logs' | 'audit-log'

const NAV_ITEMS: { key: AdminView; icon: React.ElementType; label: string; path: string; badge?: number }[] = [
  { key: 'dashboard',    icon: LayoutDashboard, label: 'Dashboard',    path: '/admin/dashboard'    },
  { key: 'orders',       icon: ShoppingBag,     label: 'Orders',       path: '/admin/orders'       },
  { key: 'institutions', icon: Building2,       label: 'Institutions', path: '/admin/institutions' },
  { key: 'operators',    icon: Users,           label: 'Operators',    path: '/admin/operators'    },
  { key: 'analytics',    icon: BarChart2,       label: 'Analytics',    path: '/admin/analytics'    },
]

const LOGS_ITEMS: { path: string; icon: React.ElementType; label: string }[] = [
  { path: '/admin/logs/processing', icon: GitBranch,  label: 'Processing Logs' },
  { path: '/admin/logs/audit',      icon: ScrollText, label: 'Audit Log'       },
]

export default function AdminSidebar(toggleProps: SidebarToggleProps) {
  const navigate = useNavigate()
  const location = useLocation()

  const logsActive = location.pathname.startsWith('/admin/logs')
  const [logsOpen, setLogsOpen] = useState(logsActive)

  const isActive = (path: string) => location.pathname === path

  return (
    <CollapsibleSidebar
      {...toggleProps}
      brand="QueueBits"
      role="Admin"
      avatarClassName="bg-gradient-to-br from-purple-400 to-indigo-600"
    >
      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.path)
          return (
            <SidebarNavButton
              key={item.label}
              collapsed={toggleProps.collapsed}
              label={item.label}
              aria-current={active ? 'page' : undefined}
              onClick={() => navigate(item.path)}
              className={cn(
                'gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150',
                active
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50 font-normal'
              )}
              trailing={item.badge ? (
                <span className="text-[10px] font-semibold bg-blue-100 text-blue-700 rounded-full px-1.5 py-0.5 leading-none">
                  {item.badge}
                </span>
              ) : null}
            >
              {active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-blue-600 rounded-full" />
              )}
              <item.icon
                size={16}
                className={cn('shrink-0 transition-colors', active ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600')}
              />
            </SidebarNavButton>
          )
        })}

        {/* Logs group */}
        <SidebarNavButton
          collapsed={toggleProps.collapsed}
          label="Logs"
          onClick={() => setLogsOpen(o => !o)}
          className={cn(
            'gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150',
            logsActive
              ? 'text-blue-700 font-medium'
              : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50 font-normal'
          )}
          aria-expanded={logsOpen}
          trailing={(
            <ChevronDown
              size={14}
              aria-hidden="true"
              className={cn('text-gray-400 transition-transform duration-200', logsOpen ? 'rotate-180' : 'rotate-0')}
            />
          )}
        >
          <ScrollText
            size={16}
            className={cn('shrink-0 transition-colors', logsActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600')}
          />
        </SidebarNavButton>

        {logsOpen && (
          <div className={cn('space-y-0.5', !toggleProps.collapsed && 'pl-5')}>
            {LOGS_ITEMS.map((item) => {
              const active = isActive(item.path)
              return (
                <SidebarNavButton
                  key={item.label}
                  collapsed={toggleProps.collapsed}
                  label={item.label}
                  aria-current={active ? 'page' : undefined}
                  onClick={() => navigate(item.path)}
                  className={cn(
                    'gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-all duration-150',
                    active
                      ? 'bg-blue-50 text-blue-700 font-medium'
                      : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50 font-normal'
                  )}
                >
                  {active && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-blue-600 rounded-full" />
                  )}
                  <item.icon
                    size={14}
                    className={cn('shrink-0 transition-colors', active ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600')}
                  />
                </SidebarNavButton>
              )
            })}
          </div>
        )}
      </nav>
    </CollapsibleSidebar>
  )
}
