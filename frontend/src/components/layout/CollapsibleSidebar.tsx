import { useId, type ReactNode } from 'react'
import { PanelLeftClose } from 'lucide-react'
import { cn } from '../../lib/utils'
import QueueBitsLogo from '../shared/QueueBitsLogo'
import SidebarProfile from './SidebarProfile'

export interface SidebarToggleProps {
  collapsed: boolean
  onToggle: () => void
}

interface CollapsibleSidebarProps extends SidebarToggleProps {
  brand: string
  role: string
  desktopOnly?: boolean
  avatarClassName?: string
  onLogout?: () => void
  children: ReactNode
}

export default function CollapsibleSidebar({
  brand, role, desktopOnly = false, collapsed, onToggle, avatarClassName, onLogout, children,
}: CollapsibleSidebarProps) {
  const contentId = useId()
  const label = (
    <span className="min-w-0 flex-1">
      <span className="block text-[13px] font-bold leading-none text-gray-900">{brand}</span>
      <span className="mt-1 block text-[10px] font-semibold uppercase leading-none tracking-wide text-blue-600">
        {role}
      </span>
    </span>
  )

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-20 h-full w-[var(--sidebar-width)] flex-col border-r border-gray-100 bg-white shadow-sm',
        desktopOnly ? 'hidden md:flex' : 'flex',
      )}
    >
      {!desktopOnly && (
        <div className="flex items-center gap-3 border-b border-gray-100 px-4 py-5 md:hidden">
          <QueueBitsLogo className="size-9 shrink-0" />
          {label}
        </div>
      )}
      <button
        type="button"
        onClick={onToggle}
        aria-label={`${collapsed ? 'Expand' : 'Collapse'} ${brand} navigation`}
        aria-expanded={!collapsed}
        aria-controls={contentId}
        className={cn(
          'group relative hidden w-full shrink-0 items-center gap-3 border-b border-gray-100 py-5 text-left hover:bg-gray-50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-blue-600 md:flex',
          collapsed ? 'justify-center' : 'px-4',
        )}
      >
        <QueueBitsLogo className="size-9 shrink-0" />
        {collapsed ? (
          <span
            aria-hidden="true"
            className="pointer-events-none invisible absolute left-full top-1/2 ml-2 -translate-y-1/2 whitespace-nowrap rounded-md bg-gray-900 px-2 py-1 text-xs text-white group-hover:visible group-focus-visible:visible"
          >
            {brand}
          </span>
        ) : (
          <>
            {label}
            <PanelLeftClose size={16} aria-hidden="true" className="shrink-0 text-gray-500" />
          </>
        )}
      </button>
      <div id={contentId} className="flex min-h-0 flex-1 flex-col">
        {children}
        <SidebarProfile collapsed={collapsed} role={role} avatarClassName={avatarClassName} onLogout={onLogout} />
      </div>
    </aside>
  )
}
