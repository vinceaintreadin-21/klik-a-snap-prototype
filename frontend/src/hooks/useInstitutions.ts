import {useState, useEffect, useCallback} from 'react'
import api from '../utils/api'

//Types
interface Institution {
    id: number
    name: string
    address: string
    contact_person: string
    contact_email: string
    contact_phone: string
    logo_url: string | null
    status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
    created_at: string
    suspended_at: string | null
    suspended_by__username: string | null
    suspended_reason: string
}

interface CreateInstitutionPayload {
    name: string 
    email: string
    address: string 
    contact_person: string 
    contact_phone?: string 
    logo?: File
}

interface UpdateInstitutionPayload {
    status: 'ACTIVE' | 'INACTIVE' | 'SUSPEND'
    suspended_reason?: string
}

interface Order {
    id: number 
    school_name: string 
    batch_name: string 
    student_count: number 
    status: string 
    deadline: string | null 
    created_at: string
}

export const useInstitutions = () => {
    const [institutions, setInstitutions] = useState<Institution[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchInstitutions = useCallback(async () => {
        setLoading(true)
        setError(null)

        try {
            const res = await api.get('/admin/institutions/')
            setInstitutions(res.data.institutions)
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to fetch institutions')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchInstitutions()
    }, [fetchInstitutions])

    return {
        institutions,
        loading,
        error,
        refetch: fetchInstitutions
    }
}

export const useCreateInstitution = () => {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const createInstitution = async (payload: CreateInstitutionPayload) => {
        setLoading(true)
        setError(null)

        try {
            const formData = new FormData()
            formData.append('name', payload.name)
            formData.append('email', payload.email)
            formData.append('address', payload.address)
            formData.append('contact_person', payload.contact_person)
            if (payload.contact_phone) formData.append('contact_phone', payload.contact_phone)
            if (payload.logo) formData.append('logo', payload.logo)
        
                const res = await api.post('/admin/create-institution/', formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                })
            return res.data
        } catch (err: any) {
            const message = err.response?.data?.error || 'Failed to create institution'
            setError(message)
            return null
        } finally {
            setLoading(false)
        }
    }

    return { createInstitution, loading, error }
}

export const useUpdateInstitution = () => {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const updateInstitution = async(id: number, payload: UpdateInstitutionPayload) => {
        setLoading(true)
        setError(null)

        try {
            const res = await api.patch(`/admin/institutions/${id}/update/`, payload)
            return res.data
        } catch (err: any) {
            const message = err.response?.data?.error || 'Failed to update institution'
            setError(message)
            return null
        } finally {
            setLoading(false)
        }
    }

    return { updateInstitution, loading, error }
}

export const useInstitutionOrders = (id: number) => {
    const [orders, setOrders] = useState<Order[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchOrders = useCallback(async () => {
        setLoading(true)
        setError(null)

        try {
            const res = await api.get(`admin/institutions/${id}/orders`)
            setOrders(res.data.orders)
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to fetch orders')
        } finally {
            setLoading(false)
        }
    }, [id])

    useEffect(() => {
        if (id) fetchOrders() 
    }, [fetchOrders, id])

    return { orders, loading, error, refetch: fetchOrders }
}