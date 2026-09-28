// ── Institution shared types and status configs ───────────────────────────────

export type OrderStatus = 'PROCESSING' | 'PENDING APPROVAL' | 'PROOFING' | 'DISPATCHED' | 'COMPLETED' | 'PENDING' | 'APPROVED' | 'PRINTING' | 'CANCELLED'
export type CardReviewStatus = 'pending' | 'approved' | 'revision'

export interface InstOrder {
    id: number
    school_name: string
    batch_name: string
    status: string
    student_count: number
    deadline: string | null
    created_at: string
}

export interface Coordinator {
    id: number
    name: string
    email: string
    link_status: 'Active' | 'Expired' | 'Pending'
    photos_captured: number
    photo_limit: number
    initials?: string
    hue?: number
}

export interface ProofingStudent {
    id: number
    name: string
    student_id: string
    department?: string
    role?: string
    processed_photo?: string
    processed_photo_back?: string
    photo_status: string
    fail_reason?: string
}

export const STATUS_CFG: Record<string, { bg: string; text: string }> = {
    PROCESSING: { bg: '#d0e1fb', text: '#1e3a5f' },
    'PENDING APPROVAL': { bg: '#ffdad6', text: '#93000a' },
    PENDING: { bg: '#fef3c7', text: '#92400e' },
    DISPATCHED: { bg: '#e0e3e5', text: '#434655' },
    COMPLETED: { bg: '#dcfce7', text: '#166534' },
    PROOFING: { bg: '#ffdad6', text: '#93000a' },
    APPROVED: { bg: '#dcfce7', text: '#166534' },
    PRINTING: { bg: '#ede9fe', text: '#5b21b6' },
    CANCELLED: { bg: '#fee2e2', text: '#b91c1c' },
}

export const LINK_STATUS_CFG: Record<Coordinator['link_status'], { bg: string; dot: string; text: string }> = {
    Active: { bg: '#f0fdf4', dot: '#22c55e', text: '#15803d' },
    Expired: { bg: '#fef2f2', dot: '#ef4444', text: '#b91c1c' },
    Pending: { bg: '#eff6ff', dot: '#3b82f6', text: '#1d4ed8' },
}

export const REVISION_REASONS = [
    'Wrong student',
    'Duplicate face detected',
    'Poor photo quality',
    'Incorrect student data',
    'Incorrect department',
    'Other',
] as const
