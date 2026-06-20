// frontend/src/components/modals/ModalFooter.tsx

import React from 'react';

interface ModalFooterProps {
  totalRows: number;
  errorRows: number;
  isSubmitting: boolean;
  isCheckingDuplicate: boolean;
  onCancel: () => void;
  onSubmit: () => void;
}

const ModalFooter = ({
  totalRows,
  errorRows,
  isSubmitting,
  isCheckingDuplicate,
  onCancel,
  onSubmit,
}: ModalFooterProps) => {
  const isBlocked  = errorRows > 0;
  const isLoading  = isSubmitting || isCheckingDuplicate;
  const submitLabel = isCheckingDuplicate
    ? 'Checking...'
    : isSubmitting
    ? 'Submitting...'
    : `Submit ${totalRows} Students ✓`;

  return (
    <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50 rounded-b-2xl">
      {/* Left side hint */}
      <div className="text-xs text-gray-400">
        {isBlocked
          ? `Fix ${errorRows} error${errorRows > 1 ? 's' : ''} before submitting`
          : 'All rows are valid — ready to submit'}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={onCancel}
          disabled={isLoading}
          className="px-4 py-2 text-sm font-bold text-gray-600 border rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={onSubmit}
          disabled={isBlocked || isLoading}
          className={`px-6 py-2 text-sm font-bold text-white rounded-lg transition-colors ${
            isBlocked || isLoading
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-indigo-500 hover:bg-indigo-600'
          }`}
        >
          {submitLabel}
        </button>
      </div>
    </div>
  );
};

export default ModalFooter;