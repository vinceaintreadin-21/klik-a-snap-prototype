import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import api from "../utils/api";
import { DEFAULT_CROP } from "../components/proofing/StatusConfig";
import type { CropBox, RevisionStudent } from "../components/proofing/proofingTypes";

export function useRevisionQueue(orderId: number) {
    const [loading, setLoading] = useState(true);
    const [students, setStudents] = useState<RevisionStudent[]>([]);
    const [resolvedIds, setResolvedIds] = useState<Set<number>>(new Set());
    const [mode, setMode] = useState<"view" | "crop">("view");
    const [crop, setCrop] = useState<CropBox>(DEFAULT_CROP);
    const [submitting, setSubmitting] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        let cancelled = false;
        setLoading(true)

        api.get(`/orders/${orderId}/students/`)
            .then(res => {
                if (cancelled) return;
                const flagged = (res.data as RevisionStudent[]).filter(
                    s => s.photo_status === "MANUAL_REVIEW" && s.fail_reason === "revision_requested"
                );
                setStudents(flagged)
            })
            .catch(() => toast.error("Failed to load flagged students"))
            .finally(() => {
                if (!cancelled) setLoading(false);
            })

        return () => {
            cancelled = true;
        };
    }, [orderId])

    const remaining = useMemo(() => students.filter(s => !resolvedIds.has(s.id)), [students, resolvedIds]);
    const current = remaining[0];
    const resolvedCount = resolvedIds.size;

    const resetLocal = useCallback(() => {
        setMode("view");
        setCrop(DEFAULT_CROP)
    }, [])

    const markResolved = useCallback(
        (id: number) => {
            setResolvedIds(prev => new Set([...prev, id]));
            resetLocal();
        },
        [resetLocal]
    )

    const applyCrop = useCallback(async () => {
        if (!current?.original_photo_url) {
            toast.error("No original photo available to crop");
            return;
        }
        setSubmitting(true);
        try {
            const img = new Image();
            img.src = current.original_photo_url;
            await new Promise<void>((resolve, reject) => {
                img.onload = () => resolve();
                img.onerror = () => reject(new Error("image load failed"));
            });
            const W = img.naturalWidth;
            const H = img.naturalHeight;

            const formData = new FormData();
            formData.append("crop_x", String(Math.round((crop.x / 100) * W)));
            formData.append("crop_y", String(Math.round((crop.y / 100) * H)));
            formData.append("crop_width", String(Math.round((crop.w / 100) * W)));
            formData.append("crop_height", String(Math.round((crop.h / 100) * H)));

            await api.post(`/orders/${orderId}/students/${current.id}/manual-crop/`, formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            toast.success(`Re-cropped ${current.full_name}`);
            markResolved(current.id);
        } catch (err: any) {
            toast.error(err?.response?.data?.error || "Re-crop failed");
        } finally {
            setSubmitting(false);
        }
    }, [current, crop, orderId, markResolved]);

    const replacePhoto = useCallback(
        async (file: File) => {
            if (!current) return;
            setSubmitting(true);
            try {
                const formData = new FormData();
                formData.append("student_id", String(current.id));
                formData.append("photo", file);

                await api.post(`/orders/${orderId}/students/manual-link/`, formData, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
                await api.post(`/students/${current.id}/process-linked/`);

                toast.success(`Photo replaced for ${current.full_name}`);
                markResolved(current.id);
            } catch (err: any) {
                toast.error(err?.response?.data?.error || "Replace failed");
            } finally {
                setSubmitting(false);
            }
        },
        [current, orderId, markResolved],
    );

    return {
        loading,
        students,
        current,
        remaining,
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
    };
}