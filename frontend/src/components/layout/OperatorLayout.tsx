import type { ReactNode } from 'react'
import OperatorSidebar from './OperatorSidebar'
import OperatorTopbar from './OperatorTopbar'

export default function OperatorLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#F7F8FA]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <OperatorSidebar />
      <div style={{ marginLeft: 220, flex: 1, display: 'flex', flexDirection: 'column' }}>
        <OperatorTopbar />
        <main style={{ marginTop: 60, flex: 1 }}>
          {children}
        </main>
      </div>
    </div>
  )
}
