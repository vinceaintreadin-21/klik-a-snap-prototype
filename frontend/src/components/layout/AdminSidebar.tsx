import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useState } from 'react'
import {
  LayoutDashboard, ShoppingBag, Building2, Users, BarChart2,
  ScrollText, ChevronDown, GitBranch,
} from 'lucide-react'
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

export default function AdminSidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()

  const logsActive = location.pathname.startsWith('/admin/logs')
  const [logsOpen, setLogsOpen] = useState(logsActive)

  const isActive = (path: string) => location.pathname === path

  const initials = user?.username
    ? user.username.slice(0, 2).toUpperCase()
    : 'AD'

  return (
    <aside className="fixed left-0 top-0 h-full w-[220px] bg-white border-r border-gray-100 flex flex-col z-10 shadow-sm">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-gray-100">
        <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-md shadow-blue-200">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <rect x="2" y="2" width="6" height="6" rx="1.5" fill="white" opacity="0.9" />
            <rect x="10" y="2" width="6" height="6" rx="1.5" fill="white" opacity="0.6" />
            <rect x="2" y="10" width="6" height="6" rx="1.5" fill="white" opacity="0.6" />
            <rect x="10" y="10" width="6" height="6" rx="1.5" fill="white" opacity="0.9" />
          </svg>
        </div>
        <div>
          <div className="text-[13px] font-bold text-gray-900 tracking-tight leading-none">QueueBits</div>
          <div className="text-[10px] font-medium text-purple-500 tracking-widest uppercase leading-none mt-0.5">Admin</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.path)
          return (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 group relative',
                active
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50 font-normal'
              )}
            >
              {active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-blue-600 rounded-full" />
              )}
              <item.icon
                size={16}
                className={cn('shrink-0 transition-colors', active ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600')}
              />
              <span className="flex-1 text-left">{item.label}</span>
              {item.badge && (
                <span className="text-[10px] font-semibold bg-blue-100 text-blue-700 rounded-full px-1.5 py-0.5 leading-none">
                  {item.badge}
                </span>
              )}
            </button>
          )
        })}

        {/* Logs group */}
        <button
          onClick={() => setLogsOpen(o => !o)}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 group relative',
            logsActive
              ? 'text-blue-700 font-medium'
              : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50 font-normal'
          )}
        >
          <ScrollText
            size={16}
            className={cn('shrink-0 transition-colors', logsActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600')}
          />
          <span className="flex-1 text-left">Logs</span>
          <ChevronDown
            size={14}
            className={cn('text-gray-400 transition-transform duration-200', logsOpen ? 'rotate-180' : 'rotate-0')}
          />
        </button>

        {logsOpen && (
          <div className="pl-5 space-y-0.5">
            {LOGS_ITEMS.map((item) => {
              const active = isActive(item.path)
              return (
                <button
                  key={item.label}
                  onClick={() => navigate(item.path)}
                  className={cn(
                    'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-all duration-150 group relative',
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
                  <span className="flex-1 text-left">{item.label}</span>
                </button>
              )
            })}
          </div>
        )}
      </nav>

      {/* User profile */}
      <div className="px-4 py-4 border-t border-gray-100">
        <div className="flex items-center gap-3">
          <div className="relative shrink-0">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-indigo-600 flex items-center justify-center text-white text-xs font-bold">
              {initials}
            </div>
            <span className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-400 rounded-full border border-white" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[13px] font-medium text-gray-900 truncate leading-none">{user?.username ?? 'Admin'}</div>
            <div className="text-[11px] text-gray-400 leading-none mt-1">Admin</div>
          </div>
          <button
            onClick={() => logout()}
            className="text-[11px] text-gray-400 hover:text-red-500 transition-colors shrink-0"
            title="Sign out"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  )
}
