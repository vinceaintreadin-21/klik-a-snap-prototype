import { useState, useEffect } from "react";
import { ChevronLeft, Package, Download, Lock, AlertTriangle, Users, Calendar, CheckCircle2, Eye, Clock, Loader2 } from "lucide-react";
import {
  type ExportOrder,
  type ExportStudent,
  isExportEnabled,
  getDisabledReason,
  getOrderStatus,
  getInstitutionName,
  getStudentTotalCount,
} from "./exportTypes";
import { downloadOrderZip, fetchOrderStudents } from "../../../utils/exportApi";
import { StudentTable } from "./StudentTable";
import { cn } from "../../../lib/utils";

interface OrderExportDetailProps {
  order: ExportOrder;
  onBack: () => void;
}

const APPROVAL_CONFIG = {
  completed: { label: "Completed", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200", icon: CheckCircle2 },
  approved: { label: "Approved", color: "text-blue-700", bg: "bg-blue-50 border-blue-200", icon: CheckCircle2 },
  awaiting_approval: { label: "Awaiting Approval", color: "text-amber-700", bg: "bg-amber-50 border-amber-200", icon: Clock },
  reviewing: { label: "Reviewing", color: "text-gray-600", bg: "bg-gray-50 border-gray-200", icon: Eye },
};

export function OrderExportDetail({ order, onBack }: OrderExportDetailProps) {
  const [students, setStudents] = useState<ExportStudent[]>(order.students || []);
  const [loadingStudents, setLoadingStudents] = useState<boolean>(!order.students?.length);
  const [studentError, setStudentError] = useState<string | null>(null);

  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const status = getOrderStatus(order);
  const enabled = isExportEnabled(status);
  const cfg = APPROVAL_CONFIG[status as keyof typeof APPROVAL_CONFIG] || APPROVAL_CONFIG.reviewing;

  const schoolName = getInstitutionName(order);
  const totalStudents = getStudentTotalCount(order);

  // Fetch students from backend on component mount
  useEffect(() => {
    if (order.id) {
      setLoadingStudents(true);
      fetchOrderStudents(order.id)
        .then((data) => {
          setStudents(data);
          setStudentError(null);
        })
        .catch((err) => {
          setStudentError(err.message || "Failed to load students");
        })
        .finally(() => setLoadingStudents(false));
    }
  }, [order.id]);

  const processed = students.filter((s) => s.photo_status === "PROCESSED");
  const manualCount = students.filter((s) => s.photo_status === "MANUAL_REVIEW").length;
  const approvedBy = order.approved_by || order.approvedBy;

  const handleDownloadZip = async () => {
    setIsDownloading(true);
    setDownloadError(null);
    try {
      await downloadOrderZip(String(order.id));
    } catch (err: any) {
      setDownloadError(err.message || "Failed to download ZIP archive");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#F7F8FA]">
      <header className="sticky top-0 z-10 bg-white border-b border-gray-100 shadow-sm">
        <div className="flex items-center gap-3 px-6 py-3">
          <button
            onClick={onBack}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-[15px] font-semibold text-gray-900">{schoolName}</h1>
              <span className="text-[11px] font-medium text-gray-400">#{order.id}</span>
              <span className={cn("flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border", cfg.color, cfg.bg)}>
                <cfg.icon size={9} />
                {cfg.label}
              </span>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-gray-400 mt-0.5">
              <span className="flex items-center gap-1"><Users size={10} />{totalStudents} students</span>
              {order.deadline && <span className="flex items-center gap-1"><Calendar size={10} />Due {order.deadline}</span>}
              {approvedBy && (
                <span className="flex items-center gap-1 text-emerald-600">
                  <CheckCircle2 size={10} />Approved by {approvedBy}
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-5">
          <div className={cn("rounded-2xl border p-5 flex items-start gap-5", enabled ? "bg-white border-gray-100 shadow-sm" : "bg-gray-50 border-gray-100")}>
            <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0", enabled ? "bg-blue-50" : "bg-gray-100")}>
              <Package size={22} className={enabled ? "text-blue-600" : "text-gray-400"} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <h2 className={cn("text-[15px] font-semibold", enabled ? "text-gray-900" : "text-gray-500")}>Final ID Cards ZIP</h2>
                  <p className={cn("text-[12px] mt-0.5", enabled ? "text-gray-500" : "text-gray-400")}>
                    {enabled ? `${processed.length} processed student${processed.length !== 1 ? "s" : ""} will be bundled into the archive` : getDisabledReason(status)}
                  </p>
                </div>
                <button
                  disabled={!enabled || isDownloading}
                  onClick={handleDownloadZip}
                  className={cn(
                    "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shrink-0",
                    enabled && !isDownloading
                      ? "bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-200 active:scale-95"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed"
                  )}
                >
                  {enabled ? <Download size={15} /> : <Lock size={14} />}
                  {isDownloading ? "Generating ZIP..." : "Download ID Cards (.zip)"}
                </button>
              </div>

              {downloadError && (
                <div className="mt-3 p-3 bg-red-50 border border-red-100 text-red-700 text-[12px] rounded-xl">
                  {downloadError}
                </div>
              )}

              {enabled && manualCount > 0 && (
                <div className="mt-3 flex items-start gap-2 p-3 bg-amber-50 border border-amber-100 rounded-xl">
                  <AlertTriangle size={14} className="text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-[12px] text-amber-800">
                    <strong>{manualCount} student{manualCount > 1 ? "s" : ""}</strong> {manualCount > 1 ? "are" : "is"} in Manual Review and will not be included in the ZIP.
                  </p>
                </div>
              )}
            </div>
          </div>

          {loadingStudents ? (
            <div className="py-16 flex flex-col items-center justify-center gap-2 text-sm text-gray-400">
              <Loader2 size={20} className="animate-spin text-blue-600" />
              Loading student records...
            </div>
          ) : studentError ? (
            <div className="py-16 text-center text-sm text-red-500">{studentError}</div>
          ) : (
            <StudentTable students={students} />
          )}
        </div>

        <div className="w-[240px] shrink-0 border-l border-gray-100 bg-white overflow-y-auto px-5 py-5 space-y-5">
          <div>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Export Summary</div>
            <div className="space-y-2.5">
              {[
                { label: "Total students", value: String(totalStudents), color: "text-gray-900" },
                { label: "Processed", value: String(processed.length), color: "text-emerald-600" },
                { label: "Manual Review", value: String(manualCount), color: manualCount > 0 ? "text-amber-600" : "text-gray-400" },
                { label: "In ZIP", value: enabled ? String(processed.length) : "—", color: enabled ? "text-blue-700 font-bold" : "text-gray-400" },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                  <span className="text-[12px] text-gray-500">{row.label}</span>
                  <span className={cn("text-[13px] font-semibold", row.color)}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}