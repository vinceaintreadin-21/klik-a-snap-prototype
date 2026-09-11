import { ChevronLeft, AlertTriangle, MessageSquare, Crop as CropIcon, Upload, Check, Loader2 } from "lucide-react";
import { cn } from "../../lib/utils";
import { useRevisionQueue } from "../../hooks/useRevisionQueue";
import RevisionCropOverlay from "./RevisionCropOverlay";
import { HUES } from "./StatusConfig";
import type { OperatorOrder } from "./proofingTypes";

interface RevisionEditorProps {
    order: OperatorOrder;
    onBack: () => void;
}

export default function RevisionEditor({ order, onBack }: RevisionEditorProps) {
    const {
        loading,
        students,
        current,
        resolvedIds,
        resolvedCount,
        mode,
        setMode,
        crop,
        setCrop,
        submitting,
        fileRef,
        resetLocal,
        applyCrop,
        replacePhoto,
    } = useRevisionQueue(order.id);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (file) replacePhoto(file);
    };

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center bg-[#0f1117]">
                <Loader2 size={24} className="text-blue-400 animate-spin" />
            </div>
        );
    }

    if (!current) {
        return (
            <div className="h-full flex flex-col items-center justify-center gap-4 bg-[#0f1117] text-white">
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                    <Check size={28} className="text-emerald-400" />
                </div>
                <div className="text-lg font-semibold">All revisions resolved</div>
                <button
                    onClick={onBack}
                    className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-sm font-medium transition-colors"
                >
                    Back to orders
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full overflow-hidden">
            <header className="flex items-center gap-3 px-5 py-3 bg-[#16181f] border-b border-white/8 shrink-0">
                <button
                    onClick={onBack}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-white/50 hover:text-white/90 hover:bg-white/10 transition-colors shrink-0"
                >
                    <ChevronLeft size={18} />
                </button>
                <div>
                    <h1 className="text-sm font-semibold text-white leading-none">Revision Queue</h1>
                    <p className="text-[10px] text-white/40 mt-0.5">{order.school_name}</p>
                </div>
                <div className="ml-auto bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-[11px] text-white/60">
                    <span className="font-bold text-white">{resolvedCount}</span>/{students.length} resolved
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden">
                {/* Photo */}
                <div className="flex-1 bg-[#0f1117] flex flex-col overflow-hidden">
                    <div className="flex-1 flex items-center justify-center relative select-none p-6">
                        <div className="relative overflow-hidden rounded-sm shadow-2xl" style={{ width: 224, height: 288 }}>
                            {current.original_photo_url ? (
                                <img src={current.original_photo_url} alt={current.full_name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gray-800 text-white/30 text-xs">
                                    No photo
                                </div>
                            )}
                            {mode === "crop" && <RevisionCropOverlay crop={crop} onChange={setCrop} />}
                        </div>
                        {mode === "crop" && (
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white/60 text-[10px] font-mono px-3 py-1 rounded-lg border border-white/10">
                                Crop: {Math.round(crop.w)}% × {Math.round(crop.h)}% at ({Math.round(crop.x)}%, {Math.round(crop.y)}%)
                            </div>
                        )}
                    </div>
                </div>

                {/* Right panel */}
                <div className="w-[300px] bg-white border-l border-gray-100 flex flex-col overflow-hidden shrink-0">
                    <div className="px-5 pt-5 pb-3 border-b border-gray-100">
                        <div className="flex items-center gap-2 mb-1">
                            <AlertTriangle size={14} className="text-red-500" />
                            <span className="text-[11px] font-bold text-gray-900 uppercase tracking-widest">Flagged for Revision</span>
                        </div>
                        <h3 className="text-sm font-semibold text-gray-900">{current.full_name}</h3>
                        <p className="text-[11px] text-gray-400">
                            {current.grade_level} · {current.student_id}
                        </p>
                    </div>

                    <div className="px-5 py-4 flex-1 overflow-y-auto">
                        <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-start gap-2 mb-4">
                            <MessageSquare size={12} className="text-red-400 mt-0.5 shrink-0" />
                            <div>
                                <div className="text-[10px] font-bold text-red-500 uppercase tracking-widest mb-1">Institution note</div>
                                <p className="text-[12px] text-red-700 leading-snug">{current.fail_reason || "No note provided"}</p>
                            </div>
                        </div>

                        {mode === "view" ? (
                            <div className="space-y-2">
                                <button
                                    onClick={() => setMode("crop")}
                                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 text-gray-700 hover:bg-gray-50 transition-all"
                                >
                                    <CropIcon size={14} />
                                    Re-Crop
                                </button>
                                <button
                                    onClick={() => fileRef.current?.click()}
                                    disabled={submitting}
                                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 text-gray-700 hover:bg-gray-50 transition-all disabled:opacity-60"
                                >
                                    {submitting ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                                    Replace Photo
                                </button>
                                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <p className="text-[12px] text-gray-500 leading-snug">
                                    Drag the crop box corners to frame the ID card correctly, then apply.
                                </p>
                                <button
                                    onClick={applyCrop}
                                    disabled={submitting}
                                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-200 transition-all disabled:opacity-60"
                                >
                                    {submitting ? <Loader2 size={14} className="animate-spin" /> : <Check size={15} />}
                                    Apply Crop
                                </button>
                                <button
                                    onClick={resetLocal}
                                    disabled={submitting}
                                    className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all disabled:opacity-60"
                                >
                                    Cancel
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Filmstrip */}
            <div className="h-[72px] bg-[#0a0c10] border-t border-white/8 flex items-center gap-1.5 px-4 overflow-x-auto shrink-0">
                {students.map((s, i) => {
                    const done = resolvedIds.has(s.id);
                    return (
                        <div
                            key={s.id}
                            className={cn(
                                "relative w-11 h-[52px] rounded overflow-hidden shrink-0 border-2 transition-all",
                                s.id === current.id ? "border-blue-400 scale-110" : "border-transparent opacity-50",
                            )}
                        >
                            {s.original_photo_url ? (
                                <img src={s.original_photo_url} alt={s.full_name} className="w-full h-full object-cover" />
                            ) : (
                                <div
                                    className="w-full h-full"
                                    style={{ background: `linear-gradient(160deg, hsl(${HUES[i % HUES.length]},35%,32%), hsl(${HUES[i % HUES.length]},45%,22%))` }}
                                />
                            )}
                            <div
                                className={cn(
                                    "absolute top-1 right-1 w-2 h-2 rounded-full border border-black/30",
                                    done ? "bg-emerald-400" : "bg-gray-500",
                                )}
                            />
                        </div>
                    );
                })}
            </div>
        </div>
    );
}