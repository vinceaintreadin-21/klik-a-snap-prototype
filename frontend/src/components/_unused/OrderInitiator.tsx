import React, { useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { useDataValidation } from '../hooks/useDataValidation';
import { parseOrderFile, isValidFileType } from '../utils/excelParser';
import DataCorrectionModal from './modals/DataCorrectionModal';
import ManualEntryModal from './modals/ManualEntryModal';
import UploadTab from './UploadTab';
import type { StudentRow } from '../hooks/useDataValidation';

const OrderInitiator = () => {
  // ── Shared fields ──────────────────────────────────────────────────────────
  const [schoolName, setSchoolName] = useState('');
  const [batchName, setBatchName] = useState('');
  const [validationError, setValidationError] = useState('');

  // ── Upload state ───────────────────────────────────────────────────────────
  const [isDragging, setIsDragging] = useState(false);
  const [isParsing,  setIsParsing]  = useState(false);

  // ── Manual entry modal ─────────────────────────────────────────────────────
  const [manualOpen, setManualOpen] = useState(false);

  // ── Correction modal state ─────────────────────────────────────────────────
  const [modalOpen, setModalOpen]  = useState(false);
  const [parsedRows, setParsedRows] = useState<StudentRow[]>([]);
  const [sheets, setSheets]     = useState<string[]>([]);
  const [fileName, setFileName]   = useState('');
  const [uploadKey, setUploadKey]  = useState(0);
  const [activeFile, setActiveFile] = useState<File | null>(null);

  const { validateAll } = useDataValidation();

  // ── Field validation ───────────────────────────────────────────────────────

  const validateFields = (): boolean => {
    if (!schoolName.trim() || !batchName.trim()) {
      setValidationError('Please fill in School Name and Batch Name first.');
      return false;
    }
    setValidationError('');
    return true;
  };

  // ── Upload handlers ────────────────────────────────────────────────────────

  const processFile = useCallback(async (file: File) => {
    if (!validateFields()) return;
    if (!isValidFileType(file)) {
      toast.error('Please upload a CSV or Excel file (.csv, .xlsx, .xls)');
      return;
    }

    setIsParsing(true);
    setActiveFile(file);
    setFileName(file.name);

    try {
      const res = await parseOrderFile(file);

      if (res.sheets.length > 1) {
        setSheets(res.sheets);
        setParsedRows([]);
        setUploadKey(k => k + 1);
        setModalOpen(true);
        return;
      }

      if (res.rows.length === 0) {
        toast.error("No rows found. Check that columns 'name' and 'student_id' exist.");
        return;
      }

      const validated = validateAll(res.rows);
      setParsedRows(validated);
      setSheets([]);
      setUploadKey(k => k + 1);
      setModalOpen(true);

    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to parse file');
    } finally {
      setIsParsing(false);
    }
  }, [schoolName, batchName, validateAll]);

  const handleDragOver  = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true);  };
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); };
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); e.stopPropagation(); setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = '';
  };

  // ── Manual entry handlers ──────────────────────────────────────────────────

  const handleManualEntryClick = () => {
    if (!validateFields()) return;
    setManualOpen(true);
  };

  const handleManualReview = useCallback((rows: StudentRow[]) => {
    setManualOpen(false);
    setParsedRows(rows);
    setSheets([]);
    setFileName('Manual Entry');
    setActiveFile(null);
    setUploadKey(k => k + 1);
    setModalOpen(true);
  }, []);

  // ── Correction modal close ─────────────────────────────────────────────────

  const handleModalClose = () => {
    setModalOpen(false);
    setParsedRows([]);
    setSheets([]);
    setActiveFile(null);
    setFileName('');
  };

  // ── Derived ────────────────────────────────────────────────────────────────

  const isDisabled = !schoolName.trim() || !batchName.trim() || isParsing;

  return (
    <>
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <div className="space-y-4">

          {/* School Name */}
          <input
            type="text"
            value={schoolName}
            onChange={(e) => { setSchoolName(e.target.value); setValidationError(''); }}
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            placeholder="School Name (e.g. STI College)"
          />

          {/* Batch Name */}
          <input
            type="text"
            value={batchName}
            onChange={(e) => { setBatchName(e.target.value); setValidationError(''); }}
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            placeholder="Batch Name (e.g. Grade 10 - 2026)"
          />

          {/* Upload dropzone */}
          <UploadTab
            isDragging={isDragging}
            isParsing={isParsing}
            isDisabled={isDisabled}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onFileSelect={handleFileSelect}
          />

          {/* Manual entry link */}
          <div className="text-center">
            <button
              onClick={handleManualEntryClick}
              disabled={isDisabled}
              className="text-xs text-indigo-500 hover:text-indigo-700 disabled:text-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Or enter students manually →
            </button>
          </div>

          {/* Validation error */}
          {validationError && (
            <p className="text-red-500 text-sm">{validationError}</p>
          )}

        </div>
      </div>

      {/* Manual entry modal */}
      <ManualEntryModal
        isOpen={manualOpen}
        onClose={() => setManualOpen(false)}
        onReview={handleManualReview}
        isDisabled={false}
      />

      {/* Correction modal — shared by upload and manual entry */}
      <DataCorrectionModal
        key={uploadKey}
        uploadKey={uploadKey}
        isOpen={modalOpen}
        onClose={handleModalClose}
        initialRows={parsedRows}
        sheets={sheets}
        fileName={fileName}
        file={activeFile}
        schoolName={schoolName}
        batchName={batchName}
      />
    </>
  );
};

export default OrderInitiator;