import { useState, useEffect, useCallback } from 'react';
import type { StudentRow } from '../../hooks/useDataValidation';
import { useDataValidation } from '../../hooks/useDataValidation';
import { getPageSizeConfig } from '../../utils/pagination';
import {
  initialUndoRedoState,
  pushAction,
  undo,
  redo,
} from '../../utils/undoRedo';
import TableToolbar  from './TableToolbar';
import EditableRow   from './EditableRow';
import TableFooter   from './TableFooter';

const CORE_COLUMNS = [
  { key: 'name'       as const, label: 'Name *'      },
  { key: 'student_id' as const, label: 'Student ID *' },
  { key: 'grade'      as const, label: 'Grade'        },
  { key: 'section'    as const, label: 'Section'      },
];

interface EditableDataTableProps {
  initialRows: StudentRow[];
  onChange: (rows: StudentRow[]) => void;
}

const EditableDataTable = ({ initialRows, onChange }: EditableDataTableProps) => {
  const { revalidateAll } = useDataValidation();
  const [rows,        setRows] = useState<StudentRow[]>(initialRows);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [undoRedo,    setUndoRedo] = useState(initialUndoRedoState<StudentRow>());

  const pageSizeConfig = getPageSizeConfig(rows.length);
  const [pageSize, setPageSize] = useState(pageSizeConfig.default);

  // ✅ derive extra columns from first row's extra_fields
  const extraColumnKeys = rows.length > 0
    ? Object.keys(rows[0].extra_fields ?? {})
    : [];

  const COLUMNS = [
    ...CORE_COLUMNS,
    ...extraColumnKeys.map(key => ({
      key: key as any,
      label: key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    }))
  ];

  // Bubble changes upward
  useEffect(() => {
    onChange(rows);
  }, [rows]);

  useEffect(() => {
    if (initialRows.length > 0) {
      setRows(initialRows);
      setPageSize(getPageSizeConfig(initialRows.length).default);
      setCurrentPage(1);
      setUndoRedo(initialUndoRedoState<StudentRow>());
    }
  }, [initialRows]);

  // ── Keyboard shortcuts ─────────────────────────────────────────────────────
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        const result = undo(undoRedo, rows);
        if (result) {
          setRows(revalidateAll(result.rows));
          setUndoRedo(result.next);
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        const result = redo(undoRedo, rows);
        if (result) {
          setRows(revalidateAll(result.rows));
          setUndoRedo(result.next);
        }
      }
    },
    [undoRedo, rows, revalidateAll]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // ── Helpers ────────────────────────────────────────────────────────────────

  const applyChange = (prev: StudentRow[], next: StudentRow[], type: any) => {
    setUndoRedo((u) => pushAction(u, { type, payload: { prev, next } }));
    setRows(next);
  };

  // ── Cell edit ──────────────────────────────────────────────────────────────

  const handleCellSave = (rowNumber: number, field: string, value: string) => {
    const prev = rows;
    const updated = rows.map((r) => {
      if (r.rowNumber !== rowNumber) return r
      // ✅ core fields update directly, extra fields update inside extra_fields
      const isCoreField = CORE_COLUMNS.some(c => c.key === field)
      if (isCoreField) {
        return { ...r, [field]: value }
      } else {
        return { ...r, extra_fields: { ...r.extra_fields, [field]: value } }
      }
    })
    const next = revalidateAll(updated)
    applyChange(prev, next, 'EDIT_CELL')
  };

  // ── Row selection ──────────────────────────────────────────────────────────

  const handleSelect = (rowNumber: number, checked: boolean) => {
    setRows((prev) =>
      prev.map((r) => (r.rowNumber === rowNumber ? { ...r, isSelected: checked } : r))
    );
  };

  const handleSelectAll = (checked: boolean) => {
    setRows((prev) => prev.map((r) => ({ ...r, isSelected: checked })));
  };

  // ── Add row ────────────────────────────────────────────────────────────────

  const handleAddRow = () => {
    const prev = rows;
    const newRow: StudentRow = {
      name: '', student_id: '', grade: '', section: '',
      extra_fields: {},  // ✅
      rowNumber:  rows.length + 1,
      errors:     [],
      isSelected: true,
    };
    const updated = revalidateAll([...rows, newRow]);
    applyChange(prev, updated, 'ADD_ROW');
    const newTotal = updated.length;
    setCurrentPage(Math.ceil(newTotal / pageSize));
  };

  // ── Delete selected ────────────────────────────────────────────────────────

  const handleDeleteSelected = () => {
    const prev    = rows;
    const kept    = rows.filter((r) => !r.isSelected);
    const renumbered = kept.map((r, i) => ({ ...r, rowNumber: i + 1 }));
    const next    = revalidateAll(renumbered);
    applyChange(prev, next, 'DELETE_ROWS');
    setCurrentPage(1);
  };

  // ── Tab / Enter navigation ─────────────────────────────────────────────────

  const handleTabNext = (rowNumber: number, colIndex: number) => {
    const isLastCol = colIndex === COLUMNS.length - 1;
    if (isLastCol) {
      const nextRow = rows.find((r) => r.rowNumber === rowNumber + 1);
      if (!nextRow) handleAddRow();
    }
  };

  const handleEnterNext = (rowNumber: number) => {
    const nextRow = rows.find((r) => r.rowNumber === rowNumber + 1);
    if (!nextRow) handleAddRow();
  };

  // ── Filtering + pagination ─────────────────────────────────────────────────

  const filtered = searchQuery.trim()
    ? rows.filter((r) => {
        const q = searchQuery.toLowerCase();
        return (
          r.name.toLowerCase().includes(q)       ||
          r.student_id.toLowerCase().includes(q) ||
          r.grade.toLowerCase().includes(q)      ||
          r.section.toLowerCase().includes(q)
        );
      })
    : rows;

  const totalPages  = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage    = Math.min(currentPage, totalPages);
  const paginated   = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const selectedCount = rows.filter((r) => r.isSelected).length;
  const allSelected   = rows.length > 0 && rows.every((r) => r.isSelected);
  const errorCount    = rows.filter((r) => r.errors.length > 0).length;

  const pageSizeOptions = getPageSizeConfig(rows.length).options;

  return (
    <div className="flex flex-col h-full">
      <TableToolbar
        totalRows={rows.length}
        validRows={rows.length - errorCount}
        errorRows={errorCount}
        selectedCount={selectedCount}
        searchQuery={searchQuery}
        allSelected={allSelected}
        canUndo={undoRedo.past.length > 0}
        canRedo={undoRedo.future.length > 0}
        onSearchChange={(q) => { setSearchQuery(q); setCurrentPage(1); }}
        onSelectAll={handleSelectAll}
        onDeleteSelected={handleDeleteSelected}
        onUndo={() => {
          const result = undo(undoRedo, rows);
          if (result) { setRows(revalidateAll(result.rows)); setUndoRedo(result.next); }
        }}
        onRedo={() => {
          const result = redo(undoRedo, rows);
          if (result) { setRows(revalidateAll(result.rows)); setUndoRedo(result.next); }
        }}
      />

      {/* Table */}
      <div className="overflow-auto flex-1 border rounded-lg">
        <table className="w-full text-sm border-collapse">
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr>
              <th className="px-3 py-2 w-8" />
              <th className="px-3 py-2 w-10 text-left text-xs font-bold text-gray-400">#</th>
              {COLUMNS.map((col) => (
                <th key={col.key} className="px-3 py-2 text-left text-xs font-bold text-gray-600 uppercase tracking-wide">
                  {col.label}
                </th>
              ))}
              <th className="px-3 py-2 w-12 text-center text-xs font-bold text-gray-400">OK</th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={COLUMNS.length + 3} className="text-center py-10 text-gray-400 text-sm">
                  {searchQuery ? 'No rows match your search.' : 'No rows yet. Click + Add Row.'}
                </td>
              </tr>
            ) : (
              paginated.map((row) => {
                // ✅ flatten extra_fields to top level for EditableRow rendering
                const flatRow = {
                  ...row,
                  ...(row.extra_fields ?? {}),
                }
                return (
                  <EditableRow
                    key={row.rowNumber}
                    row={flatRow}
                    isSelected={row.isSelected}
                    columns={COLUMNS}
                    onCellSave={handleCellSave}
                    onSelect={handleSelect}
                    onTabNext={handleTabNext}
                    onEnterNext={handleEnterNext}
                  />
                )
              })
            )}
          </tbody>
        </table>
      </div>

      <TableFooter
        currentPage={safePage}
        totalPages={totalPages}
        pageSize={pageSize}
        pageSizeOptions={pageSizeOptions}
        onPageChange={setCurrentPage}
        onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }}
        onAddRow={handleAddRow}
      />
    </div>
  );
};

export default EditableDataTable;