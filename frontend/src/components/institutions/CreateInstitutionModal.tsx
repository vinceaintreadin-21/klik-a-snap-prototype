import { useState} from "react";
import { useCreateInstitution } from "../../hooks/useInstitutions";

interface Props {
    onClose: () => void 
    onSuccess: () => void
}

const CreateInstitutionModal = ({onClose, onSuccess}: Props) => {
    const { createInstitution, loading, error } = useCreateInstitution()
    const [form, setForm] = useState({
        name: '', email: '', address: '',
        contact_person: '', contact_phone: '',
        order_quota: '', contract_ends_at: ''
    })

    const [logoFile, setLogoFile] = useState<File | null>(null)

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    }
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) setLogoFile(e.target.files[0])
    }

    const handleSubmit = async () => {
        const result = await createInstitution({ 
            ...form, 
            logo: logoFile ?? undefined,
            order_quota: form.order_quota ? parseInt(form.order_quota) : null, 
            contract_ends_at: form.contract_ends_at || null
        })

        if (result) {
           onSuccess()
           onClose()
        }
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

                <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                        Order Quota <span className="text-gray-400">(leave blank for unlimited)</span>
                    </label>
                    <input
                        name="order_quota"
                        type="number"
                        min="1"
                        value={form.order_quota}
                        onChange={handleChange}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g. 5"
                    />
                </div>

                <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                        Contract End Date <span className="text-gray-400">(optional)</span>
                    </label>
                    <input
                        name="contract_ends_at"
                        type="date"
                        value={form.contract_ends_at}
                        onChange={handleChange}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
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