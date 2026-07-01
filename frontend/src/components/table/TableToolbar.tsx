// frontend/src/components/table/TableToolbar.tsx



interface TableToolbarProps {
  totalRows: number;
  validRows: number;
  errorRows: number;
  selectedCount: number;
  searchQuery: string;
  allSelected: boolean;
  canUndo: boolean;
  canRedo: boolean;
  onSearchChange: (q: string) => void;
  onSelectAll: (checked: boolean) => void;
  onDeleteSelected: () => void;
  onUndo: () => void;
  onRedo: () => void;
}

const TableToolbar = ({
  totalRows,
  validRows,
  errorRows,
  selectedCount,
  searchQuery,
  allSelected,
  canUndo,
  canRedo,
  onSearchChange,
  onSelectAll,
  onDeleteSelected,
  onUndo,
  onRedo,
}: TableToolbarProps) => (
  <div className="flex flex-col gap-3 mb-3">
    {/* Stats row */}
    <div className="flex items-center gap-4 text-xs">
      <span className="text-gray-500">Total: <strong>{totalRows}</strong></span>
      <span className="text-green-600">Valid: <strong>{validRows}</strong></span>
      {errorRows > 0 && (
        <span className="text-red-500">Errors: <strong>{errorRows}</strong></span>
      )}
      {selectedCount > 0 && (
        <span className="text-indigo-600">Selected: <strong>{selectedCount}</strong></span>
      )}
    </div>

    {/* Controls row */}
    <div className="flex items-center gap-2">
      {/* Select all */}
      <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600 cursor-pointer">
        <input
          type="checkbox"
          checked={allSelected}
          onChange={(e) => onSelectAll(e.target.checked)}
          className="rounded border-gray-300"
        />
        Select All
      </label>

      {/* Delete selected */}
      {selectedCount > 0 && (
        <button
          onClick={onDeleteSelected}
          className="text-xs px-2 py-1 bg-red-50 text-red-600 border border-red-200 rounded hover:bg-red-100 transition-colors"
        >
          Delete Selected ({selectedCount})
        </button>
      )}

      {/* Undo / Redo */}
      <div className="flex gap-1 ml-auto">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
          className="text-xs px-2 py-1 border rounded disabled:opacity-40 hover:bg-gray-100 transition-colors"
        >
          ↩ Undo
        </button>
        <button
          onClick={onRedo}
          disabled={!canRedo}
          title="Redo (Ctrl+Shift+Z)"
          className="text-xs px-2 py-1 border rounded disabled:opacity-40 hover:bg-gray-100 transition-colors"
        >
          Redo ↪
        </button>
      </div>

      {/* Search */}
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Search name, ID, grade, section..."
        className="ml-2 text-xs border rounded px-2 py-1 w-56 focus:outline-none focus:ring-1 focus:ring-indigo-400"
      />
    </div>
  </div>
);

export default TableToolbar;