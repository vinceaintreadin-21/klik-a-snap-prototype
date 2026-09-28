import { useState, useMemo } from "react";
import { Search, Users, Info, FileImage, CheckCircle2, ArrowDownToLine, Loader2 } from "lucide-react";
import { type ExportStudent, PHOTO_STATUS_CONFIG, FAIL_REASON_LABELS } from "./exportTypes";
import { MiniCard } from "./MiniCard";
import { downloadStudentPhoto } from "../../../utils/exportApi";
import { cn } from "../../../lib/utils";

interface StudentTableProps {
  students: ExportStudent[];
}

export function StudentTable({ students = [] }: StudentTableProps) {
  const [search, setSearch] = useState("");
  const [downloaded, setDownloaded] = useState<Set<string | number>>(new Set());
  const [downloadingId, setDownloadingId] = useState<string | number | null>(null);

  const filteredStudents = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return students;
    return students.filter(
      (s) =>
        (s.full_name || "").toLowerCase().includes(q) ||
        (s.student_id || "").toLowerCase().includes(q) ||
        (s.grade_level || "").toLowerCase().includes(q) ||
        (s.section || "").toLowerCase().includes(q)
    );
  }, [students, search]);

  const handleDownloadSingle = async (student: ExportStudent) => {
    if (!student.processed_photo) return;

    setDownloadingId(student.id);
    try {
      const cleanName = (student.full_name || "student").replace(/\s+/g, "_");
      const filename = `${student.student_id}_${cleanName}.png`;

      await downloadStudentPhoto(student.processed_photo, filename);
      setDownloaded((prev) => new Set(prev).add(student.id));
    } catch (err) {
      console.error(err);
      alert(`Failed to download ID card photo for ${student.full_name}`);
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Search Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Users size={14} className="text-gray-400" />
          <span className="text-[13px] font-semibold text-gray-900">Students</span>
          <span className="text-[11px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full font-medium">
            {filteredStudents.length}
          </span>
        </div>
        <div className="relative w-56">
          <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search students…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 placeholder:text-gray-400 transition-all"
          />
        </div>
      </div>

      {/* Table Headers */}
      <div className="grid grid-cols-[120px_1fr_100px_140px_80px_52px] gap-3 px-5 py-2.5 bg-gray-50 border-b border-gray-100">
        {["Student ID", "Full Name", "Grade", "Status", "ID Card", ""].map((h) => (
          <div key={h} className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            {h}
          </div>
        ))}
      </div>

      {/* Table Body */}
      <div className="divide-y divide-gray-50">
        {filteredStudents.length === 0 && (
          <div className="py-12 text-center text-sm text-gray-400">No students found</div>
        )}

        {filteredStudents.map((student) => {
          const sCfg = PHOTO_STATUS_CONFIG[student.photo_status] || PHOTO_STATUS_CONFIG.PENDING;
          const isProcessed = student.photo_status === "PROCESSED";
          const isManual = student.photo_status === "MANUAL_REVIEW";
          const isDownloading = downloadingId === student.id;
          const isDownloaded = downloaded.has(student.id);

          return (
            <div
              key={student.id}
              className={cn(
                "grid grid-cols-[120px_1fr_100px_140px_80px_52px] gap-3 px-5 py-3 items-center transition-colors",
                isManual ? "bg-amber-50/40 hover:bg-amber-50/80" : "hover:bg-gray-50/70"
              )}
            >
              {/* Student ID */}
              <div className="text-[12px] font-mono text-blue-600 font-medium truncate">
                {student.student_id}
              </div>

              {/* Full Name & Section */}
              <div className="min-w-0">
                <div className="text-[13px] font-semibold text-gray-900 truncate">
                  {student.full_name}
                </div>
                {student.section && <div className="text-[11px] text-gray-400">{student.section}</div>}
              </div>

              {/* Grade Level */}
              <div className="text-[12px] text-gray-600 font-medium truncate">{student.grade_level}</div>

              {/* Photo Status Badge */}
              <div className="flex flex-col gap-1 min-w-0">
                <span className={cn("inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full border w-fit", sCfg.color, sCfg.bg)}>
                  <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", sCfg.dot)} />
                  {sCfg.label}
                </span>
                {isManual && student.fail_reason && (
                  <span className="text-[10px] text-amber-600 font-medium flex items-center gap-1">
                    <Info size={9} className="shrink-0" />
                    {FAIL_REASON_LABELS[student.fail_reason] || student.fail_reason}
                  </span>
                )}
              </div>

              {/* Mini Card Preview */}
              <div className="flex items-center">
                {isProcessed ? (
                  <MiniCard processedPhoto={student.processed_photo} fullName={student.full_name} hue={student.hue} />
                ) : (
                  <div className="w-16 h-10 rounded border border-dashed border-gray-200 bg-gray-50 flex items-center justify-center">
                    <FileImage size={14} className="text-gray-300" />
                  </div>
                )}
              </div>

              {/* Individual Download Action */}
              <div className="flex items-center justify-center">
                {isProcessed && student.processed_photo && (
                  <button
                    disabled={isDownloading}
                    onClick={() => handleDownloadSingle(student)}
                    title="Download as PNG"
                    className={cn(
                      "w-8 h-8 flex items-center justify-center rounded-lg transition-all border",
                      isDownloaded
                        ? "bg-emerald-50 border-emerald-200 text-emerald-500"
                        : "bg-gray-50 border-gray-200 text-gray-400 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600",
                      isDownloading && "opacity-50 cursor-wait"
                    )}
                  >
                    {isDownloading ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : isDownloaded ? (
                      <CheckCircle2 size={13} />
                    ) : (
                      <ArrowDownToLine size={13} />
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}