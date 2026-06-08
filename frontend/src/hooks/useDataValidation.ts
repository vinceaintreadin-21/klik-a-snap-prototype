// frontend/src/hooks/useDataValidation.ts

import { useState, useCallback } from 'react';
import api from '../utils/api';
import type { ParsedStudent } from '../utils/excelParcer'

// ─── Types ────────────────────────────────────────────────────────────────────

export type ValidationErrorType = 'missing' | 'duplicate';

export interface ValidationError {
  field: 'name' | 'student_id';
  type: ValidationErrorType;
  message: string;
}

export interface StudentRow extends ParsedStudent {
  rowNumber: number;
  errors: ValidationError[];
  isSelected: boolean;
}

export interface DuplicateOrderInfo {
  existing_order_id: number;
  existing_count: number;
  can_override: boolean;
}

export interface SubmitOptions {
  schoolName: string;
  batchName: string;
  onSuccess: (order: any) => void;
  onDuplicateFound: (info: DuplicateOrderInfo) => void;
  onDuplicateBlocked: (info: DuplicateOrderInfo) => void;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useDataValidation = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingDuplicate, setIsCheckingDuplicate] = useState(false);

  // ── Row-level validation ───────────────────────────────────────────────────

  /**
   * Validates a single row against all other rows (for duplicate detection).
   * Called on every edit so the table stays live-validated.
   */
  const validateRow = useCallback(
    (row: StudentRow, allRows: StudentRow[]): ValidationError[] => {
      const errors: ValidationError[] = [];

      // Required: name
      if (!row.name?.trim()) {
        errors.push({
          field: 'name',
          type: 'missing',
          message: 'Name is required',
        });
      }

      // Required: student_id
      if (!row.student_id?.trim()) {
        errors.push({
          field: 'student_id',
          type: 'missing',
          message: 'Student ID is required',
        });
      } else {
        // Duplicate check within the file
        const duplicates = allRows.filter(
          (r) =>
            r.rowNumber !== row.rowNumber &&
            r.student_id.trim().toLowerCase() ===
              row.student_id.trim().toLowerCase()
        );
        if (duplicates.length > 0) {
          errors.push({
            field: 'student_id',
            type: 'duplicate',
            message: `Duplicate of row ${duplicates[0].rowNumber}`,
          });
        }
      }

      return errors;
    },
    []
  );

  /**
   * Validates all rows and returns them with errors attached.
   * Used when the file is first parsed and the correction modal opens.
   */
  const validateAll = useCallback(
    (parsed: ParsedStudent[]): StudentRow[] => {
      // First pass — build StudentRow array without errors
      const rows: StudentRow[] = parsed.map((p, i) => ({
        ...p,
        rowNumber: i + 1,
        errors: [],
        isSelected: true,
      }));

      // Second pass — validate each row against the full set
      return rows.map((row) => ({
        ...row,
        errors: validateRow(row, rows),
      }));
    },
    [validateRow]
  );

  /**
   * Re-validates all rows after an inline edit.
   * Returns a new array — never mutates.
   */
  const revalidateAll = useCallback(
    (rows: StudentRow[]): StudentRow[] => {
      return rows.map((row) => ({
        ...row,
        errors: validateRow(row, rows),
      }));
    },
    [validateRow]
  );

  /**
   * Returns true if any row still has errors.
   * Used to gate the Submit button.
   */
  const hasErrors = useCallback((rows: StudentRow[]): boolean => {
    return rows.some((r) => r.errors.length > 0);
  }, []);

  // ── Order-level duplicate check + submit ──────────────────────────────────

  /**
   * Called when the user clicks Submit in the correction modal.
   * 1. Checks for duplicate order on the backend
   * 2. If duplicate + can override → calls onDuplicateFound (show confirm dialog)
   * 3. If duplicate + cannot override → calls onDuplicateBlocked (show error)
   * 4. If no duplicate → creates new order
   */
  const submitRows = useCallback(
    async (rows: StudentRow[], options: SubmitOptions) => {
      const { schoolName, batchName, onSuccess, onDuplicateFound, onDuplicateBlocked } = options;

      const students = rows.map((r) => ({
        name: r.name.trim(),
        student_id: r.student_id.trim(),
        grade: r.grade.trim(),
        section: r.section?.trim() ?? '',
      }));

      // ── Step 1: Check for duplicate order ─────────────────────────────────
      setIsCheckingDuplicate(true);
      try {
        const checkRes = await api.post('/orders/check-duplicate/', {
          school_name: schoolName,
          batch_name: batchName,
          student_count: students.length,
        });

        const { is_duplicate, existing_order_id, existing_count, can_override } = checkRes.data;

        if (is_duplicate && !can_override) {
          onDuplicateBlocked({ existing_order_id, existing_count, can_override });
          return;
        }

        if (is_duplicate && can_override) {
          // Pause here — let the UI show a confirmation dialog
          // The caller handles the confirm, then calls overrideOrder()
          onDuplicateFound({ existing_order_id, existing_count, can_override });
          return;
        }

      } catch (err: any) {
        throw new Error(err.response?.data?.error || 'Duplicate check failed');
      } finally {
        setIsCheckingDuplicate(false);
      }

      // ── Step 2: No duplicate — create new order ───────────────────────────
      await createOrder(schoolName, batchName, students, onSuccess);
    },
    []
  );

  /**
   * Called after the user confirms the override dialog.
   * Updates the existing order in place.
   */
  const overrideOrder = useCallback(
    async (
      orderId: number,
      rows: StudentRow[],
      schoolName: string,
      batchName: string,
      onSuccess: (order: any) => void
    ) => {
      const students = rows.map((r) => ({
        name: r.name.trim(),
        student_id: r.student_id.trim(),
        grade: r.grade.trim(),
        section: r.section?.trim() ?? '',
      }));

      setIsSubmitting(true);
      try {
        const res = await api.patch(`/orders/${orderId}/`, {
          school_name: schoolName,
          batch_name: batchName,
          students,
        });
        onSuccess(res.data);
      } catch (err: any) {
        throw new Error(err.response?.data?.error || 'Override failed');
      } finally {
        setIsSubmitting(false);
      }
    },
    []
  );

  // ── Internal: create new order ────────────────────────────────────────────

  const createOrder = async (
    schoolName: string,
    batchName: string,
    students: any[],
    onSuccess: (order: any) => void
  ) => {
    setIsSubmitting(true);
    try {
      const res = await api.post('/orders/', {
        school_name: schoolName,
        batch_name: batchName,
        students,
      });
      onSuccess(res.data);
    } catch (err: any) {
      throw new Error(err.response?.data?.error || 'Order creation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    // Validation
    validateAll,
    revalidateAll,
    validateRow,
    hasErrors,
    // Submission
    submitRows,
    overrideOrder,
    // Loading states
    isSubmitting,
    isCheckingDuplicate,
  };
};