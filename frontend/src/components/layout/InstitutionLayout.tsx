import type { ReactNode } from 'react'
import InstitutionSidebar from './InstitutionSidebar'
import InstitutionTopbar from './InstitutionTopbar'
import ResponsiveSidebarLayout from './ResponsiveSidebarLayout'

export default function InstitutionLayout({ children }: { children: ReactNode }) {
    return (
        <ResponsiveSidebarLayout sidebarWidth={200} renderSidebar={props => <InstitutionSidebar {...props} />}>
            <InstitutionTopbar />
            <main style={{ marginTop: 56, flex: 1 }}>
                {children}
            </main>
        </ResponsiveSidebarLayout>
    )
}
