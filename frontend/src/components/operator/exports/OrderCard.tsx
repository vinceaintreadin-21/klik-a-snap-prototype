import { Download, Eye, ChevronRight, Users, CheckCircle2, AlertTriangle, Calendar, Lock } from "lucide-react";
import { type ExportOrder, isExportEnabled, getDisabledReason, getOrderStatus, getInstitutionName, getBatchRef, getStudentTotalCount, } from "./exportTypes";
import { cn } from "../../../lib/utils";

interface OrderCardProps {
  order: ExportOrder;
  onSelect: (order: ExportOrder) => void;
}

const APPROVAL_CONFIG = {
  completed: { label: "Completed", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200", icon: CheckCircle2 },
  approved: { label: "Approved", color: "text-blue-700", bg: "bg-blue-50 border-blue-200", icon: CheckCircle2 },
  awaiting_approval: { label: "Awaiting Approval", color: "text-amber-700", bg: "bg-amber-50 border-amber-200", icon: AlertTriangle },
  reviewing: { label: "Reviewing", color: "text-gray-600", bg: "bg-gray-50 border-gray-200", icon: Eye },
};

export function OrderCard({ order, onSelect }: OrderCardProps) {
  const status = getOrderStatus(order);
  const enabled = isExportEnabled(status);
  const cfg = APPROVAL_CONFIG[status as keyof typeof APPROVAL_CONFIG] || APPROVAL_CONFIG.reviewing;

  const schoolName = getInstitutionName(order);
  const batchRef = getBatchRef(order);
  const totalStudents = getStudentTotalCount(order);

  const students = order.students || [];
  const processedCount = students.filter((s) => s.photo_status === "PROCESSED").length;
  const manualCount = students.filter((s) => s.photo_status === "MANUAL_REVIEW").length;
  const disabledReason = getDisabledReason(status);

  return (
    <div className={cn("group bg-white rounded-2xl border shadow-sm hover:shadow-md transition-all duration-200 p-5", enabled ? "border-gray-100 hover:border-blue-100" : "border-gray-100")}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-[11px] font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
              #{order.id}
            </span>
            {batchRef && <span className="text-[10px] font-mono text-gray-400">{batchRef}</span>}
            <span className={cn("flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border", cfg.color, cfg.bg)}>
              <cfg.icon size={9} />
              {cfg.label}
            </span>
            {!enabled && (
              <span className="flex items-center gap-1 text-[10px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full border border-gray-200 font-medium">
                <Lock size={9} /> Export locked
              </span>
            )}
          </div>

          <h3 className="text-base font-semibold text-gray-900 mb-1">{schoolName}</h3>
          <div className="flex items-center gap-4 text-[12px] text-gray-400 flex-wrap">
            <span className="flex items-center gap-1"><Users size={11} />{totalStudents} students</span>
            {students.length > 0 && (
              <>
                <span className="flex items-center gap-1 text-emerald-600 font-medium"><CheckCircle2 size={10} />{processedCount} processed</span>
                {manualCount > 0 && <span className="flex items-center gap-1 text-amber-600 font-medium"><AlertTriangle size={10} />{manualCount} manual review</span>}
              </>
            )}
            {order.deadline && <span className="flex items-center gap-1"><Calendar size={10} />Due {order.deadline}</span>}
          </div>

          {!enabled && disabledReason && (
            <div className="mt-2.5 flex items-center gap-1.5 text-[12px] text-gray-500 bg-gray-50 border border-gray-100 rounded-lg px-2.5 py-1.5 w-fit">
              <Lock size={12} className="text-gray-400 shrink-0" />
              <span>{disabledReason}</span>
            </div>
          )}
        </div>

        <button
          onClick={() => onSelect(order)}
          className={cn(
            "flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl transition-all shadow-sm shrink-0",
            enabled ? "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200" : "bg-gray-100 hover:bg-gray-200 text-gray-600"
          )}
        >
          {enabled ? <Download size={14} /> : <Eye size={14} />}
          {enabled ? "Export" : "View"} <ChevronRight size={13} />
        </button>
      </div>
    </div>
  );
}