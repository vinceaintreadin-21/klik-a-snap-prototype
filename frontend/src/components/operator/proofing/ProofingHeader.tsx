interface ProofingHeaderProps {
    schoolName: string;
    batchName: string;
    totalCount: number;
    approvedCount: number;
    revisionCount: number;
    isSubmitting: boolean;
    onApproveAll: () => void;
    onClose: () => void;
}

const ProofingHeader = ({
  schoolName,
  batchName,
  totalCount,
  approvedCount,
  revisionCount,
  isSubmitting,
  onApproveAll,
  onClose,
}: ProofingHeaderProps) => {
  const readyCount = totalCount - revisionCount;

  return (
    <div className="flex items-start justify-between px-6 py-4 border-b bg-gray-50 rounded-t-2xl shrink-0">
      <div>
        <h2 className="font-black text-gray-900 text-lg">Review ID Cards</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          {schoolName} — {batchName}
        </p>
        <div className="flex items-center gap-3 mt-2 text-xs">
          <span className="text-gray-500">
            Total: <strong className="text-gray-700">{totalCount}</strong>
          </span>
          <span className="text-green-600">
            Approved: <strong>{approvedCount}</strong>
          </span>
          {revisionCount > 0 && (
            <span className="text-amber-600">
              Revision: <strong>{revisionCount}</strong>
            </span>
          )}
          {readyCount > 0 && approvedCount < readyCount && (
            <span className="text-indigo-500">
              Ready: <strong>{readyCount}</strong>
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onApproveAll}
          disabled={isSubmitting || readyCount === 0}
          className="px-5 py-2 bg-green-500 text-white text-sm font-bold rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? 'Approving...' : `Approve All ${readyCount > 0 ? `(${readyCount})` : ''} ✓`}
        </button>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 text-xl leading-none ml-2 transition-colors"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

export default ProofingHeader;