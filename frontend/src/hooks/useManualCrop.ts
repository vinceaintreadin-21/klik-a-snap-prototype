import api from "../utils/api"
import  { useState } from "react"

export const useManualCrop = () => {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const submitCrop = async (
        orderId: number,
        studentId: number,
        crop: { x: number; y: number; width: number; height: number }
    ) => {
        setLoading(true)
        setError(null)
        const formData = new FormData()
        formData.append('crop_x', String(crop.x))
        formData.append('crop_y', String(crop.y))
        formData.append('crop_width', String(crop.width))
        formData.append('crop_height', String(crop.height))

        try {
            const res = await api.post(
                `/orders/${orderId}/students/${studentId}/manual-crop/`,
                formData
            )
            return res.data
        } catch (err: any) {
            setError(err.response?.data?.error || 'Crop failed')
            return null
        } finally {
            setLoading(false)
        }
    }

    return { submitCrop, loading, error }
}