// frontend/src/components/table/EditableCell.tsx

import React, { useState, useRef, useEffect } from 'react';
import type { ValidationError } from '../../hooks/useDataValidation';

interface EditableCellProps {
  value: string;
  field: string;
  rowNumber: number;
  errors: ValidationError[];
  onSave: (value: string) => void;
  onTabNext?: () => void;
  onEnterNext?: () => void;
}

const EditableCell = ({
  value,
  field,
  errors,
  onSave,
  onTabNext,
  onEnterNext,
}: EditableCellProps) => {
  const [editing, setEditing]     = useState(false);
  const [draft,   setDraft]       = useState(value);
  const inputRef                  = useRef<HTMLInputElement>(null);

  const fieldErrors = errors.filter((e) => e.field === field);
  const hasMissing  = fieldErrors.some((e) => e.type === 'missing');
  const hasDupe     = fieldErrors.some((e) => e.type === 'duplicate');

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  // Sync draft if parent row changes (e.g. undo/redo)
  useEffect(() => {
    setDraft(value);
  }, [value]);

  const commit = () => {
    setEditing(false);
    if (draft.trim() !== value.trim()) onSave(draft.trim());
  };

  const cancel = () => {
    setDraft(value);
    setEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter')  { e.preventDefault(); commit(); onEnterNext?.(); }
    if (e.key === 'Escape') { e.preventDefault(); cancel(); }
    if (e.key === 'Tab')    { e.preventDefault(); commit(); onTabNext?.();   }
  };

  const cellBg = hasMissing
    ? 'bg-red-50 border-red-400'
    : hasDupe
    ? 'bg-yellow-50 border-yellow-400'
    : 'bg-transparent border-transparent';

  return (
    <td
      className={`px-3 py-2 border text-sm cursor-pointer ${cellBg} hover:bg-gray-50 transition-colors`}
      onClick={() => setEditing(true)}
    >
      {editing ? (
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={handleKeyDown}
          className="w-full bg-white border border-indigo-400 rounded px-1 py-0.5 text-sm outline-none focus:ring-1 focus:ring-indigo-400"
        />
      ) : (
        <div className="flex items-center justify-between gap-1 min-h-[1.25rem]">
          <span className={!value ? 'text-gray-300 italic text-xs' : ''}>
            {value || 'Click to edit'}
          </span>
          {fieldErrors.length > 0 && (
            <span
              title={fieldErrors[0].message}
              className={`text-xs font-bold shrink-0 ${
                hasMissing ? 'text-red-500' : 'text-yellow-500'
              }`}
            >
              {hasMissing ? '!' : '⚠'}
            </span>
          )}
        </div>
      )}
    </td>
  );
};

export default EditableCell;