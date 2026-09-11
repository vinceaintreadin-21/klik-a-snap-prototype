import { useCallback, useEffect, useRef } from "react";
import { Move } from "lucide-react";
import { cn } from "../../lib/utils";
import type { CropBox } from "./proofingTypes";

interface RevisionCropOverlayProps {
    crop: CropBox;
    onChange: (c: CropBox) => void
}

export default function RevisionCropOverlay({crop, onChange}: RevisionCropOverlayProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const dragRef = useRef<{ mode: "move" | "br" | "tr" | "bl" | "tl"; sx: number; sy: number; sc: CropBox } | null>(null);
    const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

    const onMouseMove = useCallback((e: MouseEvent) => {
        if (!dragRef.current || !containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const dx = ((e.clientX - dragRef.current.sx) / rect.width) * 100;
        const dy = ((e.clientY - dragRef.current.sy) / rect.height) * 100;
        const sc = dragRef.current.sc;
        const MIN = 15;

        if (dragRef.current.mode === "move") {
            onChange({ ...sc, x: clamp(sc.x + dx, 0, 100 - sc.w), y: clamp(sc.y + dy, 0, 100 - sc.h) });
        } else if (dragRef.current.mode === "br") {
            onChange({ ...sc, w: clamp(sc.w + dx, MIN, 100 - sc.x), h: clamp(sc.h + dy, MIN, 100 - sc.y) });
        } else if (dragRef.current.mode === "tr") {
            const newH = clamp(sc.h - dy, MIN, sc.y + sc.h);
            onChange({ ...sc, y: clamp(sc.y + dy, 0, sc.y + sc.h - MIN), w: clamp(sc.w + dx, MIN, 100 - sc.x), h: newH });
        } else if (dragRef.current.mode === "bl") {
            const newW = clamp(sc.w - dx, MIN, sc.x + sc.w);
            onChange({ ...sc, x: clamp(sc.x + dx, 0, sc.x + sc.w - MIN), w: newW, h: clamp(sc.h + dy, MIN, 100 - sc.y) });
        } else if (dragRef.current.mode === "tl") {
            const newW = clamp(sc.w - dx, MIN, sc.x + sc.w);
            const newH = clamp(sc.h - dy, MIN, sc.y + sc.h);
            onChange({ x: clamp(sc.x + dx, 0, sc.x + sc.w - MIN), y: clamp(sc.y + dy, 0, sc.y + sc.h - MIN), w: newW, h: newH });
        }

    }, [onChange])

    const onMouseUp = useCallback(() => { dragRef.current = null; }, []);

    useEffect(() => {
        window.addEventListener("mousemove", onMouseMove);
        window.addEventListener("mouseup", onMouseUp);
        return () => {
            window.removeEventListener("mousemove", onMouseMove);
            window.removeEventListener("mouseup", onMouseUp);
        };
    }, [onMouseMove, onMouseUp]);

    type DragMode = "move" | "br" | "tr" | "bl" | "tl";

    const startDrag = (mode: DragMode, e: React.MouseEvent) => {
        e.stopPropagation();
        dragRef.current = { mode, sx: e.clientX, sy: e.clientY, sc: { ...crop } };
    };

    const handle = "absolute w-3 h-3 bg-white border-2 border-blue-500 rounded-sm z-20";

    return (
        <div ref={containerRef} className="absolute inset-0 z-10">
            <div
                className="absolute inset-0 bg-black/50 pointer-events-none"
                style={{
                clipPath: `polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% ${crop.y}%, ${crop.x}% ${crop.y}%, ${crop.x}% ${crop.y + crop.h}%, ${crop.x + crop.w}% ${crop.y + crop.h}%, ${crop.x + crop.w}% ${crop.y}%, 0% ${crop.y}%)`,
                }}
            />
            <div
                className="absolute border-2 border-white/80 cursor-move"
                style={{ left: `${crop.x}%`, top: `${crop.y}%`, width: `${crop.w}%`, height: `${crop.h}%` }}
                onMouseDown={e => startDrag("move", e)}
            >
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-1/3 left-0 right-0 h-px bg-white/20" />
                    <div className="absolute top-2/3 left-0 right-0 h-px bg-white/20" />
                    <div className="absolute left-1/3 top-0 bottom-0 w-px bg-white/20" />
                    <div className="absolute left-2/3 top-0 bottom-0 w-px bg-white/20" />
                </div>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <Move size={14} className="text-white/40" />
                </div>
            </div>
            <div className={cn(handle, "cursor-nw-resize")} style={{ left: `${crop.x}%`, top: `${crop.y}%`, transform: "translate(-50%,-50%)" }} onMouseDown={e => startDrag("tl", e)} />
            <div className={cn(handle, "cursor-ne-resize")} style={{ left: `${crop.x + crop.w}%`, top: `${crop.y}%`, transform: "translate(-50%,-50%)" }} onMouseDown={e => startDrag("tr", e)} />
            <div className={cn(handle, "cursor-sw-resize")} style={{ left: `${crop.x}%`, top: `${crop.y + crop.h}%`, transform: "translate(-50%,-50%)" }} onMouseDown={e => startDrag("bl", e)} />
            <div className={cn(handle, "cursor-se-resize")} style={{ left: `${crop.x + crop.w}%`, top: `${crop.y + crop.h}%`, transform: "translate(-50%,-50%)" }} onMouseDown={e => startDrag("br", e)} />
        </div>
    );
}