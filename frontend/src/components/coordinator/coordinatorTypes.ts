// ── Coordinator shared types ──────────────────────────────────────────────────

export interface CoordStudent {
    id: number
    full_name: string
    student_id: string
    grade_level: string
    photo_status: 'PENDING' | 'PROCESSED' | 'MANUAL_REVIEW' | 'FAILED'
    is_photographed: boolean
    is_walk_in: boolean
    qr_code_url?: string
    is_approved?: boolean
    processed_photo?: string
}

export interface CoordOrder {
    id: number
    school_name: string
    batch_name: string
    student_count: number
    status: string
}

export const PHOTO_STATUS_CFG = {
    PROCESSED: { label: 'Processed', bg: '#dcfce7', text: '#166534', dot: '#22c55e' },
    MANUAL_REVIEW: { label: 'Needs Review', bg: '#fef3c7', text: '#92400e', dot: '#d97706' },
    PENDING: { label: 'Pending', bg: '#f1f5f9', text: '#64748b', dot: '#9ba3af' },
    FAILED: { label: 'Failed', bg: '#fef2f2', text: '#b91c1c', dot: '#ef4444' },
} as const

export const REVISION_REASONS = [
    'Wrong student',
    'Duplicate face detected',
    'Poor photo quality',
    'Incorrect student data',
    'Incorrect department',
    'Other',
] as const

// Derive initials from a full name
export const getInitials = (name: string) =>
    name.split(' ').map((n) => n[0] ?? '').join('').slice(0, 2).toUpperCase()

// Deterministic hue from an ID
export const getHue = (id: number) => (id * 47) % 360
