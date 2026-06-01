import React, { useState } from 'react';
import api from '../utils/api';
import { useOrders } from '../context/OrderContext';
import LayoutConfigModal from './LayoutConfigModal'; 
import UploadPhotosModal from './UploadPhotosModal';

const OperatorDashboard = () => {
  const { orders, progress, updateStatus, connectOrderSocket } = useOrders();
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [isLayoutModalOpen, setIsLayoutModalOpen] = useState(false);
  const [uploadModalOrder, setUploadModalOrder] = useState<any |null>(null)
  
  const handleStartAI = async (id: number) => {
    try {
      const res = await api.post(`/orders/${id}/process/`);
      updateStatus(id, 'PROCESSING');
      connectOrderSocket(id)
      alert(res.data.message);
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to start AI engine.");
    }
  };

  // 2. Finalize Production (POST /orders/<pk>/complete/)
  const handleCompleteOrder = async (id: number) => {
    if (!window.confirm("Are you sure you want to proceed?")) return;
    
    try {
      const res = await api.post(`/orders/${id}/complete/`);
      const newStatus = res.data.message.includes('PRINTING') ? 'PRINTING' : 'COMPLETED'
      updateStatus(id, newStatus);
      alert(res.data.message);
    } catch (err: any) {
      alert(err.response?.data?.error || "Cannot complete order yet.");
    }
  };

  const handleUploadPhotos = async (orderId: number, files: FileList | null) => {
    if (!files || files.length === 0) return 
    const formData = new FormData()
    Array.from(files).forEach(f => formData.append('files', f))
    try {
      await api.post(`/orders/${orderId}/photos/upload/`, formData, {
        headers: {'Content-Type': 'multipart/form-data'}
      })
      alert('Photos uploaded successfully')
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to upload photos')
    }
  }

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
          {orders.map((order) => {
            const p = progress[order.id] || { processed: 0, manual_review: 0, total: 0 };
              return (
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
                  {order.status === 'PROCESSING' && p &&(
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div
                        className="bg-indigo-600 h-2 rounded-full transition-all"
                        style={{ width: `${(p.processed / p.total) * 100}%` }}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {p.processed}/{p.total} processed • {p.manual_review} need review
                      </p>
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 text-right space-x-2">

                  {['PENDING', 'FAILED'].includes(order.status) && (
                    <button
                      onClick={() => setUploadModalOrder(order)}
                      className="px-4 py-2 text-xs font-bold border border-gray-200 rounded-lg hover:bg-gray-100 transition-all"
                    >
                      Upload Photos
                    </button>
                  )}
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

                  {/* APPROVED -> PROCESSING */}
                  {order.status === 'APPROVED' && (
                    <button
                      onClick={() => handleCompleteOrder(order.id)}
                      className='px-4 py-2 text-xs font-bold bg-amber-500 text-white rounded-lg hover:bg-amber-600 shadow-md transition-all'
                    >
                      Send to Print
                    </button>
                  )}

                  {/* PRINTING -> COMPLETED */}

                  {order.status === 'PRINTING' && (
                    <button
                      onClick={() => handleCompleteOrder(order.id)}
                      className="px-4 py-2 text-xs font-bold bg-green-600 text-white rounded-lg hover:bg-green-700 shadow-md transition-all"
                    >
                      Mark as Complete
                    </button>
                  )}
                </td>
              </tr>
            )
            })}
        </tbody>
      </table>

      {/* Modal for ID Layouting */}
      {isLayoutModalOpen && selectedOrderId && (
        <LayoutConfigModal 
          orderId={selectedOrderId} 
          onClose={() => setIsLayoutModalOpen(false)} 
        />
      )}

      {uploadModalOrder && (
        <UploadPhotosModal
            order={uploadModalOrder}
            onClose={() => setUploadModalOrder(null)}
            onSuccess={() => setUploadModalOrder(null)}
        />
      )}
    </div>
  );
};

export default OperatorDashboard;