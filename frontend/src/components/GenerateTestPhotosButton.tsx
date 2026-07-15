import { useState } from 'react'
import api from '../utils/api'

interface Props {
    orderId: number
    orderName: string
}

const GenerateTestPhotosButton = ({ orderId, orderName }: Props) => {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleGenerate = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (!files || files.length === 0) return

        setLoading(true)
        setError(null)

        try {
            const formData = new FormData()
            Array.from(files).forEach((file) => {
                formData.append('photos', file)
            })

            const res = await api.post(
                `/orders/${orderId}/generate-test-photos/`,
                formData,
                {
                    headers: { 'Content-Type': 'multipart/form-data' },
                    responseType: 'blob',  
                }
            )

            // ✅ trigger browser download
            const url = window.URL.createObjectURL(new Blob([res.data]))
            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', `test_photos_${orderName}.zip`)
            document.body.appendChild(link)
            link.click()
            link.remove()
            window.URL.revokeObjectURL(url)

        } catch (err: any) {
            setError('Failed to generate test photos')
        } finally {
            setLoading(false)
            // reset input so same files can be reselected
            e.target.value = ''
        }
    }

    return (
        <div className="inline-block">
            <label className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                loading
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-purple-600 text-white hover:bg-purple-700 shadow-md'
            }`}>
                {loading ? 'Generating...' : '🧪 Gen Test Photos'}
                <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    disabled={loading}
                    onChange={handleGenerate}
                />
            </label>
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        </div>
    )
}

export default GenerateTestPhotosButton