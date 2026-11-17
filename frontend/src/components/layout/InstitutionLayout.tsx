import { useState, type ReactNode } from 'react'
import InstitutionSidebar from './InstitutionSidebar'
import InstitutionTopbar from './InstitutionTopbar'

export default function InstitutionLayout({ children }: { children: ReactNode }) {
    const [collapsed, setCollapsed] = useState(false)
    const sidebarWidthClass = collapsed ? 'md:[--sidebar-width:64px]' : ''

    return (
        <div className={`flex min-h-screen bg-[#f7f8fa] [--sidebar-width:200px] ${sidebarWidthClass}`} style={{ fontFamily: "'DM Sans', sans-serif" }}>
            <InstitutionSidebar collapsed={collapsed} onToggle={() => setCollapsed(previous => !previous)} />
            <div style={{ marginLeft: 'var(--sidebar-width)', minWidth: 0, flex: 1, display: 'flex', flexDirection: 'column' }}>
                <InstitutionTopbar />
                <main style={{ marginTop: 56, flex: 1 }}>
                    {children}
                </main>
            </div>
        </div>
    )
}
