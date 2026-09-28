import type { ReactNode } from 'react'
import CoordinatorSidebar from './CoordinatorSidebar'
import CoordinatorTopbar from './CoordinatorTopbar'
import CoordinatorBottomNav from './CoordinatorBottomNav'

export default function CoordinatorLayout({ children }: { children: ReactNode }) {
    return (
        <div className="min-h-screen bg-[#f7f8fa]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            <CoordinatorSidebar />
            <CoordinatorTopbar />
            <main className="md:ml-[200px] pt-[56px] min-h-screen pb-[72px] md:pb-0">
                {children}
            </main>
            <CoordinatorBottomNav />
        </div>
    )
}
