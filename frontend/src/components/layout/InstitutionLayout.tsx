import type { ReactNode } from 'react'
import InstitutionSidebar from './InstitutionSidebar'
import InstitutionTopbar from './InstitutionTopbar'

export default function InstitutionLayout({ children }: { children: ReactNode }) {
    return (
        <div className="flex min-h-screen bg-[#f7f8fa]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            <InstitutionSidebar />
            <div style={{ marginLeft: 200, flex: 1, display: 'flex', flexDirection: 'column' }}>
                <InstitutionTopbar />
                <main style={{ marginTop: 56, flex: 1 }}>
                    {children}
                </main>
            </div>
        </div>
    )
}
