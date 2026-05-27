import { useState } from "react";
import { useAssignOperator } from "../../hooks/useAdminOrders";
import type { AdminOrder } from "../../hooks/useAdminOrders";
import { useOperators } from "../../hooks/useOperators";

interface Props {
    order: AdminOrder 
    onClose: () => void 
    onSuccess: () => void 
}

const AssignOperatorModal = ({ order, onClose, onSuccess }: Props) => {
    const { assignOperator, loading, error} = useAssignOperator()
    const { operators } = useOperators()
    const [selectedId, setSelectedId] = useState<string>('')

    const handleConfirm = async () => {
        const result = await assignOperator(order.id, selectedId ? Number(selectedId): null)
        
        if (result){
            onSuccess()
            onClose()
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">Assign Operator</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">x</button>
                </div>
                
                <div className="mb-4">
                    <p className="text-xs text-gray-500 mb-1">Order</p>
                    <p className="text-sm text-gray-700">{order.school_name} — {order.batch_name}</p>
                </div>

                <div className="mb-4">
                    <p className="text-xs text-gray-500 mb-1">Current Operator</p>
                    <p className="text-sm text-gray-700">
                        {order.assigned_operator__username ?? <span className="text-gray-400">Unassigned</span>}
                    </p>
                </div>

                <div className="mb-5">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Select Operator</label>
                    <select
                        value={selectedId}
                        onChange={e => setSelectedId(e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">Unassign</option>
                        {operators.map(op => (
                            <option key={op.id} value={op.user__id}>{op.user__username}</option>
                        ))}
                    </select>
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
                        className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition"
                    >
                        {loading ? 'Saving...' : 'Confirm'}
                    </button>
                </div>
            </div>
        </div>
    )
} 

export default AssignOperatorModal