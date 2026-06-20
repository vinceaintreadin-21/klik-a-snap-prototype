import { useState } from "react";

const REASONS = [
    'Wrong student',
    'Poor photo quality',
    'Wrong ID details',
    'Other'
]

interface RevisionPopoverProps {
    onConfirm: (reason: string) => void;
    onCancel: () => void; 
}

const RevisionPopover = ({onConfirm, onCancel}: RevisionPopoverProps) => {
    const [reason, setReason] = useState(REASONS[0])
    const [note, setNote] = useState('')

    const handleConfirm = () => {
        const finalReason = reason === 'Other' && note.trim()
        ? note.trim()
        : reason;
        onConfirm(finalReason)
    }

    return (
        <div className="absolute bottom-full left-0 mb-2 z-50 bg-white border border-gray-200 rounded-xl shadow-xl p-4 w-64">
        {/* Arrow */}
        <div className="absolute -bottom-1.5 left-6 w-3 h-3 bg-white border-r border-b border-gray-200 rotate-45" />

        <p className="text-xs font-black text-gray-700 uppercase tracking-wide mb-3">
            Request Revision
        </p>

        {/* Reason dropdown */}
        <label className="text-xs font-bold text-gray-500 block mb-1">Reason</label>
        <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full text-xs border rounded-lg px-2 py-1.5 mb-3 focus:outline-none focus:ring-1 focus:ring-indigo-400"
        >
            {REASONS.map(r => (
            <option key={r} value={r}>{r}</option>
            ))}
        </select>

        {/* Optional note */}
        <label className="text-xs font-bold text-gray-500 block mb-1">
            Note <span className="font-normal">(optional)</span>
        </label>
        <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add detail..."
            className="w-full text-xs border rounded-lg px-2 py-1.5 mb-3 focus:outline-none focus:ring-1 focus:ring-indigo-400"
        />

        {/* Actions */}
        <div className="flex gap-2 justify-end">
            <button
            onClick={onCancel}
            className="text-xs px-3 py-1.5 border rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
            >
            Cancel
            </button>
            <button
            onClick={handleConfirm}
            className="text-xs px-3 py-1.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors font-bold"
            >
            Confirm
            </button>
        </div>
        </div>
    );
}

export default RevisionPopover