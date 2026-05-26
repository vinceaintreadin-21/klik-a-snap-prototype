import { useState, useEffect } from "react"
import api from "../utils/api"

// -- Types

interface ProcessingLog {
    id: number
    order_id: number 
    level: string 
    message: string 
    details: any 
    created_at: string 
    created_by: string | null 
}

interface ErrorLog extends ProcessingLog {
    order_name: string
}

interface AuditLog {
    id: number 
    admin_user: string | null 
    action: string 
    target_model: string
    target_id: number 
    details: any 
    created_at: string
}

interface ProcessingLogFilters {
    order_id?: string 
    level?: string 
    date_from?: string
    date_to?: string
}

interface AuditLogFilters {
    admin_user?: string 
    action?: string 
    target_model?: string 
    date_from?: string 
    date_to?: string 
}

export const useProcessingLogs = (filters?: ProcessingLogFilters) => {
    const [data, setData] = useState<ProcessingLog[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const fetchProcessingLogs = async () => {
        setLoading(true)
        setError(null)

        try {
            const res = await api.get('/admin/logs/processing', {
                params: filters
            })
            setData(res.data.logs)
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to fetch processing logs')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchProcessingLogs()
    }, [])

    return {
        data, loading, error, refetch: fetchProcessingLogs  
    }
}

export const useErrorLogs = (filters?: ProcessingLogFilters) => {
    const [data, setData] = useState<ErrorLog[]>([])
    const [errorCount, setErrorCount] = useState(0)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const fetchErrorLogs = async () => {
        setLoading(true)
        setError(null)

        try {
            const res = await api.get('/admin/logs/errors/', {
                params: filters
            })
            setData(res.data.logs)
            setErrorCount(res.data.error_count)
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to fetch error logs')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchErrorLogs()
    }, [])

    return {
        data, errorCount, loading, error, refetch: fetchErrorLogs
    }
}

export const useAuditLogs = (filters?: AuditLogFilters) => {
    const [data, setData] = useState<AuditLog[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const fetchAuditLogs = async () => {
        setLoading(true)
        setError(null)
        try {
            const res = await api.get('/admin/logs/audit/', {
                params: filters
            })
            setData(res.data.logs)
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to fetch audit logs')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchAuditLogs()
    }, [])

    return {
        data, loading, error, refetch: fetchAuditLogs
    }
}