import { useState, useEffect } from "react";
import { useUpdateInstitution } from "../../hooks/useInstitutions";

interface Props {
    institution: { id: number; name: string;}
    onClose: () => void 
    onSuccess: () => void
}

const ActivateInstitutionModal = ({ institution, onClose, onSuccess}: Props) => {
    const { updateInstitution, loading, error } = useUpdateInstitution()
    
    const handleConfirm = async () => {
        const result = await updateInstitution(institution.id, { status: 'ACTIVE' })
        if (result) { onSuccess(); onClose(); }
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
                <h3 className="text-lg font-semibold text-grat-800 mb-1">Activate Institution</h3>
                <p className="text-sm text-gray-500 mb-6">
                    Reactivate <span className="font-medium text-gray-700">{institution.name}</span>
                </p>

                {error && <p className="mb-3 text-sm text-red-500">{error}</p>}

                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={loading}
                        className="flex-1 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition"
                    >
                        {loading ? 'Activating...' : 'Activate'}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default ActivateInstitutionModal