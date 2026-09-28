export type IssueType = 'no_qr' | 'qr_not_found' | 'no_face' | 'no_layout' | 'error'

export interface ReviewStudent {
  id: number
  student_id: string
  full_name: string
  grade_level: string
  photo_status: string
  fail_reason: string
  original_photo_url?: string | null | undefined
  processed_photo_url?: string | null
}

export interface CropBox {
  x: number
  y: number
  w: number
  h: number
}

export const ISSUE_LABELS: Record<IssueType, string> = {
  no_qr: 'No QR Code',
  qr_not_found: 'QR Not Found',
  no_face: 'No Face Detected',
  no_layout: 'No Layout',
  error: 'Processing Error',
}

export const ISSUE_COLORS: Record<IssueType, string> = {
  no_qr: 'text-red-400 bg-red-900/30 border-red-700/40',
  qr_not_found: 'text-orange-400 bg-orange-900/30 border-orange-700/40',
  no_face: 'text-slate-400 bg-slate-800/60 border-slate-600/40',
  no_layout: 'text-amber-400 bg-amber-900/30 border-amber-700/40',
  error: 'text-rose-400 bg-rose-900/30 border-rose-700/40',
}

export const ISSUE_STRIP: Record<IssueType, string> = {
  no_qr: '#ef4444',
  qr_not_found: '#f97316',
  no_face: '#64748b',
  no_layout: '#f59e0b',
  error: '#f43f5e',
}

export const HUES = [210, 350, 160, 40, 270, 15, 195, 310, 55, 130, 240, 180, 320, 95]

export function issueType(s: ReviewStudent): IssueType {
  if (s.photo_status === 'PENDING' && !s.original_photo_url) return 'no_qr'
  const r = s.fail_reason as IssueType
  if (['no_qr', 'qr_not_found', 'no_face', 'no_layout', 'error'].includes(r)) return r
  return 'error'
}