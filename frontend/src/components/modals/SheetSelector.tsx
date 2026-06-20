// frontend/src/components/modals/SheetSelector.tsx

import React, { useState } from 'react';

interface SheetSelectorProps {
  sheets: string[];
  fileName: string;
  onSelect: (sheetName: string) => void;
  isLoading: boolean;
}

const SheetSelector = ({ sheets, fileName, onSelect, isLoading }: SheetSelectorProps) => {
  const [selected, setSelected] = useState(sheets[0]);

  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 py-16">
      <div className="text-center">
        <div className="text-4xl mb-3">📊</div>
        <h3 className="text-lg font-bold text-gray-800">Multiple Sheets Detected</h3>
        <p className="text-sm text-gray-500 mt-1">{fileName}</p>
      </div>

      <div className="bg-gray-50 border rounded-xl p-6 w-full max-w-sm space-y-4">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">
          Select sheet to import
        </p>
        <div className="space-y-2">
          {sheets.map((sheet) => (
            <label
              key={sheet}
              className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                selected === sheet
                  ? 'border-indigo-400 bg-indigo-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <input
                type="radio"
                name="sheet"
                value={sheet}
                checked={selected === sheet}
                onChange={() => setSelected(sheet)}
                className="accent-indigo-500"
              />
              <span className="text-sm font-medium text-gray-700">{sheet}</span>
            </label>
          ))}
        </div>

        <button
          onClick={() => onSelect(selected)}
          disabled={isLoading}
          className="w-full py-2 bg-indigo-500 text-white rounded-lg font-bold text-sm hover:bg-indigo-600 disabled:opacity-50 transition-colors"
        >
          {isLoading ? 'Parsing...' : 'Import This Sheet'}
        </button>
      </div>
    </div>
  );
};

export default SheetSelector;