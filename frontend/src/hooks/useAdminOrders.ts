import { useState, useEffect } from "react";
import api from "../utils/api";

// -- Types

export interface AdminOrder {
    id: number
    school_name: string 
    batch_name: string 
    student_count: number 
    status: string 
    deadline: string 
    created_at: string 
    institution_id: number 
    institution__name: string 
    assigned_operator__username: string | null 
}

export interface OrderFilters {
    status?: string 
    institution_id?: string 
    date_from?: string 
    date_to?: string
}

export const useAdminOrders = (filters?: OrderFilters) => {
    const [orders, setOrders] = useState<AdminOrder[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const fetchOrders = async () => {
        setLoading(true)
        setError(null)

        try {
            const res = await api.get('/admin/orders/', {
                params: filters
            })
            setOrders(res.data.orders)
        } catch (err: any) {
            setError(err.response?.data?.error || "Failed to fetch orders")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { fetchOrders() }, [JSON.stringify(filters)])
    
    return {
        orders, loading, error, refetch: fetchOrders
    }
}

export const useAssignOperator = () => {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const assignOperator = async (orderId: number, operatorId: number | null) => {
        setLoading(true)
        setError(null)

        try {
            const res = await api.patch(`/admin/orders/${orderId}/assign/`, {
                operator_id: operatorId
            })
            return res.data
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to assign operator')
            return null
        } finally {
            setLoading(false)
        }
    }

    return {
        assignOperator, loading, error
    }
}

export const useOverrideOrderStatus = () => {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const overrideStatus = async (orderId: number, status: string, reason: string) => {
        setLoading(true)
        setError(null)
        try {
            const res = await api.patch(`/admin/orders/${orderId}/override-status/`, {
                status,
                reason
            })
            return res.data
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to override status')
            return null
        } finally {
            setLoading(false)
        }
    }

    return { overrideStatus, loading, error }
}