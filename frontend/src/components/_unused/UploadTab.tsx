import React from 'react';

interface UploadTabProps {
  isDragging:  boolean;
  isParsing:   boolean;
  isDisabled:  boolean;
  onDragOver:  (e: React.DragEvent<HTMLDivElement>) => void;
  onDragLeave: (e: React.DragEvent<HTMLDivElement>) => void;
  onDrop:      (e: React.DragEvent<HTMLDivElement>) => void;
  onFileSelect:(e: React.ChangeEvent<HTMLInputElement>) => void;
}

const UploadTab = ({
  isDragging,
  isParsing,
  isDisabled,
  onDragOver,
  onDragLeave,
  onDrop,
  onFileSelect,
}: UploadTabProps) => (
  <div
    onDragOver={onDragOver}
    onDragLeave={onDragLeave}
    onDrop={onDrop}
    className={`
      relative border-2 border-dashed rounded-xl p-10 text-center transition-all
      ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      ${isDragging
        ? 'border-indigo-500 bg-indigo-50 scale-[1.02]'
        : 'border-gray-200 hover:border-indigo-400 hover:bg-gray-50'
      }
    `}
  >
    <input
      type="file"
      accept=".csv,.xlsx,.xls"
      onChange={onFileSelect}
      onClick={(e) => e.stopPropagation()}
      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
      disabled={isDisabled}
    />
    <div className="pointer-events-none">
      <div className="mb-4">
        {isParsing ? (
          <div className="w-12 h-12 mx-auto border-4 border-indigo-200 border-t-indigo-500 rounded-full animate-spin" />
        ) : (
          <svg
            className={`w-12 h-12 mx-auto ${isDragging ? 'text-indigo-500' : 'text-gray-400'}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
        )}
      </div>
      <p className={`font-medium ${isDragging ? 'text-indigo-600' : 'text-gray-500'}`}>
        {isParsing
          ? 'Parsing file...'
          : isDragging
          ? 'Drop your file here'
          : 'Drag & Drop or Click to Browse'
        }
      </p>
      <p className="text-xs text-gray-400 mt-2">
        Supports CSV, Excel (.xlsx, .xls) — columns: name, student_id, grade
      </p>
    </div>
  </div>
);

export default UploadTab;