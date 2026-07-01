import { useState } from "react";
import { useUpdateInstitution } from "../../hooks/useInstitutions";

interface Props {
    institution: { id: number; name: string; }
    onClose: () => void;
    onSuccess: () => void;
}

const SuspendInstitutionModal = ({ institution, onClose, onSuccess }: Props) => {
    const { updateInstitution, loading, error } = useUpdateInstitution()
    const [reason, setReason] = useState('')

    const handleSubmit = async () => {
        const result = await updateInstitution(institution.id, {
            status: 'SUSPENDED',
            suspended_reason: reason
        })
        if (result) { onSuccess(); onClose() }
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
                <h3 className="text-lg font-semibold text-gray-800 mb-1">Suspend Institution</h3>
                <p className="text-sm text-gray-500 mb-4">
                You are about to suspend <span className="font-medium text-gray-700">{institution.name}</span>.
                </p>

                <label className="block text-xs font-medium text-gray-600 mb-1">Reason (optional)</label>
                <textarea
                value={reason}
                onChange={e => setReason(e.target.value)}
                rows={3}
                placeholder="Explain why this institution is being suspended..."
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
                />

                {error && <p className="mt-2 text-sm text-red-500">{error}</p>}

                <div className="flex gap-3 mt-5">
                <button
                    onClick={onClose}
                    className="flex-1 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition"
                >
                    Cancel
                </button>
                <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition"
                >
                    {loading ? 'Suspending...' : 'Suspend'}
                </button>
                </div>
            </div>
        </div>
    )
}

export default SuspendInstitutionModal