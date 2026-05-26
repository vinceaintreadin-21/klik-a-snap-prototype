import { useAnalyticsOverview } from "../../hooks/useAnalytics";

const AnalyticsOverview = () => {
    const { data, loading, error } = useAnalyticsOverview()

    if (loading) return <p className="text-sm text-gray-500">Loading overview...</p>
    if (error) return <p className="text-sm text-red-500">{error}</p>
    if (!data) return null 

    const stats = [
        { label: 'Total IDs', value: data.total_ids },
        { label: 'Total Orders', value: data.total_orders },
        { label: 'Pending Orders', value: data.pending_orders },
        { label: 'Active Institutions', value: data.active_institutions },
        { label: 'Active Operators', value: data.active_operators }
    ]

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {stats.map(stat => (
                <div key={stat.label} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                    <p className="text-xs text-gray-500 mb-1">{stat.label}</p>
                    <p className="text-2x1 font-semibold text-gray-800">{stat.value}</p>
                </div>
            ))}
        </div>
    )
}

export default AnalyticsOverview