import type { ReactNode } from 'react'
import AdminSidebar from './AdminSidebar'
import AdminTopbar from './AdminTopbar'
import ResponsiveSidebarLayout from './ResponsiveSidebarLayout'

interface Props {
  children: ReactNode
}

export default function AdminLayout({ children }: Props) {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 99px; }
        @keyframes kas-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>

      <ResponsiveSidebarLayout
        sidebarWidth={220}
        contentGutter={10}
        renderSidebar={props => <AdminSidebar {...props} />}
      >
        <AdminTopbar />
        <main style={{ marginTop: 60, padding: '32px 28px', flex: 1 }}>
          {children}
        </main>
      </ResponsiveSidebarLayout>
    </>
  )
}
