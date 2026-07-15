import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useOrders } from '../context/OrderContext';
import api from '../utils/api';
import LayoutConfigModal from '../components/LayoutConfigModal';
import UploadPhotosModal from '../components/UploadPhotosModal';
import ManualReviewQueueModal from '../components/ManualReviewQueueModal';
import GenerateTestPhotosButton from '../components/GenerateTestPhotosButton';

const OperatorDashboard = () => {
  const { user, logout } = useAuth();
  const { orders, progress, updateStatus, connectOrderSocket, clearOrders } = useOrders();
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [isLayoutModalOpen, setIsLayoutModalOpen] = useState(false);
  const [uploadModalOrder, setUploadModalOrder] = useState<any | null>(null);
  const [ordersWithLayout, setOrdersWithLayout] = useState<Set<number>>(new Set());
  const [reviewOrder, setReviewOrder] = useState<any | null>(null)


  useEffect(() => {
    orders.forEach(async (order) => {
      try {
        await api.get(`/orders/${order.id}/layout/`);
        setOrdersWithLayout(prev => new Set(prev).add(order.id));
      } catch {

      }
    });
  }, [orders]);

  const handleLogout = () => logout(clearOrders)

  const handleStartAI = async (id: number) => {
    try {

      try {
        await api.get(`/orders/${id}/layout/`);
      } catch (layoutErr: any) {
          if (layoutErr.response?.status === 404) {
            const go = window.confirm(
              'No layout configured for this order.\n\nClick OK to open the Layout editor, then run AI after saving.'
            );
            if (go) {
              setSelectedOrderId(id);
              setIsLayoutModalOpen(true);
            }
            return; 
          }
      }
      const res = await api.post(`/orders/${id}/process/`);
      updateStatus(id, 'PROCESSING');
      connectOrderSocket(id);

      const poll = setInterval(async () => {
        try {
          const orderRes = await api.get('/orders/');
          const updated = orderRes.data.find((o: any) => o.id === id);
          if (updated && updated.status !== 'PROCESSING') {
            updateStatus(id, updated.status);
            clearInterval(poll);
          }
        } catch {
          clearInterval(poll);
        }
      }, 3000);

      alert(res.data.message);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to start AI engine.');
    }
  };

  const handleCompleteOrder = async (id: number) => {
    if (!window.confirm('Are you sure you want to proceed?')) return;
    try {
      const res = await api.post(`/orders/${id}/complete/`);
      const newStatus = res.data.message.includes('PRINTING') ? 'PRINTING' : 'COMPLETED';
      updateStatus(id, newStatus);
      alert(res.data.message);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Cannot complete order yet.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <div className="max-w-6xl mx-auto px-6 py-10">
        <header className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
          <div>
            <h1 className="text-4xl font-black text-gray-900 tracking-tight">Klik-a-Snap</h1>
            <p className="text-gray-500 font-medium">Welcome back, {user?.username}!</p>
          </div>
          <button onClick={handleLogout} className="text-sm font-bold text-red-600 hover:underline">
            Logout
          </button>
        </header>

        <main>
          <section>
            <h2 className="text-xl font-bold mb-6 text-gray-800 flex items-center">
              <span className="w-8 h-8 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-sm mr-3">1</span>
              Production Queue
            </h2>

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
                    const hasLayout = ordersWithLayout.has(order.id);

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
                          {['PROCESSING', 'PROOFING'].includes(order.status) && p.total > 0 && (
                            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                              <div
                                className="bg-indigo-600 h-2 rounded-full transition-all"
                                style={{ width: `${(p.processed / p.total) * 100}%` }}
                              />
                              {p.processed === 0 && p.manual_review > 0 && (
                                <div
                                  className="bg-red-400 h-2 rounded-full transition-all"
                                  style={{ width: `${(p.manual_review / p.total) * 100}%` }}
                                />
                              )}
                              <p className="text-xs text-gray-500 mt-1">
                                {p.processed}/{p.total} processed •
                                <span className={p.manual_review > 0 ? 'text-red-500 ml-1' : 'ml-1'}>
                                  {p.manual_review} need review
                                </span>
                              </p>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right space-x-2">
                          {['PENDING', 'FAILED', 'PROOFING'].includes(order.status) && (
                            <>
                                <GenerateTestPhotosButton
                                  orderId={order.id}
                                  orderName={`${order.school_name}_${order.batch_name}`}
                                />
                              <button
                                onClick={() => setUploadModalOrder(order)}
                                className="px-4 py-2 text-xs font-bold border border-gray-200 rounded-lg hover:bg-gray-100 transition-all"
                              >
                                Upload Photos
                              </button>
                            </>
                            

                          )}

                          {p.manual_review > 0 && (
                            <button
                                onClick={() => setReviewOrder(order)}
                                className="px-4 py-2 text-xs font-bold bg-red-500 text-white rounded-lg hover:bg-red-600 shadow-md transition-all"
                            >
                                Needs Review ({p.manual_review})
                            </button>
                          )}

                          <button
                            onClick={() => { setSelectedOrderId(order.id); setIsLayoutModalOpen(true); }}
                            className="px-4 py-2 text-xs font-bold border border-gray-200 rounded-lg hover:bg-gray-100 transition-all"
                          >
                            Layout
                          </button>

                          <button
                            disabled={order.status === 'PROCESSING'}
                            onClick={() => handleStartAI(order.id)}
                            className={`px-4 py-2 text-xs font-bold rounded-lg text-white shadow-md active:scale-95 transition-all ${
                              order.status === 'PROCESSING'
                                ? 'bg-gray-400'
                                : hasLayout
                                  ? 'bg-indigo-600 hover:bg-indigo-700'
                                  : 'bg-orange-500 hover:bg-orange-600'
                            }`}
                            title={!hasLayout ? 'No layout configured — click to set one up first' : ''}
                          >
                            {order.status === 'PROCESSING'
                              ? 'Running...'
                              : hasLayout
                                ? 'Run AI'
                                : '⚠ Run AI'}
                          </button>

                          {order.status === 'APPROVED' && (
                            <button
                              onClick={() => handleCompleteOrder(order.id)}
                              className="px-4 py-2 text-xs font-bold bg-amber-500 text-white rounded-lg hover:bg-amber-600 shadow-md transition-all"
                            >
                              Send to Print
                            </button>
                          )}
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
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </main>
      </div>

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
      {reviewOrder && (
        <ManualReviewQueueModal
          order={reviewOrder}
          onClose={() => setReviewOrder(null)}
          onSuccess={() => {}}
        />
      )}
    </div>
  );
};

export default OperatorDashboard;