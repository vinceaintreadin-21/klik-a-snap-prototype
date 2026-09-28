// frontend/src/components/modals/DataCorrectionModal.tsx

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';
import { useOrders } from '../../context/OrderContext';
import { useDataValidation } from '../../hooks/useDataValidation';
import { parseOrderFileWithSheet }  from '../../utils/excelParser';
import type { StudentRow, DuplicateOrderInfo } from '../../hooks/useDataValidation';
import EditableDataTable from '../table/EditableDataTable';
import SheetSelector from './SheetSelector';
import DuplicateOrderDialog from './DuplicateOrderDialog';
import ModalHeader from './ModalHeader';
import ModalFooter from './ModalFooter';

// ─── Types ────────────────────────────────────────────────────────────────────

type ModalState = 'SHEET_SELECT' | 'REVIEWING' | 'DUPLICATE_FOUND' | 'SUBMITTING';

interface DataCorrectionModalProps {
  isOpen:     boolean;
  onClose:    () => void;
  initialRows:StudentRow[];
  sheets:     string[];
  fileName:   string;
  file:       File | null;
  schoolName: string;
  batchName:  string;
  uploadKey:  number;
}

// ─── Component ────────────────────────────────────────────────────────────────

const DataCorrectionModal = ({
  isOpen,
  onClose,
  initialRows,
  sheets,
  fileName,
  file,
  schoolName,
  batchName,
  uploadKey,
}: DataCorrectionModalProps) => {
  const { addOrder, updateOrder } = useOrders();
  const {
    validateAll,
    hasErrors,
    submitRows,
    overrideOrder,
    isSubmitting,
    isCheckingDuplicate,
  } = useDataValidation();

  const [modalState, setModalState] = useState<ModalState>('REVIEWING');
  const [tableRows, setTableRows] = useState<StudentRow[]>([]);
  const [sheetRows, setSheetRows] = useState<StudentRow[] | null>(null);
  const [duplicateInfo, setDuplicateInfo] = useState<DuplicateOrderInfo | null>(null);
  const [isReparsing, setIsReparsing] = useState(false);

  const activeRows = sheetRows ?? tableRows;

  useEffect(() => {
    if (!isOpen) return;
    setTableRows(initialRows);
    setSheetRows(null);
    setModalState(sheets.length > 1 ? 'SHEET_SELECT' : 'REVIEWING');
    setDuplicateInfo(null);
  }, [uploadKey, isOpen]);

  // ── Sheet selection ────────────────────────────────────────────────────────

  const handleSheetSelect = useCallback(async (sheetName: string) => {
    if (!file) return;
    setIsReparsing(true);
    try {
      const res       = await parseOrderFileWithSheet(file, sheetName);
      const validated = validateAll(res.rows);
      setSheetRows(validated);
      setTableRows(validated);
      setModalState('REVIEWING');
    } catch (err: any) {
      toast.error(err.message || 'Failed to parse sheet');
    } finally {
      setIsReparsing(false);
    }
  }, [file, validateAll]);

  // ── Row changes ────────────────────────────────────────────────────────────

  const handleRowsChange = useCallback((updated: StudentRow[]) => {
    setTableRows(updated);
    setSheetRows(null);
  }, []);

  // ── Submit ─────────────────────────────────────────────────────────────────

  const handleSubmit = useCallback(async () => {
    if (hasErrors(activeRows)) return;
    try {
      await submitRows(activeRows, {
        schoolName,
        batchName,
        onSuccess: (order) => {
          addOrder(order);
          toast.success(`${activeRows.length} students registered successfully`);
          onClose();
        },
        onDuplicateFound: (info) => {
          setDuplicateInfo(info);
          setModalState('DUPLICATE_FOUND');
        },
        onDuplicateBlocked: (info) => {
          toast.error(
            `This order already exists with ${info.existing_count} students. ` +
            `Upload a file with more rows to override.`
          );
        },
      });
    } catch (err: any) {
      toast.error(err.message || 'Submission failed');
    }
  }, [activeRows, schoolName, batchName, hasErrors, submitRows, addOrder, onClose]);

  // ── Override confirmed ─────────────────────────────────────────────────────

  const handleOverrideConfirm = useCallback(async () => {
    if (!duplicateInfo) return;
    try {
      await overrideOrder(
        duplicateInfo.existing_order_id,
        activeRows,
        schoolName,
        batchName,
        (order) => {
          updateOrder(order);
          toast.success(`Order updated with ${activeRows.length} students`);
          onClose();
        }
      );
    } catch (err: any) {
      toast.error(err.message || 'Override failed');
      setModalState('REVIEWING');
    }
  }, [duplicateInfo, activeRows, schoolName, batchName, overrideOrder, updateOrder, onClose]);

  // ── Derived ────────────────────────────────────────────────────────────────

  const errorCount = activeRows.filter((r) => r.errors.length > 0).length;
  const validCount = activeRows.length - errorCount;

  // ── Render ─────────────────────────────────────────────────────────────────

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col relative">

        {/* Duplicate dialog overlay */}
        {modalState === 'DUPLICATE_FOUND' && duplicateInfo && (
          <DuplicateOrderDialog
            info={duplicateInfo}
            schoolName={schoolName}
            batchName={batchName}
            newCount={activeRows.length}
            onConfirm={handleOverrideConfirm}
            onCancel={() => setModalState('REVIEWING')}
            isLoading={isSubmitting}
          />
        )}

        {/* Header */}
        <ModalHeader
          fileName={fileName}
          totalRows={activeRows.length}
          validRows={validCount}
          errorRows={errorCount}
          onClose={onClose}
        />

        {/* Body */}
        <div className="flex-1 overflow-auto p-6 min-h-0">
          {modalState === 'SHEET_SELECT' ? (
            <SheetSelector
              sheets={sheets}
              fileName={fileName}
              onSelect={handleSheetSelect}
              isLoading={isReparsing}
            />
          ) : (
            <EditableDataTable
              key={uploadKey}
              initialRows={activeRows}
              onChange={handleRowsChange}
            />
          )}
        </div>

        {/* Footer */}
        {modalState !== 'SHEET_SELECT' && (
          <ModalFooter
            totalRows={activeRows.length}
            errorRows={errorCount}
            isSubmitting={isSubmitting}
            isCheckingDuplicate={isCheckingDuplicate}
            onCancel={onClose}
            onSubmit={handleSubmit}
          />
        )}
      </div>
    </div>,
    document.body
  );
};

export default DataCorrectionModal;