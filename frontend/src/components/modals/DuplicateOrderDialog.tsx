import type { DuplicateOrderInfo } from '../../hooks/useDataValidation';

interface DuplicateOrderDialogProps {
  info: DuplicateOrderInfo;
  schoolName: string;
  batchName: string;
  newCount: number;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading: boolean;
}

const DuplicateOrderDialog = ({
  info,
  schoolName,
  batchName,
  newCount,
  onConfirm,
  onCancel,
  isLoading,
}: DuplicateOrderDialogProps) => {
  const diff = newCount - info.existing_count;

  return (
    <div className="absolute inset-0 bg-black/60 z-50 flex items-center justify-center rounded-2xl">
      <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4 space-y-4">
        {/* Header */}
        <div className="flex items-start gap-3">
          <span className="text-2xl">⚠️</span>
          <div>
            <h3 className="font-black text-gray-900 text-lg">Order Already Exists</h3>
            <p className="text-sm text-gray-500 mt-0.5">
              {schoolName} — {batchName}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Existing students</span>
            <span className="font-bold text-gray-700">{info.existing_count}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">New file students</span>
            <span className="font-bold text-gray-700">{newCount}</span>
          </div>
          <div className="border-t pt-2 flex justify-between">
            <span className="text-gray-500">Difference</span>
            <span className="font-bold text-green-600">+{diff} new rows</span>
          </div>
        </div>

        {/* Warning */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
          This will replace all existing students in this order and reset
          it back to <strong>PENDING</strong> status. Any previous processing,
          proofing, or approvals will be cleared.
        </div>

        {/* Actions */}
        <div className="flex gap-2 justify-end pt-1">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-bold text-gray-600 border rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-bold text-white bg-amber-500 rounded-lg hover:bg-amber-600 disabled:opacity-50 transition-colors"
          >
            {isLoading ? 'Overriding...' : 'Yes, Override'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DuplicateOrderDialog;