export type OrderApprovalStatus = "approved" | "completed" | "awaiting_approval" | "reviewing" | string;
export type PhotoStatus = "PENDING" | "PROCESSED" | "MANUAL_REVIEW";
export type FailReason = "no_qr" | "qr_not_found" | "no_face" | "no_layout" | "error" | string;

export interface ExportStudent {
  id: number | string;
  order: number | string;

  // Identity
  student_id: string;
  full_name: string;
  grade_level: string;
  section: string;

  // Photos
  photo: string | null;
  processed_photo: string | null;
  processed_photo_back: string | null;
  original_photo_url: string | null;

  // QR Code
  qr_code_data: string | null;
  qr_code_url: string | null;

  // Status & Flags
  photo_status: PhotoStatus;
  fail_reason: FailReason;
  is_approved: boolean;
  is_walk_in: boolean;
  is_photographed: boolean;

  // Metadata & Timestamps
  extra_data: Record<string, unknown>;
  created_at: string;
  updated_at: string;

  // UI Presentation
  hue?: number;
}

export interface ExportOrder {
  id: number | string;
  
  // Backend payload fields
  school_name?: string;
  batch_name?: string;
  status?: OrderApprovalStatus;
  student_count?: number;
  created_at?: string;

  // UI / Legacy camelCase / snake_case fallbacks
  institution?: string;
  ref?: string;
  approval_status?: OrderApprovalStatus;
  approvalStatus?: OrderApprovalStatus;
  approved_by?: string;
  approvedBy?: string;
  approved_on?: string;
  approvedOn?: string;
  deadline?: string;

  students?: ExportStudent[];
  hue?: number;
}

export const FAIL_REASON_LABELS: Record<string, string> = {
  no_qr: "No QR detected",
  qr_not_found: "QR not matched",
  no_face: "Face not detected",
  no_layout: "No layout set",
  error: "Processing error",
};

export const PHOTO_STATUS_CONFIG: Record<PhotoStatus, { label: string; color: string; bg: string; dot: string }> = {
  PROCESSED: {
    label: "Processed",
    color: "text-emerald-700",
    bg: "bg-emerald-50 border-emerald-200",
    dot: "bg-emerald-500",
  },
  MANUAL_REVIEW: {
    label: "Manual Review",
    color: "text-amber-700",
    bg: "bg-amber-50 border-amber-200",
    dot: "bg-amber-400",
  },
  PENDING: {
    label: "Pending",
    color: "text-gray-500",
    bg: "bg-gray-100 border-gray-200",
    dot: "bg-gray-400",
  },
};

// --- Getter Helper Functions ---

export function getOrderStatus(order: ExportOrder): string {
  const rawStatus = order.status || order.approval_status || order.approvalStatus || "reviewing";
  return rawStatus.toLowerCase();
}

export function getInstitutionName(order: ExportOrder): string {
  return order.school_name || order.institution || "Unnamed Institution";
}

export function getBatchRef(order: ExportOrder): string {
  return order.batch_name || order.ref || "";
}

export function getStudentTotalCount(order: ExportOrder): number {
  if (typeof order.student_count === "number") return order.student_count;
  return order.students?.length || 0;
}

export function isExportEnabled(status?: string): boolean {
  if (!status) return false;
  const s = status.toLowerCase();
  return s === "approved" || s === "completed";
}

export function getDisabledReason(status?: string): string | null {
  if (!status) return "Order status unknown";
  const s = status.toLowerCase();
  if (s === "awaiting_approval") return "Waiting for institution approval";
  if (s === "reviewing") return "Order not yet reviewed or approved";
  return null;
}