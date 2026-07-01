import { useState } from 'react';
import toast from 'react-hot-toast';
import { useOrders } from '../context/OrderContext';
import ProofingModal from './proofing/ProofingModal';
import OrderStudentPanel from './OrderStudentPanel';
import api from '../utils/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface StatusConfig {
  classes: string;
  label: string;
  description: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, StatusConfig> = {
  PENDING: {
    classes: 'bg-gray-100 text-gray-600',
    label: 'Pending',
    description: 'Waiting for operator to begin processing',
  },
  PROCESSING: {
    classes: 'bg-blue-100 text-blue-700 animate-pulse',
    label: 'Processing',
    description: 'AI is generating ID cards',
  },
  PROOFING: {
    classes: 'bg-amber-100 text-amber-700',
    label: 'Proofing',
    description: 'Awaiting your review and approval',
  },
  APPROVED: {
    classes: 'bg-indigo-100 text-indigo-700',
    label: 'Approved',
    description: 'Approved — queued for printing',
  },
  PRINTING: {
    classes: 'bg-purple-100 text-purple-700',
    label: 'Printing',
    description: 'Currently being printed',
  },
  COMPLETED: {
    classes: 'bg-green-100 text-green-700',
    label: 'Completed',
    description: 'Ready for pickup',
  },
  CANCELLED: {
    classes: 'bg-red-100 text-red-600',
    label: 'Cancelled',
    description: 'This order was cancelled',
  },
  FAILED: {
    classes: 'bg-red-100 text-red-700',
    label: 'Failed',
    description: 'Processing failed — contact support',
  },
};

const FALLBACK_STATUS: StatusConfig = {
  classes: 'bg-gray-100 text-gray-600',
  label: 'Unknown',
  description: '',
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const StatusBadge = ({ status }: { status: string }) => {
  const [showTip, setShowTip] = useState(false);
  const config = STATUS_CONFIG[status] ?? FALLBACK_STATUS;

  return (
    <div className="relative">
      <span
        onMouseEnter={() => setShowTip(true)}
        onMouseLeave={() => setShowTip(false)}
        className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider cursor-default ${config.classes}`}
      >
        {config.label}
      </span>
      {showTip && config.description && (
        <div className="absolute right-0 top-7 z-10 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 w-48 shadow-lg pointer-events-none">
          {config.description}
          <div className="absolute -top-1 right-4 w-2 h-2 bg-gray-900 rotate-45" />
        </div>
      )}
    </div>
  );
};

const OrderActions = ({
  order,
  onDownloadQR,
  onDownloadIDs,
  isDownloadingQR,
  isDownloadingIDs,
  onReviewIDs,
}: {
  order: any;
  onDownloadQR: (id: number) => void;
  onDownloadIDs: (id: number) => void;
  isDownloadingQR: boolean;
  isDownloadingIDs: boolean;
  onReviewIDs: () => void;
}) => (
  <div className="flex items-center gap-2">
    {order.status === 'PROOFING' && (
      <button
        onClick={onReviewIDs}
        className="px-3 py-1.5 text-xs font-bold bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
      >
        Review IDs
      </button>
    )}

    {['APPROVED', 'PRINTING', 'COMPLETED'].includes(order.status) && (
      <button
        onClick={() => onDownloadIDs(order.id)}
        disabled={isDownloadingIDs}
        className="px-3 py-1.5 text-xs font-bold bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
      >
        {isDownloadingIDs ? 'Downloading...' : 'Download IDs'}
      </button>
    )}

    <button
      onClick={() => onDownloadQR(order.id)}
      disabled={isDownloadingQR}
      className="px-3 py-1.5 text-xs font-bold border border-indigo-200 text-indigo-600 rounded-lg hover:bg-indigo-50 disabled:opacity-50 transition-colors"
    >
      {isDownloadingQR ? 'Downloading...' : 'Download QR Codes'}
    </button>
  </div>
);

const EmptyState = () => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
    <div className="text-5xl mb-4">📋</div>
    <h3 className="font-bold text-gray-700 text-lg">No orders yet</h3>
    <p className="text-sm text-gray-400 mt-1">
      Upload a student file above to create your first order.
    </p>
  </div>
);

// ─── Main component ───────────────────────────────────────────────────────────

const OrderList = () => {
  const { orders, updateOrder } = useOrders();
  const [downloadingQRId, setDownloadingQRId] = useState<number | null>(null);
  const [downloadingIDsId, setDownloadingIDsId] = useState<number | null>(null);
  const [proofingOrderId, setProofingOrderId] = useState<number | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  const toggleExpand = (orderId: number) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      next.has(orderId) ? next.delete(orderId) : next.add(orderId);
      return next;
    });
  };

  const handleDownloadQR = async (orderId: number) => {
    setDownloadingQRId(orderId);
    try {
      const res = await api.get(`/orders/${orderId}/qr-codes/download/`, {
        responseType: 'blob',
      });
      const url  = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href  = url;
      link.setAttribute('download', `qr_codes_order_${orderId}.zip`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('QR codes downloaded');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to download QR codes');
    } finally {
      setDownloadingQRId(null);
    }
  };

  const handleDownloadIDs = async (orderId: number) => {
    setDownloadingIDsId(orderId);
    try {
      const res = await api.get(`/orders/${orderId}/id-cards/download/`, {
        responseType: 'blob',
      });
      const url  = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href  = url;
      link.setAttribute('download', `id_cards_order_${orderId}.zip`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('ID cards downloaded');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'No ID cards available for this order');
    } finally {
      setDownloadingIDsId(null);
    }
  };

  if (orders.length === 0) return <EmptyState />;

  return (
    <div className="space-y-3">
      {orders.map((order) => (
        <div
          key={order.id}
          className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden"
        >
          {/* Card row */}
          <div className="px-5 py-4 flex items-center justify-between gap-4">
            <button
              onClick={() => toggleExpand(order.id)}
              className="text-gray-400 hover:text-gray-600 shrink-0 transition-transform duration-200"
              style={{ transform: expandedIds.has(order.id) ? 'rotate(180deg)' : 'rotate(0deg)' }}
            >
              ▾
            </button>

            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-gray-900 truncate">{order.school_name}</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                {order.batch_name}
                <span className="mx-1.5 text-gray-300">•</span>
                {order.student_count} students
                {order.deadline && (
                  <>
                    <span className="mx-1.5 text-gray-300">•</span>
                    Due {new Date(order.deadline).toLocaleDateString()}
                  </>
                )}
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <OrderActions
                order={order}
                onDownloadQR={handleDownloadQR}
                onDownloadIDs={handleDownloadIDs}
                isDownloadingQR={downloadingQRId === order.id}
                isDownloadingIDs={downloadingIDsId === order.id}
                onReviewIDs={() => setProofingOrderId(order.id)}
              />
              <StatusBadge status={order.status} />
            </div>
          </div>

          <OrderStudentPanel
            orderId={order.id}
            isOpen={expandedIds.has(order.id)}
          />
        </div>
      ))}

      {proofingOrderId && (
        <ProofingModal
          orderId={proofingOrderId}
          order={orders.find(o => o.id === proofingOrderId)!}
          onClose={() => setProofingOrderId(null)}
          onApproved={(orderId) => {
            updateOrder({ id: orderId, status: 'APPROVED' });
            setProofingOrderId(null);
          }}
        />
      )}
    </div>
  );
};

export default OrderList;