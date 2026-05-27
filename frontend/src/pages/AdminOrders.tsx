import { useState } from "react";
import { useAdminOrders } from "../hooks/useAdminOrders";
import { useAnalyticsOverview } from "../hooks/useAnalytics";
import type { OrderFilters } from "../hooks/useAdminOrders";
import AdminOrderFilters from "../components/admin-orders/AdminOrderFilters";
import AdminOrderTable from "../components/admin-orders/AdminOrderTable";
import RealTimePanel from "../components/layout/RealTimePanel";
import QuickActionCards from "../components/layout/QuickActionCards";

function ShareIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  )
}

const AdminOrders = () => {
    const [filters, setFilters] = useState<OrderFilters>({})
    const { orders, loading, error, refetch } = useAdminOrders(filters)
    const { data: overview } = useAnalyticsOverview()

    const handleFilterChange = (newFilters: OrderFilters) => {
        setFilters(newFilters)
        refetch()
    }

    return (
        <div>
            {/* Page Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
                <div>
                    <h1 style={{ fontSize: 32, fontWeight: 800, color: '#f1f5f9', margin: 0, letterSpacing: '-0.5px' }}>
                        Admin Dashboard
                    </h1>
                    <p style={{ color: '#6b7280', fontSize: 14, margin: '6px 0 0', fontWeight: 400 }}>
                        Welcome back. You have{' '}
                        <span style={{ color: '#f1f5f9', fontWeight: 700 }}>
                            {overview?.pending_orders ?? '—'}
                        </span>{' '}
                        orders requiring attention.
                    </p>
                </div>
                <button style={{
                    display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px',
                    background: '#1e1e2e', border: '1px solid #2a2a3a', borderRadius: 8,
                    color: '#d1d5db', fontSize: 13, fontWeight: 500, cursor: 'pointer',
                    transition: 'all 0.15s',
                }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#2a2a3a' }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#1e1e2e' }}
                >
                    <ShareIcon /> Share View
                </button>
            </div>

            {/* Main content grid */}
            <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
                {/* Left column */}
                <div style={{ flex: 1, minWidth: 0 }}>
                    <AdminOrderFilters filters={filters} onChange={handleFilterChange} />
                    <AdminOrderTable orders={orders} loading={loading} error={error} onRefetch={refetch} />
                    <QuickActionCards />
                </div>

                {/* Right panel */}
                <RealTimePanel />
            </div>
        </div>
    )
}

export default AdminOrders
