import { useState, type ReactNode } from 'react'
import OperatorSidebar from './OperatorSidebar'
import OperatorTopbar from './OperatorTopbar'

export default function OperatorLayout({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  const sidebarWidthClass = collapsed ? 'md:[--sidebar-width:64px]' : ''

  return (
    <div className={`flex min-h-screen bg-[#F7F8FA] [--sidebar-width:220px] ${sidebarWidthClass}`} style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <OperatorSidebar collapsed={collapsed} onToggle={() => setCollapsed(previous => !previous)} />
      <div style={{ marginLeft: 'var(--sidebar-width)', minWidth: 0, flex: 1, display: 'flex', flexDirection: 'column' }}>
        <OperatorTopbar />
        <main style={{ marginTop: 60, flex: 1 }}>
          {children}
        </main>
      </div>
    </div>
  )
}
