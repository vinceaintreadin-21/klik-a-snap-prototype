import React, { useState } from 'react';
import api from '../utils/api';
import { useOrders } from '../context/OrderContext';
import LayoutConfigModal from './LayoutConfigModal'; // We'll build this next

const OperatorDashboard = () => {
  const { orders, updateStatus } = useOrders();
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [isLayoutModalOpen, setIsLayoutModalOpen] = useState(false);

  // 1. Trigger AI Engine (POST /orders/<pk>/process/)
  const handleStartAI = async (id: number) => {
    try {
      const res = await api.post(`/orders/${id}/process/`);
      // Update local state to show it's processing
      updateStatus(id, 'PROCESSING');
      alert(res.data.message);
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to start AI engine.");
    }
  };

  // 2. Finalize Production (POST /orders/<pk>/complete/)
  const handleCompleteOrder = async (id: number) => {
    if (!window.confirm("Are you sure? This will generate final print sheets.")) return;
    
    try {
      const res = await api.post(`/orders/${id}/complete/`);
      updateStatus(id, 'COMPLETED');
      alert("Order finalized! Print sheets are ready.");
    } catch (err: any) {
      alert(err.response?.data?.error || "Cannot complete order yet.");
    }
  };

  const openLayoutEditor = (id: number) => {
    setSelectedOrderId(id);
    setIsLayoutModalOpen(true);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <table className="w-full text-left">
        <thead className="bg-gray-50 border-b border-gray-100">
          <tr>
            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Order Details</th>
            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Status</th>
            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {orders.map((order) => (
            <tr key={order.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4">
                <p className="font-bold text-gray-900">{order.school_name}</p>
                <p className="text-xs text-gray-400">{order.batch_name} • {order.student_count} pax</p>
              </td>
              <td className="px-6 py-4">
                <span className={`text-xs font-black px-2 py-1 rounded ${
                  order.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  {order.status}
                </span>
              </td>
              <td className="px-6 py-4 text-right space-x-2">
                {/* BUTTON 1: Layout Config */}
                <button 
                  onClick={() => openLayoutEditor(order.id)}
                  className="px-4 py-2 text-xs font-bold border border-gray-200 rounded-lg hover:bg-gray-100 transition-all"
                >
                  Layout
                </button>

                {/* BUTTON 2: AI Process */}
                <button 
                  disabled={order.status === 'PROCESSING'}
                  onClick={() => handleStartAI(order.id)}
                  className={`px-4 py-2 text-xs font-bold rounded-lg text-white shadow-md active:scale-95 transition-all ${
                    order.status === 'PROCESSING' ? 'bg-gray-400' : 'bg-indigo-600 hover:bg-indigo-700'
                  }`}
                >
                  {order.status === 'PROCESSING' ? 'Running...' : 'Run AI'}
                </button>

                {/* BUTTON 3: Complete */}
                <button 
                  onClick={() => handleCompleteOrder(order.id)}
                  className="px-4 py-2 text-xs font-bold bg-green-600 text-white rounded-lg hover:bg-green-700 shadow-md transition-all"
                >
                  Finalize
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Modal for ID Layouting */}
      {isLayoutModalOpen && selectedOrderId && (
        <LayoutConfigModal 
          orderId={selectedOrderId} 
          onClose={() => setIsLayoutModalOpen(false)} 
        />
      )}
    </div>
  );
};

export default OperatorDashboard;