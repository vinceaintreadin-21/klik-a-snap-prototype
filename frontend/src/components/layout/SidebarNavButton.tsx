import type { ComponentPropsWithoutRef, ReactNode } from 'react'
import { cn } from '../../lib/utils'

interface SidebarNavButtonProps extends ComponentPropsWithoutRef<'button'> {
  collapsed: boolean
  label: string
  trailing?: ReactNode
}

export default function SidebarNavButton({
  collapsed, label, trailing, className, children, ...props
}: SidebarNavButtonProps) {
  return (
    <button
      {...props}
      type="button"
      aria-label={collapsed ? label : props['aria-label']}
      className={cn(
        'group relative flex w-full items-center text-left focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-blue-600',
        className,
        collapsed && 'justify-center px-0!',
      )}
    >
      {children}
      {!collapsed && <span className="flex-1 leading-tight">{label}</span>}
      {!collapsed && trailing && <span className="shrink-0">{trailing}</span>}
      {/* Fixed positioning lets the label extend past the scrolling nav. */}
      {collapsed && (
        <span
          aria-hidden="true"
          className="pointer-events-none invisible fixed z-10 whitespace-nowrap rounded-md bg-gray-900 px-2 py-1 text-xs font-normal text-white group-hover:visible group-focus-visible:visible"
          style={{ left: 'calc(var(--sidebar-width) + 0.5rem)' }}
        >
          {label}
        </span>
      )}
    </button>
  )
}
