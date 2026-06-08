// frontend/src/components/table/EditableRow.tsx

import React from 'react';
import EditableCell from './EditableCell';
import type { StudentRow } from '../../hooks/useDataValidation';

interface EditableRowProps {
  row: StudentRow;
  isSelected: boolean;
  columns: { key: keyof StudentRow; label: string }[];
  onCellSave: (rowNumber: number, field: string, value: string) => void;
  onSelect: (rowNumber: number, checked: boolean) => void;
  onTabNext?: (rowNumber: number, fieldIndex: number) => void;
  onEnterNext?: (rowNumber: number) => void;
}

const EditableRow = ({
  row,
  isSelected,
  columns,
  onCellSave,
  onSelect,
  onTabNext,
  onEnterNext,
}: EditableRowProps) => {
  const hasErrors = row.errors.length > 0;

  return (
    <tr className={`border-b transition-colors ${hasErrors ? 'bg-red-50/30' : 'hover:bg-gray-50'}`}>
      {/* Checkbox */}
      <td className="px-3 py-2 w-8">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => onSelect(row.rowNumber, e.target.checked)}
          className="rounded border-gray-300"
        />
      </td>

      {/* Row number */}
      <td className="px-3 py-2 text-xs text-gray-400 w-10 select-none">
        {row.rowNumber}
      </td>

      {/* Editable cells */}
      {columns.map((col, colIndex) => (
        <EditableCell
          key={col.key as string}
          value={String(row[col.key] ?? '')}
          field={col.key as string}
          rowNumber={row.rowNumber}
          errors={row.errors}
          onSave={(val) => onCellSave(row.rowNumber, col.key as string, val)}
          onTabNext={() => onTabNext?.(row.rowNumber, colIndex)}
          onEnterNext={() => onEnterNext?.(row.rowNumber)}
        />
      ))}

      {/* Status */}
      <td className="px-3 py-2 text-center w-12">
        {hasErrors ? (
          <span title={row.errors.map((e) => e.message).join(', ')} className="text-red-500 text-sm">✕</span>
        ) : (
          <span className="text-green-500 text-sm">✓</span>
        )}
      </td>
    </tr>
  );
};

export default EditableRow;