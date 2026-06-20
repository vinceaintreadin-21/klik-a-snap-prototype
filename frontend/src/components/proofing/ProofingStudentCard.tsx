import { useState } from "react";
import RevisionPopover from "./RevisionPopover";

export interface ProofStudent {
    id: number;
    student_id: string;
    full_name: string;
    grade_level: string;
    photo_status: 'PENDING' | 'PROCESSED' | 'MANUAL_REVIEW';
    processed_photo_url: string | null;
    is_approved: boolean;
    fail_reason: string;
}

interface ProofingStudentCardProps {
    student: ProofStudent;
    localApproved: boolean;
    localRevision: boolean;
    onApprove: (id: number) => void;
    onRevision: (id: number, reason: string) => void;
    onImageClick: (url: string) => void;
}

const ProofingStudentCard = ({
    student,
    localApproved,
    localRevision,
    onApprove,
    onRevision,
    onImageClick,
}: ProofingStudentCardProps) => {
    const [showPopover, setShowPopover] = useState(false)

    const handleRevisionConfirm = (reason: string) => {
        onRevision(student.id, reason);
        setShowPopover(false);
        
    };

    const hasImage = !!student.processed_photo_url;

    return (
        <div className={`
            relative bg-white rounded-xl border-2 overflow-visible flex flex-col transition-all
            ${localApproved  ? 'border-green-400 bg-green-50/30' :
                localRevision  ? 'border-amber-400 bg-amber-50/30' :
                'border-gray-200 hover:border-gray-300'}
            `}>

            {/* Status overlay on image */}
            {localApproved && (
                <div className="absolute top-2 right-2 z-10 bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-black shadow">
                ✓
                </div>
            )}
            {localRevision && (
                <div className="absolute top-2 right-2 z-10 bg-amber-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs shadow">
                ↩
                </div>
            )}

            {/* ID card image */}
            <div
                className={`relative bg-gray-100 aspect-[3/4] overflow-hidden rounded-t-xl ${
                hasImage ? 'cursor-zoom-in' : ''
                }`}
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
                <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-4">
                    <span className="text-3xl">⚠️</span>
                    <p className="text-xs text-center text-gray-500 font-medium">
                    {student.fail_reason || 'Photo not processed'}
                    </p>
                </div>
                )}
            </div>

            {/* Student info */}
            <div className="p-3 flex flex-col gap-2">
                <div>
                <p className="text-xs font-bold text-gray-900 truncate">{student.full_name}</p>
                <p className="text-xs text-gray-400">{student.student_id} · Gr. {student.grade_level}</p>
                </div>

                {/* Action buttons */}
                <div className="relative flex gap-1.5">
                <button
                    onClick={() => { onApprove(student.id); setShowPopover(false); }}
                    className={`flex-1 text-xs py-1.5 rounded-lg font-bold transition-colors ${
                    localApproved
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-green-50 hover:text-green-700'
                    }`}
                >
                    {localApproved ? '✓ Approved' : 'Approve'}
                </button>

                <button
                    onClick={() => setShowPopover(v => !v)}
                    className={`flex-1 text-xs py-1.5 rounded-lg font-bold transition-colors ${
                    localRevision
                        ? 'bg-amber-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-amber-50 hover:text-amber-700'
                    }`}
                >
                    {localRevision ? '↩ Revision' : 'Revise'}
                </button>

                {/* Revision popover */}
                {showPopover && (
                    <RevisionPopover
                    onConfirm={handleRevisionConfirm}
                    onCancel={() => setShowPopover(false)}
                    />
                )}
                </div>
            </div>
        </div>
    )
}

export default ProofingStudentCard