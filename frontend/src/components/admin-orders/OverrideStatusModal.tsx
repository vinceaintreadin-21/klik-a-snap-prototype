import { useState } from "react"
import { useOverrideOrderStatus } from "../../hooks/useAdminOrders"
import type { AdminOrder } from "../../hooks/useAdminOrders"
import AdminOrderStatusBadge from "./AdminOrderStatusBadge"

const ORDER_STATUSES = ['PENDING', 'PROCESSING', 'PROOFING', 'APPROVED', 'PRINTING', 'COMPLETED', 'CANCELLED']

interface Props {
    order: AdminOrder
    onClose: () => void
    onSuccess: () => void
}

const OverrideStatusModal = ({ order, onClose, onSuccess }: Props) => {
    const { overrideStatus, loading, error } = useOverrideOrderStatus()
    const [selectedStatus, setSelectedStatus] = useState(order.status)
    const [reason, setReason] = useState('')

    const handleConfirm = async () => {
        const result = await overrideStatus(order.id, selectedStatus, reason)
        if (result) {
            onSuccess()
            onClose()
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">Override Order Status</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
                </div>

                <div className="mb-4">
                    <p className="text-xs text-gray-500 mb-1">Order</p>
                    <p className="text-sm text-gray-700">{order.school_name} — {order.batch_name}</p>
                </div>

                <div className="mb-4">
                    <p className="text-xs text-gray-500 mb-1">Current Status</p>
                    <AdminOrderStatusBadge status={order.status} />
                </div>

                <div className="mb-4">
                    <label className="block text-xs font-medium text-gray-600 mb-1">New Status</label>
                    <select
                        value={selectedStatus}
                        onChange={e => setSelectedStatus(e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        {ORDER_STATUSES.map(s => (
                            <option key={s} value={s}>{s}</option>
                        ))}
                    </select>
                </div>

                <div className="mb-4">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Reason (optional)</label>
                    <textarea
                        value={reason}
                        onChange={e => setReason(e.target.value)}
                        rows={3}
                        placeholder="e.g. Client requested cancellation"
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2 mb-4">
                    <p className="text-xs text-yellow-700">⚠️ This will bypass the normal workflow.</p>
                </div>

                {error && <p className="text-sm text-red-500 mb-3">{error}</p>}

                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={loading}
                        className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition"
                    >
                        {loading ? 'Saving...' : 'Confirm Override'}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default OverrideStatusModal