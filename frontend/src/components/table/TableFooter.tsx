// frontend/src/components/table/TableFooter.tsx

import React from 'react';

interface TableFooterProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  pageSizeOptions: number[];
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onAddRow: () => void;
}

const TableFooter = ({
  currentPage,
  totalPages,
  pageSize,
  pageSizeOptions,
  onPageChange,
  onPageSizeChange,
  onAddRow,
}: TableFooterProps) => (
  <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
    <button
      onClick={onAddRow}
      className="text-xs px-3 py-1.5 bg-indigo-50 text-indigo-600 border border-indigo-200 rounded hover:bg-indigo-100 transition-colors font-medium"
    >
      + Add Row
    </button>

    <div className="flex items-center gap-3">
      {/* Page size dropdown */}
      <div className="flex items-center gap-1">
        <span>Rows per page:</span>
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="border rounded px-1 py-0.5 text-xs focus:outline-none"
        >
          {pageSizeOptions.map((size) => (
            <option key={size} value={size}>{size}</option>
          ))}
        </select>
      </div>

      {/* Page controls */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="px-1.5 py-0.5 border rounded disabled:opacity-40 hover:bg-gray-100"
        >«</button>
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-1.5 py-0.5 border rounded disabled:opacity-40 hover:bg-gray-100"
        >‹</button>
        <span className="px-2">Page {currentPage} of {totalPages}</span>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-1.5 py-0.5 border rounded disabled:opacity-40 hover:bg-gray-100"
        >›</button>
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="px-1.5 py-0.5 border rounded disabled:opacity-40 hover:bg-gray-100"
        >»</button>
      </div>
    </div>
  </div>
);

export default TableFooter;