import React from 'react';
import { useOrders } from '../context/OrderContext';
import api from '../utils/api';

const OrderList = () => {
  const { orders } = useOrders();

  const getStatusStyle = (status: string) => {
    switch(status) {
      case 'COMPLETED': return 'bg-green-100 text-green-700';
      case 'PROCESSING': return 'bg-blue-100 text-blue-700 animate-pulse';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const handleDownloadQRCodes = async (orderId: number) => {
    try {
      const res = await api.get(`/orders/${orderId}/qr-codes/download/`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `qr_codes_order_${orderId}.zip`)
      document.body.appendChild(link);
      link.click();
      link.remove();

      alert(`QR codes downloaded successfully`);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to download QR codes');
    }
  }

  return (
    <div className="space-y-4">
      {orders.map(order => (
        <div key={order.id} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex justify-between items-center">
          <div>
            <h3 className="font-bold text-gray-900">{order.school_name}</h3>
            <p className="text-xs text-gray-500">{order.batch_name} • {order.student_count} Students</p>
          </div>

          <div className='flex gap-2'>
            <button
              onClick={() => handleDownloadQRCodes(order.id)}
              className="px-3 py-1.5 text-xs font-bold border border-indigo-200 text-indigo-600 rounded-lg hover:bg-indigo-50 transition-all"
            >
              Download QR Codes
            </button>
          </div>

          <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${getStatusStyle(order.status)}`}>
            {order.status}
          </span>
        </div>
      ))}
    </div>
  );
};

export default OrderList;