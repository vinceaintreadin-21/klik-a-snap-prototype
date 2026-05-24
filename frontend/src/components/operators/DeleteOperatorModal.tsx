import React from 'react';
import type { Operator } from '../../hooks/useOperators';

interface DeleteOperatorModalProps {
  isOpen: boolean;
  operator: Operator | null;
  onClose: () => void;
  onConfirm: (id: number) => void;
  loading: boolean;
  error: string | null;
}

const DeleteOperatorModal: React.FC<DeleteOperatorModalProps> = ({
  isOpen,
  operator,
  onClose,
  onConfirm,
  loading,
  error,
}) => {
  if (!isOpen || !operator) return null;

  const handleConfirm = () => {
    onConfirm(operator.id);
  };

  // Check if error suggests deactivation instead
  const suggestDeactivation = error && error.includes('assigned order');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">Delete Operator</h2>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 font-bold text-sm mb-2">⚠️ Permanent Deletion</p>
            <p className="text-sm text-red-700">
              You are about to permanently delete <span className="font-bold">{operator.user__username}</span> ({operator.user__email}).
            </p>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p className="text-sm text-gray-700 mb-2">
              <span className="font-bold">This action cannot be undone.</span>
            </p>
            <p className="text-sm text-gray-600">
              All operator data will be permanently removed from the system. Consider deactivating instead to preserve historical data.
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              <p className="font-bold mb-1">Cannot delete operator</p>
              <p>{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-bold text-gray-700 hover:bg-gray-50 transition-all"
              disabled={loading}
            >
              Cancel
            </button>
            {suggestDeactivation ? (
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg font-bold hover:bg-amber-700 transition-all"
              >
                Use Deactivate Instead
              </button>
            ) : (
              <button
                onClick={handleConfirm}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition-all disabled:bg-gray-400 disabled:cursor-not-allowed"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                    Deleting...
                  </span>
                ) : (
                  'Delete Permanently'
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteOperatorModal;
