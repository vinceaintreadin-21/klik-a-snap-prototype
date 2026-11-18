import type { ReactNode } from 'react'
import OperatorSidebar from './OperatorSidebar'
import OperatorTopbar from './OperatorTopbar'
import ResponsiveSidebarLayout from './ResponsiveSidebarLayout'

export default function OperatorLayout({ children }: { children: ReactNode }) {
  return (
    <ResponsiveSidebarLayout sidebarWidth={220} renderSidebar={props => <OperatorSidebar {...props} />}>
      <OperatorTopbar />
      <main style={{ marginTop: 60, flex: 1 }}>
        {children}
      </main>
    </ResponsiveSidebarLayout>
  )
}
