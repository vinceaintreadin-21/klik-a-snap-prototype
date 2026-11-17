import { type ReactNode, useState, useEffect } from 'react'
import CoordinatorSidebar from './CoordinatorSidebar'
import CoordinatorTopbar from './CoordinatorTopbar'
import CoordinatorBottomNav from './CoordinatorBottomNav'
import api from '../../utils/api'

export interface ActiveBatch {
    school_name: string
    batch_name: string
}

export default function CoordinatorLayout({ children }: { children: ReactNode }) {
    const [collapsed, setCollapsed] = useState(false)
    const sidebarWidthClass = collapsed ? 'md:[--sidebar-width:64px]' : ''

    const [activeBatch, setActiveBatch] = useState<ActiveBatch | null>(null)

    useEffect(() => {
        api.get('/coordinator/orders/')
            .then((res) => {
                if (Array.isArray(res.data) && res.data.length > 0) {
                    const first = res.data[0]
                    setActiveBatch({
                        school_name: first.school_name,
                        batch_name: first.batch_name,
                    })
                }
            })
            .catch(() => {
                // silent — sidebar will show fallback
            })
    }, [])

    return (
        <div className={`min-h-screen bg-[#f7f8fa] [--sidebar-width:200px] ${sidebarWidthClass}`} style={{ fontFamily: "'DM Sans', sans-serif" }}>
            <CoordinatorSidebar activeBatch={activeBatch} collapsed={collapsed} onToggle={() => setCollapsed(previous => !previous)} />
            <CoordinatorTopbar />
            <main className="md:ml-[var(--sidebar-width)] pt-[56px] min-h-screen pb-[72px] md:pb-0">
                {children}
            </main>
            <CoordinatorBottomNav />
        </div>
    )
}
