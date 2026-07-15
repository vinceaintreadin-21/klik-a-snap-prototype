import { useState } from 'react'
import { useStudentsForOrder, useManualLinkPhoto } from '../hooks/useUploadPhotos'

interface Props {
    order: { id: number; school_name: string; batch_name: string }
    onClose: () => void
    onSuccess: () => void
}

const FAIL_REASON_LABELS: Record<string, string> = {
    no_qr: 'No QR code detected',
    qr_not_found: 'QR not matched to any student',
    no_face: 'No face detected',
    no_layout: 'No layout configured',
    error: 'Processing error',
    revision_requested: 'Revision requested',
}

const ManualReviewQueueModal = ({ order, onClose, onSuccess }: Props) => {
    const { students, loading, refetch } = useStudentsForOrder(order.id)
    const { linkPhoto, loading: linking, error: linkError } = useManualLinkPhoto()
    const [linkingId, setLinkingId] = useState<number | null>(null)
    const [linkedIds, setLinkedIds] = useState<Set<number>>(new Set())

    // MANUAL_REVIEW = AI tried but failed; PENDING with no original_photo_url = no photo submitted at all
    const flagged = students.filter(
        s => !linkedIds.has(s.id) && (
            s.photo_status === 'MANUAL_REVIEW' ||
            (s.photo_status === 'PENDING' && !s.original_photo_url)
        )
    )

    const handleLink = async (studentDbId: number, file: File) => {
        const result = await linkPhoto(order.id, studentDbId, file)
        if (result) {
            setLinkingId(null)
            // Optimistically remove from list immediately for instant feedback
            setLinkedIds(prev => new Set(prev).add(studentDbId))
            refetch()
            onSuccess()
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[85vh] flex flex-col">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800">Needs Review</h3>
                        <p className="text-xs text-gray-400">{order.school_name} — {order.batch_name}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
                </div>

                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
                    {loading ? (
                        <p className="text-sm text-gray-400">Loading...</p>
                    ) : flagged.length === 0 ? (
                        <p className="text-sm text-gray-400">No students need review.</p>
                    ) : (
                        flagged.map(student => {
                            const isNoPhoto = student.photo_status === 'PENDING' && !student.original_photo_url
                            const failLabel = isNoPhoto
                                ? 'No photo submitted'
                                : (FAIL_REASON_LABELS[student.fail_reason] ?? 'Failed — reason unknown')

                            return (
                                <div key={student.id} className="border border-red-100 bg-red-50/50 rounded-lg px-4 py-3">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-800">{student.full_name}</p>
                                            <p className="text-xs text-gray-400">{student.student_id} • {student.grade_level}</p>
                                            <p className="text-xs text-red-400 mt-0.5">{failLabel}</p>
                                        </div>
                                        <button
                                            onClick={() => setLinkingId(linkingId === student.id ? null : student.id)}
                                            className="text-xs text-indigo-600 hover:underline"
                                        >
                                            Link Photo
                                        </button>
                                    </div>
                                    {linkingId === student.id && (
                                        <div className="mt-2">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="text-xs"
                                                onChange={async (e) => {
                                                    if (e.target.files?.[0]) await handleLink(student.id, e.target.files[0])
                                                }}
                                            />
                                            {linking && <p className="text-xs text-gray-400 mt-1">Uploading...</p>}
                                            {linkError && <p className="text-xs text-red-500 mt-1">{linkError}</p>}
                                        </div>
                                    )}
                                </div>
                            )
                        })
                    )}
                </div>

                <div className="px-6 py-4 border-t border-gray-100 flex justify-end">
                    <button onClick={onClose} className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition">
                        Close
                    </button>
                </div>
            </div>
        </div>
    )
}

export default ManualReviewQueueModal