import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import toast from "react-hot-toast";
import api from "../../utils/api";
import ProofingGrid from "./ProofingGrid";
import ProofingHeader from "./ProofingHeader";
import ProofingLightbox from "./ProofingLightbox";
import type { ProofStudent } from "./ProofingStudentCard";

type ModalState = 'LOADING' | 'REVIEWING' | 'SUBMITTING';

interface ProofingModalProps {
    orderId: number;
    order: {school_name: string, batch_name: string, student_count: number}
    onClose: () => void;
    onApproved: (orderId: number) => void
} 

const ProofingModal = ({orderId, order, onClose, onApproved}: ProofingModalProps) => {
    const [modalState, setModalState] = useState<ModalState>('LOADING')
    const [students, setStudents] = useState<ProofStudent[]>([])
    const [localApproved, setLocalApproved] = useState<Set<number>>(new Set());
    const [localRevision, setLocalRevision] = useState<Set<number>>(new Set());
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const [revisionMap, setRevisionMap] = useState<Record<number, string>>({})

    useEffect(() => {
        const fetchStudents = async () => {
            try {
                const res = await api.get(`/orders/${orderId}/students/`)
                setStudents(res.data)

                const alreadyApproved = new Set<number>(
                    res.data.filter((s: ProofStudent) => s.is_approved).map((s: ProofStudent) => s.id)
                )

                const alreadyRevision = new Set<number>(
                    res.data
                        .filter((s: ProofStudent) => s.photo_status === 'MANUAL_REVIEW')
                        .map((s: ProofStudent) => s.id)
                )

                setLocalApproved(alreadyApproved)
                setLocalRevision(alreadyRevision)
                setModalState('REVIEWING')
            } catch {
                toast.error('Failed to load students')
                onClose()
            }
        }
        fetchStudents()
    }, [orderId])

    const handleApprove = useCallback((studentId: number) => {
        setLocalApproved(prev => {
            const next = new Set(prev)
            if (next.has(studentId)) {
                next.delete(studentId)
            } else {
                next.add(studentId)
            }
            return next
        })
        setLocalRevision(prev => {
            const next = new Set(prev);
            next.delete(studentId);
            return next;
        })
    }, [])

    const handleRevision = useCallback((studentId: number, reason: string) => {
        setLocalRevision(prev => new Set([...prev, studentId]))
        setRevisionMap(prev => ({ ...prev, [studentId]: reason }))

        setLocalApproved(prev => {
            const next = new Set(prev)
            next.delete(studentId)
            return next
        })
    }, [])

    const handleApproveAll = useCallback(async () => {
        setModalState('SUBMITTING')

        try {
            const revisionIds = Array.from(localRevision)
            await Promise.all(
                revisionIds.map(id => {
                    api.post(`/students/${id}/request-revision/`, {
                        reason: revisionMap[id] || 'revision_requested'
                    })
                })
            )

            await api.post(`/orders/${orderId}/approve/`)
            toast.success('Order approved successfully')
            onApproved(orderId)

        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Approval failed')
            setModalState('REVIEWING');
        }
    }, [orderId, localRevision, revisionMap, onApproved])

    const approvedCount = localApproved.size;
    const revisionCount = localRevision.size;

    return createPortal(
        <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col relative">

                {/* Loading state */}
                {modalState === 'LOADING' && (
                <div className="flex-1 flex flex-col items-center justify-center gap-4 py-20">
                    <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-500 rounded-full animate-spin" />
                    <p className="text-sm text-gray-500">Loading ID cards...</p>
                </div>
                )}

                {/* Reviewing state */}
                {(modalState === 'REVIEWING' || modalState === 'SUBMITTING') && (
                <>
                    <ProofingHeader
                    schoolName={order.school_name}
                    batchName={order.batch_name}
                    totalCount={students.length}
                    approvedCount={approvedCount}
                    revisionCount={revisionCount}
                    isSubmitting={modalState === 'SUBMITTING'}
                    onApproveAll={handleApproveAll}
                    onClose={onClose}
                    />

                    <ProofingGrid
                    students={students}
                    localApproved={localApproved}
                    localRevision={localRevision}
                    onApprove={handleApprove}
                    onRevision={handleRevision}
                    onImageClick={setPreviewUrl}
                    />
                </>
                )}
            </div>

        {/* Lightbox */}
        <ProofingLightbox
            url={previewUrl}
            onClose={() => setPreviewUrl(null)}
        />
        </div>,
        document.body
  );   
}

export default ProofingModal