export type OrderApprovalStatus = "approved" | "completed" | "awaiting_approval" | "reviewing";
export type PhotoStatus = "PENDING" | "PROCESSED" | "MANUAL_REVIEW";
export type FailReason = "no_qr" | "qr_not_found" | "no_face" | "error";

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

  // Optional UI presentation fields
  hue?: number;
}

export interface ExportOrder {
    id: string;
    institution: string;
    ref: string; 
    approvalStatus: OrderApprovalStatus;
    approvedBy?: string;
    approvedOn?: string; 
    deadline?: string;
    students: ExportStudent[];
    hue?: number;
}

export const FAIL_REASON_LABELS: Record<string, string> = {
    no_qr: "No Qr detected",
    qr_not_found: "QR not matched",
    no_face: "Face not detected", 
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
} 

export function isExportEnabled(status: OrderApprovalStatus): boolean {
    return status === "approved" || status === "completed";
}

export function getDisabledReason(status: OrderApprovalStatus): string | null {
    if (status === "awaiting_approval") return "Waiting for institution approval"
    if (status == "reviewing") return "Order not yet revised or approved"
    return null;
}