import { useState } from "react";
import { ZoomIn, ZoomOut, RotateCcw, RotateCw, Maximize2, AlertTriangle, ScanFace } from "lucide-react";
import { cn } from "../../lib/utils";
import { CropOverlay } from "./CropOverlay";
import { type ReviewStudent, type CropBox, issueType, ISSUE_COLORS, ISSUE_LABELS } from "./types";

interface PhotoViewerProps {
  student: ReviewStudent
  hue: number
  cropEnabled?: boolean
  crop?: CropBox
  onCropChange?: (c: CropBox) => void
}

export function PhotoViewer({
  student,
  hue,
  cropEnabled,
  crop,
  onCropChange,
}: PhotoViewerProps) {
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const issue = issueType(student)

  const reset = () => { setZoom(1); setRotation(0) }

  return (
    <div className="flex-1 bg-[#0f1117] flex flex-col overflow-hidden">
      <div className="flex-1 flex items-center justify-center relative select-none p-6">
        <div className={cn(
          'absolute top-4 right-4 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold z-10',
          ISSUE_COLORS[issue],
        )}>
          <AlertTriangle size={11} />
          {ISSUE_LABELS[issue]}
        </div>

        <div className="relative overflow-hidden rounded-sm shadow-2xl" style={{ width: 224, height: 288 }}>
          {student.original_photo_url ? (
            <img
              src={student.original_photo_url}
              alt={student.full_name}
              className="w-full h-full object-cover transition-transform duration-150"
              style={{ transform: `scale(${zoom}) rotate(${rotation}deg)` }}
            />
          ) : (
            <div
              className="w-full h-full relative transition-transform duration-150"
              style={{ transform: `scale(${zoom}) rotate(${rotation}deg)` }}
            >
              <div
                className="w-full h-full"
                style={{ background: `linear-gradient(160deg, hsl(${hue},35%,32%), hsl(${hue},45%,22%))` }}
              />
              <svg viewBox="0 0 40 50" className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 opacity-20" fill="white">
                <circle cx="20" cy="13" r="10" />
                <ellipse cx="20" cy="44" rx="16" ry="14" />
              </svg>
              <div className="absolute top-2 left-2 bg-black/40 text-white/60 text-[9px] font-mono px-1.5 py-0.5 rounded">
                {student.student_id}
              </div>
            </div>
          )}

          {cropEnabled && crop && onCropChange && (
            <CropOverlay crop={crop} onChange={onCropChange} />
          )}

          {issue === 'no_face' && !cropEnabled && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/55">
              <div className="w-14 h-14 rounded-full bg-gray-800/80 border border-gray-600 flex items-center justify-center">
                <ScanFace size={26} className="text-gray-400" />
              </div>
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">No face found</span>
            </div>
          )}
        </div>

        {cropEnabled && crop && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white/60 text-[10px] font-mono px-3 py-1 rounded-lg border border-white/10">
            Crop: {Math.round(crop.w)}% × {Math.round(crop.h)}% at ({Math.round(crop.x)}%, {Math.round(crop.y)}%)
          </div>
        )}
      </div>

      <div className="flex items-center justify-center gap-2 py-3 border-t border-white/5">
        {[
          { Icon: ZoomIn, title: 'Zoom in', action: () => setZoom(z => Math.min(3, z + 0.25)) },
          { Icon: ZoomOut, title: 'Zoom out', action: () => setZoom(z => Math.max(0.5, z - 0.25)) },
          { Icon: RotateCcw, title: 'Rotate left', action: () => setRotation(r => r - 90) },
          { Icon: RotateCw, title: 'Rotate right', action: () => setRotation(r => r + 90) },
          { Icon: Maximize2, title: 'Fit to screen', action: reset },
        ].map(({ Icon, title, action }) => (
          <button key={title} title={title} onClick={action}
            className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/8 hover:bg-white/15 text-white/50 hover:text-white/90 transition-all">
            <Icon size={14} />
          </button>
        ))}
        {(zoom !== 1 || rotation !== 0) && (
          <span className="text-[10px] text-white/40 font-mono ml-1">
            {Math.round(zoom * 100)}% · {rotation}°
          </span>
        )}
      </div>
    </div>
  )
}