// frontend/src/components/modals/ManualEntryModal.tsx

import React, { useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useDataValidation } from '../../hooks/useDataValidation';
import EditableDataTable from '../table/EditableDataTable';
import type { StudentRow } from '../../hooks/useDataValidation';

interface ManualEntryModalProps {
  isOpen:     boolean;
  onClose:    () => void;
  onReview:   (rows: StudentRow[]) => void;
  isDisabled: boolean;
}

const EMPTY_ROW = (): StudentRow => ({
  name:       '',
  student_id: '',
  grade:      '',
  section:    '',
  rowNumber:  1,
  errors:     [],
  isSelected: true,
});

const ManualEntryModal = ({
  isOpen,
  onClose,
  onReview,
  isDisabled,
}: ManualEntryModalProps) => {
  const { validateAll, hasErrors } = useDataValidation();

  const [rows,    setRows]    = useState<StudentRow[]>([EMPTY_ROW()]);
  const [touched, setTouched] = useState(false);

  const handleChange = useCallback((updated: StudentRow[]) => {
    setRows(updated);
    setTouched(true);
  }, []);

  const handleReview = () => {
    const revalidated = validateAll(rows);
    setRows(revalidated);

    const hasData = rows.some(r => r.name.trim() || r.student_id.trim());
    if (!hasData) return;
    if (revalidated.some(r => r.errors.length > 0)) return;

    onReview(revalidated);
  };

  const handleClose = () => {
    // Reset state on close so next open starts fresh
    setRows([EMPTY_ROW()]);
    setTouched(false);
    onClose();
  };

  const filledCount = rows.filter(r => r.name.trim() && r.student_id.trim()).length;
  const errorCount  = touched ? rows.filter(r => r.errors.length > 0).length : 0;
  const isBlocked   = (touched && hasErrors(rows)) || filledCount === 0;

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-gray-50 rounded-t-2xl">
          <div>
            <h2 className="font-black text-gray-900 text-lg">Manual Student Entry</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Type student details directly — click any cell to edit
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Warning at 100+ rows */}
        {rows.length >= 100 && (
          <div className="mx-6 mt-4 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 text-xs text-amber-700">
            ⚠️ You have {rows.length} rows. For large batches, consider using file upload instead.
          </div>
        )}

        {/* Table */}
        <div className="flex-1 overflow-hidden p-6">
          <EditableDataTable
            key="manual-entry"
            initialRows={rows}
            onChange={handleChange}
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50 rounded-b-2xl">
          <p className="text-xs text-gray-400">
            {filledCount > 0
              ? `${filledCount} student${filledCount > 1 ? 's' : ''} entered${errorCount > 0 ? ` · ${errorCount} error${errorCount > 1 ? 's' : ''}` : ''}`
              : 'Fill in at least one student to continue'
            }
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-sm font-bold text-gray-600 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleReview}
              disabled={isDisabled || isBlocked}
              className={`px-6 py-2 text-sm font-bold text-white rounded-lg transition-colors ${
                isDisabled || isBlocked
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-indigo-500 hover:bg-indigo-600'
              }`}
            >
              Review & Submit →
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ManualEntryModal;