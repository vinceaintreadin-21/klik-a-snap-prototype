import { useState, useEffect } from "react";
import api from "../utils/api";

// -- Types

export interface StudentForOrder {
    id: number
    student_id: string 
    full_name: string 
    grade_level: string 
    photo_status: string
    fail_reason: string
    original_photo_url?: string | null
    photo?: string | null
}

export interface BulkUploadResults {
    uploaded: { file: string; url: string; public_id: string }[]
    failed: { file: string; error: string }[]
}

export const useBulkUpload = () => {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [uploadProgress, setUploadProgress] = useState(0)
    const [results, setResults] = useState<BulkUploadResults | null>(null)

    const bulkUpload = async (orderId: number, files: File[]) => {
        setLoading(true)
        setError(null)
        setUploadProgress(0)
        setResults(null)

        const formData = new FormData()
        files.forEach(f => formData.append('files', f))

        try {
            const res = await api.post(`/orders/${orderId}/photos/upload/`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                onUploadProgress: (e) => {
                    if (e.total) {
                        setUploadProgress(Math.round((e.loaded / e.total) * 100))
                    }
                }
            })
            setResults(res.data)
            return res.data
        } catch (err: any) {
            setError(err.response?.data?.error || 'Upload failed')
        } finally {
            setLoading(false)
        }
    }

    return { bulkUpload, loading, error, uploadProgress, results }
}

export const useStudentsForOrder = (orderId: number) => {
    const [students, setStudents] = useState<StudentForOrder[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const fetchStudents = async () => {
        setLoading(true)
        setError(null)

        try {
            const res = await api.get(`/orders/${orderId}/students/`)
            setStudents(res.data)
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to fetch students')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { fetchStudents() }, [orderId])

    return { students, loading, error, refetch: fetchStudents }
}

export const useManualLinkPhoto = () => {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const linkPhoto = async (orderId: number, studentDbId: number, file: File) => {
        setLoading(true)
        setError(null)
        const formData = new FormData()
        formData.append('student_id', String(studentDbId))
        formData.append('photo', file)

        try {
            const res = await api.post(`/orders/${orderId}/students/manual-link/`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })
            return res.data
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to link photo')
            return null
        } finally {
            setLoading(false)
        }
    }

    return { linkPhoto, loading, error }
}