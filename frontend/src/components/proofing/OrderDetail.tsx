/**
 * OrderDetail — per-order proofing workspace.
 * Visual design: QUEUEBITS_UI/ProofingView.tsx → OrderDetail + CardThumb
 * Data: real API via GET /orders/{id}/students/
 */

import { useState, useMemo, useEffect } from "react";
import {
    ChevronLeft, Search, Flag, ArrowRight, AlertTriangle,
    FileCheck, Clock, Printer, CheckCircle2, Users, Calendar,
    Lock, Loader2,
} from "lucide-react";
import { cn } from "../../lib/utils";
import api from "../../utils/api";
import StageBar from "./StageBar";
import ProofingLightbox from "./ProofingLightbox";
import { STATUS_CONFIG } from "./StatusConfig";
import type { OperatorOrder, OperatorOrderStatus } from "./proofingTypes";

// ─── Types ────────────────────────────────────────────────────────────────────

interface DetailStudent {
    id: number;
    student_id: string;
    full_name: string;
    grade_level: string;
    section?: string;
    photo_status: string;
    processed_photo_url: string | null;
    is_approved: boolean;
    fail_reason: string;
    flagged?: boolean;
}

// ─── Card thumbnail (QUEUEBITS CardThumb) ────────────────────────────────────

function CardThumb({
    student,
    canFlag,
    onToggleFlag,
    onImageClick,
}: {
    student: DetailStudent;
    canFlag: boolean;
    onToggleFlag: () => void;
    onImageClick: (url: string) => void;
}) {
    const flagged = !!student.flagged;
    const hasImage = !!student.processed_photo_url;

    return (
        <div className={cn(
            "group relative rounded-xl overflow-visible border-2 transition-all duration-150 flex flex-col bg-white",
            flagged ? "border-red-400 shadow-sm shadow-red-100" : "border-gray-100 hover:border-gray-200",
        )}>
            {/* ID card image */}
            <div
                className={cn(
                    "relative bg-gray-100 rounded-t-xl overflow-hidden",
                    "aspect-[1.586/1]",
                    hasImage ? "cursor-zoom-in" : "",
                )}
                onClick={() => hasImage && onImageClick(student.processed_photo_url!)}
            >
                {hasImage ? (
                    <img
                        src={student.processed_photo_url!}
                        alt={student.full_name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                    />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-1 p-2">
                        <span className="text-lg">⚠️</span>
                        <p className="text-[10px] text-center text-gray-400">
                            {student.fail_reason || "Not processed"}
                        </p>
                    </div>
                )}
                {flagged && (
                    <div className="absolute inset-0 bg-red-500/10 flex items-center justify-center">
                        <div className="bg-red-500 rounded-full p-1">
                            <Flag size={10} className="text-white fill-white" />
                        </div>
                    </div>
                )}
            </div>

            {/* Label */}
            <div className="px-2.5 py-2 bg-white border-t border-gray-50 flex items-center justify-between gap-1">
                <div className="min-w-0">
                    <div className="text-[11px] font-semibold text-gray-800 truncate leading-none">
                        {student.full_name}
                    </div>
                    <div className="text-[10px] text-gray-400 mt-0.5">
                        {student.grade_level}{student.section ? ` · ${student.section}` : ""}
                    </div>
                </div>
                {canFlag && (
                    <button
                        onClick={e => { e.stopPropagation(); onToggleFlag(); }}
                        className={cn(
                            "shrink-0 w-6 h-6 rounded-lg flex items-center justify-center transition-all",
                            flagged
                                ? "bg-red-100 text-red-500 hover:bg-red-200"
                                : "bg-gray-100 text-gray-400 hover:bg-red-50 hover:text-red-400 opacity-0 group-hover:opacity-100",
                        )}
                    >
                        <Flag size={10} className={flagged ? "fill-red-400" : ""} />
                    </button>
                )}
            </div>
        </div>
    );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
    order: OperatorOrder;
    onBack: () => void;
    onOpenRevisions: () => void;
}

export default function OrderDetail({ order, onBack, onOpenRevisions }: Props) {
    const [students, setStudents] = useState<DetailStudent[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [submitted, setSubmitted] = useState(false);

    const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Per-student local state
    const [flaggedIds, setFlaggedIds] = useState<Set<number>>(new Set());
    const [reviewedIds, setReviewedIds] = useState<Set<number>>(new Set());

    const status = order.status as OperatorOrderStatus;
    const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG["PROOFING"];
    const canFlag = status === "PROOFING";

    // ── Load students ──────────────────────────────────────────────────────────

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        api.get(`/orders/${order.id}/students/`)
            .then(res => {
                if (cancelled) return;
                setStudents(res.data);
                // Pre-populate reviewed from is_approved / processed
                const preReviewed = new Set<number>(
                    (res.data as DetailStudent[])
                        .filter(s => s.is_approved || s.photo_status === "PROCESSED")
                        .map(s => s.id),
                );
                setReviewedIds(preReviewed);
            })
            .catch(() => setError("Failed to load students"))
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [order.id]);

    // ── Derived counts ─────────────────────────────────────────────────────────

    const flaggedCount = flaggedIds.size;
    const reviewedCount = reviewedIds.size;
    const allReviewed = reviewedCount >= students.filter(s => s.photo_status === "PROCESSED").length
        && students.filter(s => s.photo_status === "PROCESSED").length > 0;
    const canSubmit = status === "PROOFING" && flaggedCount === 0 && allReviewed;

    const hasRevisionStudents = students.some(
        s => s.photo_status === "MANUAL_REVIEW" && s.fail_reason === "revision_requested",
    );

    // ── Filtered grid ──────────────────────────────────────────────────────────

    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        if (!q) return students;
        return students.filter(
            s => s.full_name.toLowerCase().includes(q) ||
                s.student_id.toLowerCase().includes(q) ||
                (s.grade_level ?? "").toLowerCase().includes(q),
        );
    }, [students, search]);

    // ── Actions ────────────────────────────────────────────────────────────────

    const toggleFlag = (id: number) => {
        setFlaggedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
        setReviewedIds(prev => new Set([...prev, id]));
    };

    const markAllReviewed = () => {
        setReviewedIds(new Set(students.map(s => s.id)));
    };

    const handleSubmitForProofing = async () => {
        // For the operator's "Ready for Institution Proofing" action,
        // we call POST /orders/{id}/approve/ which moves to APPROVED.
        setSubmitting(true);
        setError(null);
        try {
            await api.post(`/orders/${order.id}/approve/`);
            setSubmitted(true); 
        } catch (err: any) {
            setError(err.response?.data?.error || "Failed to submit for proofing");
        } finally {
            setSubmitting(false);
        }
    };

    const processedCount = students.filter(s => s.photo_status === "PROCESSED").length;

    return (
        <div className="flex flex-col h-full bg-[#F7F8FA] overflow-hidden">

            {/* Sticky header */}
            <header className="bg-white border-b border-gray-100 shadow-sm shrink-0">
                <div className="flex items-center gap-3 px-6 py-3">
                    <button
                        onClick={onBack}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 transition-colors shrink-0"
                    >
                        <ChevronLeft size={18} />
                    </button>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h1 className="text-[15px] font-semibold text-gray-900">{order.school_name}</h1>
                            <span className="text-[11px] font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                                #{order.id}
                            </span>
                            <span className={cn(
                                "flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border",
                                cfg.color, cfg.bg,
                            )}>
                                <cfg.icon size={10} />{cfg.label}
                            </span>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-gray-400 mt-0.5">
                            <span className="flex items-center gap-1"><Users size={10} />{order.student_count} IDs</span>
                            {order.deadline && (
                                <span className="flex items-center gap-1">
                                    <Calendar size={10} />
                                    Due {new Date(order.deadline).toLocaleDateString()}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* Stage bar */}
            <div className="bg-white border-b border-gray-100 px-6 py-3 shrink-0">
                <StageBar status={status} />
            </div>

            {/* Revision banner */}
            {hasRevisionStudents && (
                <div className="flex items-center gap-4 px-6 py-3.5 bg-red-50 border-b border-red-100 shrink-0">
                    <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                        <AlertTriangle size={17} className="text-red-600" />
                    </div>
                    <div className="flex-1">
                        <div className="text-[13px] font-semibold text-red-900">
                            Revision requested by institution
                        </div>
                        <p className="text-[12px] text-red-600 mt-0.5">
                            Fix the flagged cards and resubmit.
                        </p>
                    </div>
                    <button
                        onClick={onOpenRevisions}
                        className="shrink-0 flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all"
                    >
                        Open Revision Queue <ArrowRight size={14} />
                    </button>
                </div>
            )}

            {/* Main: grid + action panel */}
            <div className="flex flex-1 overflow-hidden">

                {/* Card grid */}
                <div className="flex-1 flex flex-col overflow-hidden">

                    {/* Toolbar */}
                    <div className="flex items-center gap-3 px-6 py-3 bg-white border-b border-gray-100 shrink-0">
                        <div className="relative flex-1 max-w-xs">
                            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            <input
                                type="text"
                                placeholder="Search student..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="w-full pl-8 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 placeholder:text-gray-400 transition-all"
                            />
                        </div>
                        <div className="flex items-center gap-2 text-[12px] text-gray-500 ml-auto">
                            {flaggedCount > 0 && (
                                <span className="flex items-center gap-1 text-red-600 font-semibold bg-red-50 border border-red-100 px-2 py-1 rounded-lg">
                                    <Flag size={11} className="fill-red-400" />{flaggedCount} flagged
                                </span>
                            )}
                            <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-lg font-medium">
                                {reviewedCount}/{processedCount} reviewed
                            </span>
                            {canFlag && reviewedCount < processedCount && (
                                <button
                                    onClick={markAllReviewed}
                                    className="text-blue-600 hover:text-blue-800 px-2 py-1 rounded-lg hover:bg-blue-50 transition-colors font-medium"
                                >
                                    Mark all reviewed
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Grid */}
                    <div className="flex-1 overflow-y-auto p-6">
                        {loading ? (
                            <div className="flex items-center justify-center py-20">
                                <Loader2 size={24} className="text-blue-400 animate-spin" />
                            </div>
                        ) : error ? (
                            <div className="text-center py-20 text-sm text-red-500">{error}</div>
                        ) : (
                            <>
                                {flaggedCount > 0 && canFlag && (
                                    <div className="flex items-start gap-3 p-3.5 mb-5 bg-red-50 border border-red-100 rounded-xl">
                                        <AlertTriangle size={15} className="text-red-500 shrink-0 mt-0.5" />
                                        <div>
                                            <div className="text-[13px] font-semibold text-red-800">
                                                {flaggedCount} card{flaggedCount > 1 ? "s" : ""} flagged
                                            </div>
                                            <p className="text-[12px] text-red-600 mt-0.5">
                                                Resolve all flags before submitting.
                                            </p>
                                        </div>
                                    </div>
                                )}
                                <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-3">
                                    {filtered.map(s => (
                                        <CardThumb
                                            key={s.id}
                                            student={{ ...s, flagged: flaggedIds.has(s.id) }}
                                            canFlag={canFlag}
                                            onToggleFlag={() => toggleFlag(s.id)}
                                            onImageClick={setLightboxUrl}
                                        />
                                    ))}
                                </div>
                                {filtered.length === 0 && (
                                    <div className="text-center py-12 text-sm text-gray-400">
                                        No students match &ldquo;{search}&rdquo;
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* Action panel */}
                <div className="w-[280px] border-l border-gray-100 bg-white flex flex-col shrink-0 overflow-hidden">

                    {/* PROOFING — operator review */}
                    {status === "PROOFING" && (
                        <>
                            <div className="px-5 pt-5 pb-4 border-b border-gray-100 flex-1">
                            <div className="flex items-center gap-2 mb-3">
                                <FileCheck size={15} className="text-blue-500" />
                                <span className="text-[12px] font-bold text-gray-900 uppercase tracking-widest">
                                Operator Review
                                </span>
                            </div>
                            <p className="text-[12px] text-gray-500 leading-relaxed mb-4">
                                Review every ID card. Flag any that need correction, then submit for institution approval.
                            </p>
                            <div className="space-y-2">
                                {[
                                { label: "Total IDs",  value: String(students.length),  color: "text-gray-900"   },
                                { label: "Processed",  value: String(processedCount),   color: "text-emerald-600"},
                                { label: "Reviewed",   value: String(reviewedCount),    color: "text-blue-600"   },
                                { label: "Flagged",    value: String(flaggedCount),      color: flaggedCount > 0 ? "text-red-600" : "text-gray-400" },
                                ].map(row => (
                                <div key={row.label} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                                    <span className="text-[12px] text-gray-500">{row.label}</span>
                                    <span className={cn("text-[13px] font-bold", row.color)}>{row.value}</span>
                                </div>
                                ))}
                            </div>
                            </div>

                            <div className="p-5 space-y-2">
                            {/* Already submitted — waiting for institution */}
                            {submitting === false && canSubmit === false && reviewedCount >= processedCount && processedCount > 0 && flaggedCount === 0 ? (
                                /* This branch won't actually fire since canSubmit would be true — kept for clarity */
                                null
                            ) : null}

                            {/* Submitted state — button disabled, waiting message */}
                            {submitting === true ? (
                                <div className="w-full flex flex-col items-center gap-2 py-3 rounded-xl bg-blue-50 border border-blue-100">
                                <div className="w-5 h-5 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin" />
                                <span className="text-[12px] font-semibold text-blue-700">Submitting…</span>
                                </div>
                            ) : null}

                            {/* Blocker hints */}
                            {!submitting && !allReviewed && processedCount > 0 && (
                                <p className="text-[11px] text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 flex items-center gap-1.5">
                                <AlertTriangle size={11} />
                                Review all {processedCount - reviewedCount} pending card{processedCount - reviewedCount !== 1 ? "s" : ""} first
                                </p>
                            )}
                            {!submitting && flaggedCount > 0 && (
                                <p className="text-[11px] text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 flex items-center gap-1.5">
                                <Flag size={11} />
                                Resolve {flaggedCount} flagged card{flaggedCount > 1 ? "s" : ""} first
                                </p>
                            )}
                            {error && (
                                <p className="text-[11px] text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                                {error}
                                </p>
                            )}

                            {!submitting && (
                                <button
                                disabled={!canSubmit}
                                onClick={handleSubmitForProofing}
                                className={cn(
                                    "w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all",
                                    canSubmit
                                    ? "bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-200"
                                    : "bg-gray-100 text-gray-400 cursor-not-allowed",
                                )}
                                >
                                <ArrowRight size={14} />
                                Ready for Institution Proofing
                                </button>
                            )}

                            {/* After successful submission — button is replaced with waiting state */}
                            {submitted && (
                                <div className="w-full flex flex-col items-center gap-2 py-3 px-4 rounded-xl bg-amber-50 border border-amber-200">
                                <div className="flex items-center gap-2">
                                    <Clock size={14} className="text-amber-500" />
                                    <span className="text-[13px] font-semibold text-amber-800">Waiting for Institution</span>
                                </div>
                                <p className="text-[11px] text-amber-600 text-center leading-snug">
                                    Proof submitted. The institution will review and either approve or request revisions.
                                </p>
                                </div>
                            )}
                            </div>
                        </>
                    )}


                    {/* APPROVED — awaiting institution */}
                    {status === "APPROVED" && (
                        <>
                            <div className="px-5 pt-5 pb-4 border-b border-gray-100 flex-1">
                                <div className="flex items-center gap-2 mb-3">
                                    <Clock size={15} className="text-amber-500" />
                                    <span className="text-[12px] font-bold text-gray-900 uppercase tracking-widest">Awaiting Approval</span>
                                </div>
                                <p className="text-[12px] text-gray-500 leading-relaxed mb-4">
                                    Proof submitted to institution. Waiting for their sign-off before printing.
                                </p>
                                <div className="p-3 bg-gray-50 border border-gray-100 rounded-xl flex items-start gap-2">
                                    <Lock size={12} className="text-gray-400 mt-0.5 shrink-0" />
                                    <p className="text-[11px] text-gray-500 leading-snug">
                                        Printing is locked until institution approval is recorded.
                                    </p>
                                </div>
                            </div>
                            <div className="p-5">
                                <p className="text-[12px] text-gray-400 text-center py-4">
                                    Waiting for institution to approve via their portal.
                                </p>
                            </div>
                        </>
                    )}

                    {/* PRINTING */}
                    {status === "PRINTING" && (
                        <>
                            <div className="px-5 pt-5 pb-4 border-b border-gray-100 flex-1">
                                <div className="flex items-center gap-2 mb-3">
                                    <Printer size={15} className="text-purple-500" />
                                    <span className="text-[12px] font-bold text-gray-900 uppercase tracking-widest">Printing</span>
                                </div>
                                <p className="text-[12px] text-gray-500 leading-relaxed">
                                    Institution approval recorded. Order cleared to print.
                                </p>
                            </div>
                            <div className="p-5">
                                <div className="p-3 bg-purple-50 border border-purple-100 rounded-xl">
                                    <div className="flex items-center gap-1.5">
                                        <Printer size={12} className="text-purple-500" />
                                        <span className="text-[11px] font-bold text-purple-700 uppercase tracking-widest">In Print Queue</span>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {/* COMPLETED */}
                    {status === "COMPLETED" && (
                        <div className="px-5 pt-5 pb-4 flex-1 flex flex-col items-center justify-center text-center gap-3">
                            <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                                <CheckCircle2 size={26} className="text-emerald-500" />
                            </div>
                            <div>
                                <div className="text-sm font-semibold text-gray-900">Order Complete</div>
                                <div className="text-[12px] text-gray-400 mt-0.5">All ID cards delivered</div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <ProofingLightbox url={lightboxUrl} onClose={() => setLightboxUrl(null)} />
        </div>
    );
}
