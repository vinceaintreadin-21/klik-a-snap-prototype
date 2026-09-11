export type OperatorOrderStatus = "PROOFING" | "APPROVED" | "PRINTING" | "COMPLETED";

export interface OperatorOrder {
  id: number;
  school_name: string;
  batch_name: string;
  student_count: number;
  deadline?: string | null;
  status: OperatorOrderStatus | string;
}
 
export interface RevisionStudent {
  id: number;
  student_id: string;
  full_name: string;
  grade_level: string;
  photo_status: string;
  fail_reason: string;
  original_photo_url?: string | null;
  processed_photo_url?: string | null;
}
 
export interface CropBox {
  x: number;
  y: number;
  w: number;
  h: number;
}
