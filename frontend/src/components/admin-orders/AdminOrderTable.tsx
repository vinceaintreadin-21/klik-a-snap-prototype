import { useState } from "react";
import AssignOperatorModal from "./AssignOperatorModal";
import type { AdminOrder } from "../../hooks/useAdminOrders";
import AdminOrderStatusBadge from "./AdminOrderStatusBadge";
import OverrideStatusModal from "./OverrideStatusModal";

interface Props {
    orders: AdminOrder[]
    loading: boolean 
    error: string | null
    onRefetch: () => void
}

const AdminOrderTable = ({ orders, loading, error, onRefetch }: Props) => {
    const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null)
    const [overrideOrder, setOverrideOrder] = useState<AdminOrder | null>(null)

    if (loading) return <p className="text-sm text-gray-500">Loading orders...</p>
    if (error) return <p className="text-sm text-red-500">{error}</p>
    if (!orders.length) return <p className="text-sm text-gray-400">No orders found.</p>

    return (
        <>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead>
                        <tr className="text-xs text-gray-400 border-b border-gray-100">
                            <th className="px-4 py-3">Institution</th>
                            <th className="px-4 py-3">School / Batch</th>
                            <th className="px-4 py-3">Students</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3">Operator</th>
                            <th className="px-4 py-3">Deadline</th>
                            <th className="px-4 py-3">Created</th>
                            <th className="px-4 py-3">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.map(order => (
                            <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50">
                                <td className="px-4 py-3 text-gray-700">{order.institution__name}</td>
                                <td className="px-4 py-3">
                                    <p className="text-gray-700">{order.school_name}</p>
                                    <p className="text-xs text-gray-400">{order.batch_name}</p>
                                </td>
                                <td className="px-4 py-3 text-gray-600">{order.student_count}</td>
                                <td className="px-4 py-3"><AdminOrderStatusBadge status={order.status} /></td>
                                <td className="px-4 py-3 text-gray-500">
                                    {order.assigned_operator__username ?? 'Unassigned'}
                                </td>
                                <td className="px-4 py-3 text-gray-500">
                                    {order.deadline ? new Date(order.deadline).toLocaleDateString() : '—'}
                                </td>
                                <td className="px-4 py-3 text-gray-400">
                                    {new Date(order.created_at).toLocaleDateString()}
                                </td>
                                <td className="px-4 py-3 flex gap-2">
                                    <button
                                        onClick={() => setSelectedOrder(order)}
                                        className="text-xs text-blue-600 hover:underline"
                                    >
                                        Assign
                                    </button>
                                    <button
                                        onClick={() => setOverrideOrder(order)}
                                        className="text-xs text-red-500 hover:underline"
                                    >
                                        Override
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {selectedOrder && (
                <AssignOperatorModal
                    order={selectedOrder}
                    onClose={() => setSelectedOrder(null)}
                    onSuccess={() => { setSelectedOrder(null); onRefetch() }}
                />
            )}

            {overrideOrder && (
              <OverrideStatusModal
                  order={overrideOrder}
                  onClose={() => setOverrideOrder(null)}
                  onSuccess={() => { setOverrideOrder(null); onRefetch() }}
              />
            )}
        </>
    )
}

export default AdminOrderTable