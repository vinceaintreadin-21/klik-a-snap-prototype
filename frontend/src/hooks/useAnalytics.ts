import { useState, useEffect } from "react";
import api from "../utils/api";

// --- Types
interface AnalyticsOverview {
    total_ids: number
    total_orders: number
    pending_orders: number
    active_institutions: number 
    active_operators: number
}

interface OrdersPerMonth {
    month: string,
    orders: number
}

interface ManualReviewRate {
    rate: number 
    manual_review_count: number 
    total_students: number
}  

// ---Functions

export const useAnalyticsOverview = () => {
    const [data, setData] = useState<AnalyticsOverview | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const fetchOverview = async () => {
        setLoading(true)
        setError(null)

        try {
            const res = await api.get('/admin/analytics/overview/')
            setData(res.data)
        } catch (err: any) {
            setError(err.response?.data.error || 'Failed to fetch analytics overview')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchOverview()
    }, [])

    return {
        data, loading, error, refetch: fetchOverview
    }
}

export const useOrdersPerMonth = () => {
    const [data, setData] = useState<OrdersPerMonth[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const fetchOrdersPerMonth = async() => {
        setLoading(true)
        setError(null)

        try {
            const res = await api.get('/admin/analytics/orders-per-month/')
            setData(res.data.orders_per_month)
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to fetch orders per month')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { fetchOrdersPerMonth() }, [])

    return { data, loading, error, refetch: fetchOrdersPerMonth }
}

export const useManualReviewRate = () => {
    const [data, setData] = useState<ManualReviewRate | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const fetchManualReviewRate = async () => {
        setLoading(true)
        setError(null)

        try {
            const res = await api.get('/admin/analytics/manual-review-rate/')
            setData(res.data)
        } catch (err: any) {
            setError(err.response?.data.error || "Failed to fetch manual review rate")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchManualReviewRate() 
    }, [])

    return {
        data, loading, error, refetch: fetchManualReviewRate
    }
}