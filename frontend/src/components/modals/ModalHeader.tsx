interface ModalHeaderProps {
  fileName: string;
  totalRows: number;
  validRows: number;
  errorRows: number;
  onClose: () => void;
}

const ModalHeader = ({
  fileName,
  totalRows,
  validRows,
  errorRows,
  onClose,
}: ModalHeaderProps) => (
  <div className="flex items-start justify-between px-6 py-4 border-b bg-gray-50 rounded-t-2xl">
    <div>
      <h2 className="font-black text-gray-900 text-lg">Review & Edit Student Data</h2>
      <p className="text-xs text-gray-500 mt-0.5">{fileName}</p>
      <div className="flex items-center gap-3 mt-2 text-xs">
        <span className="text-gray-500">
          Total: <strong className="text-gray-700">{totalRows}</strong>
        </span>
        <span className="text-green-600">
          Valid: <strong>{validRows}</strong>
        </span>
        {errorRows > 0 && (
          <span className="text-red-500">
            Errors: <strong>{errorRows}</strong>
          </span>
        )}
      </div>
    </div>
    <button
      onClick={onClose}
      className="text-gray-400 hover:text-gray-600 text-xl leading-none transition-colors"
    >
      ✕
    </button>
  </div>
);

export default ModalHeader;