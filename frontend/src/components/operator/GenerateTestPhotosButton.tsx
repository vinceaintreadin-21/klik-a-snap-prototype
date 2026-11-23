import { useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import axios from 'axios'
import api from '../../utils/api'

interface Props {
    orderId: number
    orderName: string
    variant?: 'button' | 'menu'
}

const GenerateTestPhotosButton = ({ orderId, orderName, variant = 'button' }: Props) => {
    const input = useRef<HTMLInputElement>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleGenerate = async (e: ChangeEvent<HTMLInputElement>) => {
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

        } catch (err) {
            let message = 'Failed to generate test photos. Please try again.'
            if (axios.isAxiosError(err) && err.response?.data instanceof Blob) {
                try {
                    const details = JSON.parse(await err.response.data.text())
                    if (typeof details.error === 'string') message = details.error
                } catch { /* Keep the fallback message for non-JSON responses. */ }
            }
            setError(message)
        } finally {
            setLoading(false)
            // reset input so same files can be reselected
            e.target.value = ''
        }
    }

    return (
        <div className={variant === 'menu' ? 'w-full' : 'inline-block'}>
            <button
                type="button"
                role={variant === 'menu' ? 'menuitem' : undefined}
                onClick={() => input.current?.click()}
                disabled={loading}
                className={variant === 'menu'
                    ? 'w-full rounded-md px-3 py-2 text-left text-sm text-slate-700 hover:bg-purple-50 focus:bg-purple-50 focus:outline-none disabled:opacity-50'
                    : 'rounded-lg bg-purple-600 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50'}
            >
                {loading ? 'Generating…' : variant === 'menu' ? 'Generate test photos' : '🧪 Gen Test Photos'}
            </button>
            <input
                ref={input}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                disabled={loading}
                onChange={handleGenerate}
            />
            {error && <p role="alert" className="mt-1 max-w-64 px-3 text-xs text-red-600">{error}</p>}
        </div>
    )
}

export default GenerateTestPhotosButton
