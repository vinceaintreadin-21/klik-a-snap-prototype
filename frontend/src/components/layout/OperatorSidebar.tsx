import CollapsibleSidebar, { type SidebarToggleProps } from './CollapsibleSidebar'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, LayoutTemplate, Upload, GitBranch,
  ClipboardCheck, FileCheck, Printer,
} from 'lucide-react'
import SidebarNavButton from './SidebarNavButton'
import { cn } from '../../lib/utils'
import { useOrders } from '../../context/OrderContext'

interface NavItem {
  key: string
  icon: React.ElementType
  label: string
  path: string
  badge?: number
}

const NAV_ITEMS: NavItem[] = [
  { key: 'dashboard',      icon: LayoutDashboard, label: 'Order Dashboard',     path: '/operator/dashboard'      },
  { key: 'layout-builder', icon: LayoutTemplate,  label: 'Layout Builder',path: '/operator/layout-builder' },
  { key: 'batch-upload',   icon: Upload,          label: 'Batch Upload',  path: '/operator/batch-upload'   },
  { key: 'pipeline',       icon: GitBranch,       label: 'Pipeline',      path: '/operator/pipeline'       },
  { key: 'manual-review',  icon: ClipboardCheck,  label: 'Manual Review', path: '/operator/manual-review' },
  { key: 'proofing',       icon: FileCheck,       label: 'Proofing',      path: '/operator/proofing'       },
  { key: 'export',         icon: Printer,         label: 'Export',        path: '/operator/export'         },
]

export default function OperatorSidebar(toggleProps: SidebarToggleProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { orders } = useOrders()
  const reviewCount = orders.filter(order => ['PENDING', 'PROCESSING', 'FAILED', 'PROOFING'].includes(order.status))
    .reduce((sum, order) => sum + (order.manual_review_count ?? 0), 0)

  const isActive = (path: string) =>
    location.pathname === path ||
    (path !== '/operator/dashboard' && location.pathname.startsWith(path))

  return (
    <CollapsibleSidebar
      {...toggleProps}
      brand="QueueBits"
      role="Operator"
    >
      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.path)
          const badge = item.key === 'manual-review' ? reviewCount : item.badge
          return (
            <SidebarNavButton
              key={item.key}
              collapsed={toggleProps.collapsed}
              label={item.label}
              aria-current={active ? 'page' : undefined}
              onClick={() => navigate(item.path)}
              className={cn(
                'gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150',
                active
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50 font-normal',
              )}
              trailing={badge ? (
                <span className="text-[10px] font-semibold bg-amber-100 text-amber-700 rounded-full px-1.5 py-0.5 leading-none">
                  {badge}
                </span>
              ) : null}
            >
              {active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-blue-600 rounded-full" />
              )}
              <item.icon
                size={16}
                className={cn(
                  'shrink-0 transition-colors',
                  active ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600',
                )}
              />
            </SidebarNavButton>
          )
        })}
      </nav>
    </CollapsibleSidebar>
  )
}
