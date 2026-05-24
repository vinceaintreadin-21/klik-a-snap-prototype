import React from 'react';
import type { Operator } from '../../hooks/useOperators';

interface ActivateOperatorModalProps {
  isOpen: boolean;
  operator: Operator | null;
  onClose: () => void;
  onConfirm: (id: number) => void;
  loading: boolean;
}

const ActivateOperatorModal: React.FC<ActivateOperatorModalProps> = ({
  isOpen,
  operator,
  onClose,
  onConfirm,
  loading,
}) => {
  if (!isOpen || !operator) return null;

  const handleConfirm = () => {
    onConfirm(operator.id);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">Activate Operator</h2>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-800 font-bold text-sm mb-2">✓ Confirm Activation</p>
            <p className="text-sm text-green-700">
              You are about to reactivate <span className="font-bold">{operator.user__username}</span> ({operator.user__email}).
            </p>
          </div>

          {operator.deactivated_at && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm">
              <p className="text-gray-600 mb-1">
                <span className="font-bold">Deactivated:</span> {formatDate(operator.deactivated_at)}
              </p>
              {operator.deactivated_by__username && (
                <p className="text-gray-600">
                  <span className="font-bold">Deactivated by:</span> {operator.deactivated_by__username}
                </p>
              )}
            </div>
          )}

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p className="text-sm text-gray-700">
              This will allow <span className="font-bold">{operator.user__username}</span> to log in again and resume work.
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-bold text-gray-700 hover:bg-gray-50 transition-all"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition-all disabled:bg-gray-400 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                  Activating...
                </span>
              ) : (
                'Activate'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivateOperatorModal;
