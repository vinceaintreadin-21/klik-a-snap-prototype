import { useOrdersPerMonth } from "../../hooks/useAnalytics";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";


const OrdersPerMonth = () => {
    const { data, loading, error } = useOrdersPerMonth()

    if (loading) return <p className="text-sm text-gray-500">Loading chart...</p>
    if (error) return <p className="text-sm text-red-500">{error}</p>
    if (!data.length) return <p className="text-sm text-gray-400">No orders data available</p>

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-4">Orders Per Month</h3>
            <ResponsiveContainer width="100%" height={250}>
                <BarChart data={data}>
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    )
}

export default OrdersPerMonth
