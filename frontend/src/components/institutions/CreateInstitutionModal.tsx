import { useState, useEffect } from "react";
import { useCreateInstitution, useInstitutions } from "../../hooks/useInstitutions";

interface Props {
    onClose: () => void 
    onSuccess: () => void
}

const CreateInstitutionModal = ({onClose, onSuccess}: Props) => {
    const { createInstitution, loading, error } = useCreateInstitution()
    const [tempPassword, setTempPassword] = useState<string | null>(null)
    const [form, setForm] = useState({
        name: '', email: '', address: '',
        contact_person: '', contact_phone: ''
    })

    const [logoFile, setLogoFile] = useState<File | null>(null)

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    }
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) setLogoFile(e.target.files[0])
    }

    const handleSubmit = async () => {
        const result = await createInstitution({ ...form, logo: logoFile ?? undefined })

        if (result) {
            setTempPassword(result.institution.temp_password)
            onSuccess()
        }
    }

    if (tempPassword) {
        return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Institution Created</h3>
                    <p className="text-sm text-gray-500 mb-4">
                        Save this temporary password - it won't be shown again.
                    </p>
                    <div className="bg-gray-100 rounded-lg px-4 py-3 font-mono text-sm text-gray-800 tracking-wider">
                        {tempPassword}
                    </div>
                    <button
                        onClick={onClose}
                        className="mt-4 w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
                    >
                        Done
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg">
                <div className="flex items-center justify-between mb-5">
                    <h3 className="text-lg font-semibold text-gray-800">New Institution</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
                </div>

                <div className="space-y-3">
                    {[
                        { name: 'name',           label: 'Institution Name',  type: 'text' },
                        { name: 'email',          label: 'Email',             type: 'email' },
                        { name: 'contact_person', label: 'Contact Person',    type: 'text' },
                        { name: 'contact_phone',  label: 'Contact Phone',     type: 'text' },
                    ].map(field => (
                        <div key={field.name}>
                        <label className="block text-xs font-medium text-gray-600 mb-1">{field.label}</label>
                        <input
                            name={field.name}
                            type={field.type}
                            value={(form as any)[field.name]}
                            onChange={handleChange}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        </div>         
                    ))}

                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Logo</label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Address</label>
                        <textarea 
                            name="address" 
                            value={form.address}
                            onChange={handleChange}
                            rows={2}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>
                
                {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
                
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
                        className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition"
                    >
                        {loading ? 'Creating...' : 'Create'}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default CreateInstitutionModal