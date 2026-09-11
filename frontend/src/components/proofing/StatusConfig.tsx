import { FileCheck, Clock, Printer, CheckCircle2 } from "lucide-react";
import type { OperatorOrderStatus } from "./proofingTypes";
 
export const STATUS_CONFIG: Record<
  OperatorOrderStatus,
  { label: string; color: string; bg: string; icon: React.ElementType }
> = {
  PROOFING: { label: "Reviewing", color: "text-blue-700", bg: "bg-blue-50 border-blue-200", icon: FileCheck },
  APPROVED: { label: "Awaiting Approval", color: "text-amber-700", bg: "bg-amber-50 border-amber-200", icon: Clock },
  PRINTING: { label: "Printing", color: "text-purple-700", bg: "bg-purple-50 border-purple-200", icon: Printer },
  COMPLETED: { label: "Completed", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200", icon: CheckCircle2 },
};
 
export const STAGE_KEYS: OperatorOrderStatus[] = ["PROOFING", "APPROVED", "PRINTING", "COMPLETED"];
 
export const HUES = [210, 350, 160, 40, 270, 15, 195, 310, 55, 130, 240, 180];
 
export const DEFAULT_CROP = { x: 15, y: 8, w: 70, h: 80 };
 