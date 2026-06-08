import { useState, useRef } from 'react'
import { useBulkUpload, useStudentsForOrder, useManualLinkPhoto } from '../hooks/useUploadPhotos'
import { useManualCrop } from '../hooks/useManualCrop'

interface Props {
    order: { id: number; school_name: string; batch_name: string; student_count: number }
    onClose: () => void
    onSuccess: () => void
}

const statusBadge = (status: string, reason?: string) => {
    const styles: Record<string, string> = {
        PENDING: 'bg-gray-100 text-gray-600',
        PROCESSED: 'bg-green-100 text-green-600',
        MANUAL_REVIEW: 'bg-red-100 text-red-600',
    }
    const label = status === 'MANUAL_REVIEW' && reason ? `Review: ${reason}` : status
    return (
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] ?? 'bg-gray-100 text-gray-500'}`}>
            {label}
        </span>
    )
}

const UploadPhotosModal = ({ order, onClose, onSuccess }: Props) => {
    const [tab, setTab] = useState<'bulk' | 'manual'>('bulk')
    const [selectedFiles, setSelectedFiles] = useState<File[]>([])
    const [search, setSearch] = useState('')
    const [linkingStudentId, setLinkingStudentId] = useState<number | null>(null)
    const [showOnlyReview, setShowOnlyReview] = useState(false)

    // Inline Cropper Work states
    const [croppingStudent, setCroppingStudent] = useState<any | null>(null)
    const [cropBox, setCropBox] = useState({ x: 50, y: 50, width: 150, height: 180 })
    const [isDragging, setIsDragging] = useState(false)
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
    
    const imageRef = useRef<HTMLImageElement | null>(null)

    const { bulkUpload, loading: uploading, error: uploadError, uploadProgress, results } = useBulkUpload()
    const { students, loading: studentsLoading, refetch } = useStudentsForOrder(order.id)
    const { linkPhoto, loading: linking, error: linkError } = useManualLinkPhoto()
    const { submitCrop, loading: cropping, error: cropError } = useManualCrop()

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setSelectedFiles(prev => [...prev, ...Array.from(e.target.files!)])
        }
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'))
        setSelectedFiles(prev => [...prev, ...files])
    }

    const removeFile = (index: number) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index))
    }

    const handleBulkUpload = async () => {
        if (!selectedFiles.length) return
        await bulkUpload(order.id, selectedFiles)
    }

    const handleLinkPhoto = async (studentDbId: number, file: File) => {
        const result = await linkPhoto(order.id, studentDbId, file)
        if (result) {
            setLinkingStudentId(null)
            refetch()
        }
    }

    // --- Absolute Pixel Resolution Coordinate Scaler Transformer ---
    const handleExecuteManualCrop = async () => {
        if (!croppingStudent || !imageRef.current) return

        const img = imageRef.current
        // Calculate the ratio between the real pixel dimensions and the CSS container constraints
        const scaleX = img.naturalWidth / img.clientWidth
        const scaleY = img.naturalHeight / img.clientHeight

        const absoluteCropCoordinates = {
            x: Math.round(cropBox.x * scaleX),
            y: Math.round(cropBox.y * scaleY),
            width: Math.round(cropBox.width * scaleX),
            height: Math.round(cropBox.height * scaleY)
        }

        const response = await submitCrop(order.id, croppingStudent.id, absoluteCropCoordinates)
        if (response) {
            setCroppingStudent(null)
            refetch()
        }
    }

    // Inline box dragging handlers
    const onMouseDown = (e: React.MouseEvent) => {
        e.preventDefault()
        setIsDragging(true)
        setDragStart({ x: e.clientX - cropBox.x, y: e.clientY - cropBox.y })
    }

    const onMouseMove = (e: React.MouseEvent) => {
        if (!isDragging || !imageRef.current) return
        const rect = imageRef.current.getBoundingClientRect()
        
        let newX = e.clientX - dragStart.x
        let newY = e.clientY - dragStart.y

        // Boundary constraints checks
        newX = Math.max(0, Math.min(newX, rect.width - cropBox.width))
        newY = Math.max(0, Math.min(newY, rect.height - cropBox.height))

        setCropBox(prev => ({ ...prev, x: newX, y: newY }))
    }

    const filteredStudents = (students || []).filter(s => {
        const matchesSearch = s.full_name.toLowerCase().includes(search.toLowerCase()) ||
            s.student_id.toLowerCase().includes(search.toLowerCase())
        const matchesFilter = showOnlyReview ? s.photo_status === 'MANUAL_REVIEW' : true
        
        return matchesSearch && matchesFilter    
    })

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">

                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-800">Upload Photos</h3>
                            <p className="text-xs text-gray-400">{order.school_name} — {order.batch_name} • {order.student_count} students</p>
                        </div>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-2 mt-3">
                        {(['bulk', 'manual'] as const).map(t => (
                            <button
                                key={t}
                                onClick={() => { setTab(t); setCroppingStudent(null); }}
                                className={`px-4 py-1.5 text-xs font-medium rounded-lg transition ${
                                    tab === t ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                            >
                                {t === 'bulk' ? 'Bulk Upload' : 'Manual Link'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-6 py-4" onMouseUp={() => setIsDragging(false)}>

                    {/* --- Tab 1: Bulk Upload --- */}
                    {tab === 'bulk' && (
                        <div className="space-y-4">
                            {/* Drop zone */}
                            <div
                                onDrop={handleDrop}
                                onDragOver={e => e.preventDefault()}
                                className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-indigo-400 transition cursor-pointer"
                                onClick={() => document.getElementById('bulk-file-input')?.click()}
                            >
                                <p className="text-sm text-gray-500">Drag & drop photos here, or click to browse</p>
                                <p className="text-xs text-gray-400 mt-1">Each photo must contain the student's QR code for auto-matching</p>
                                <input
                                    id="bulk-file-input"
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleFileSelect}
                                />
                            </div>

                            {/* File list */}
                            {selectedFiles.length > 0 && (
                                <div className="space-y-1 max-h-48 overflow-y-auto">
                                    {selectedFiles.map((f, i) => (
                                        <div key={i} className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg text-xs">
                                            <span className="text-gray-700 truncate">{f.name}</span>
                                            <div className="flex items-center gap-3 ml-2 shrink-0">
                                                <span className="text-gray-400">{(f.size / 1024).toFixed(0)} KB</span>
                                                <button onClick={() => removeFile(i)} className="text-red-400 hover:text-red-600">✕</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Progress bar */}
                            {uploading && (
                                <div>
                                    <div className="w-full bg-gray-100 rounded-full h-2">
                                        <div
                                            className="bg-indigo-600 h-2 rounded-full transition-all"
                                            style={{ width: `${uploadProgress}%` }}
                                        />
                                    </div>
                                    <p className="text-xs text-gray-400 mt-1">{uploadProgress}% uploaded</p>
                                </div>
                            )}

                            {/* Results */}
                            {results && (
                                <div className="space-y-1">
                                    <p className="text-xs font-medium text-gray-600">
                                        {results.uploaded.length} uploaded, {results.failed.length} failed
                                    </p>
                                    {results.failed.map((f, i) => (
                                        <p key={i} className="text-xs text-red-500">{f.file}: {f.error}</p>
                                    ))}
                                </div>
                            )}

                            {uploadError && <p className="text-xs text-red-500">{uploadError}</p>}
                        </div>
                    )}

                    {/* --- Tab 2: Manual Link --- */}
                    {tab === 'manual' && !croppingStudent && (
                        <div className="space-y-3">
                            <div className='flex items-center justify-between'>
                                <input 
                                    type="text"
                                    placeholder='Search by name or ID...'
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    className='flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500' 
                                />
                                <button
                                    onClick={() => setShowOnlyReview(prev => !prev)}
                                    className={`ml-2 px-3 py-2 text-xs font-medium rounded-lg transition ${
                                        showOnlyReview
                                            ? 'bg-red-100 text-red-600 hover:bg-red-200'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                                >
                                    {showOnlyReview ? 'Showing: Needs Review' : 'Show: Needs Review'}
                                </button>
                            </div>

                            {studentsLoading ? (
                                <p className="text-sm text-gray-400">Loading students...</p>
                            ) : (
                                <div className="space-y-2 max-h-96 overflow-y-auto">
                                    {filteredStudents.map(student => (
                                        <div key={student.id} className="border border-gray-100 rounded-lg px-4 py-3">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm font-medium text-gray-800">{student.full_name}</p>
                                                    <p className="text-xs text-gray-400">{student.student_id} • {student.grade_level}</p>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    {statusBadge(student.photo_status, student.fail_reason)}
                                                    <div className="flex gap-2 text-xs font-medium">
                                                        {/* Render Crop option if student has a recorded original photo asset mapping */}
                                                        {(student.original_photo_url || student.photo) && (
                                                            <button
                                                                onClick={() => {
                                                                    setCroppingStudent(student);
                                                                    setCropBox({ x: 60, y: 30, width: 140, height: 170 });
                                                                }}
                                                                className="text-amber-600 hover:underline"
                                                            >
                                                                Crop Photo
                                                            </button>
                                                        )}
                                                        {['PENDING', 'MANUAL_REVIEW'].includes(student.photo_status) && (
                                                            <button
                                                                onClick={() => setLinkingStudentId(
                                                                    linkingStudentId === student.id ? null : student.id
                                                                )}
                                                                className="text-indigo-600 hover:underline"
                                                            >
                                                                Link Photo
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Inline file input for linking */}
                                            {linkingStudentId === student.id && (
                                                <div className="mt-2">
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        className="text-xs text-gray-600"
                                                        onChange={async (e) => {
                                                            if (e.target.files?.[0]) {
                                                                await handleLinkPhoto(student.id, e.target.files[0])
                                                            }
                                                        }}
                                                    />
                                                    {linking && <p className="text-xs text-gray-400 mt-1">Uploading...</p>}
                                                    {linkError && <p className="text-xs text-red-500 mt-1">{linkError}</p>}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    
                    {/* --- Sub-Tab View: Inline Manual Drag Cropper Frame UI --- */}
                    {tab === 'manual' && croppingStudent && (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center bg-amber-50 px-4 py-2 rounded-lg text-xs text-amber-800">
                                <p><strong>Manual Crop Mode:</strong> Drag selection boundary box over the student's face.</p>
                                <button onClick={() => setCroppingStudent(null)} className="font-bold underline hover:text-amber-950">Back</button>
                            </div>

                            {/* ✅ remove the outer flex container, wrap image directly */}
                            <div className="rounded-xl overflow-hidden bg-gray-900 border border-gray-800 select-none flex justify-center">
                                <div
                                    className="relative inline-block"  
                                    onMouseMove={onMouseMove}
                                    onMouseUp={() => setIsDragging(false)}
                                >
                                    <img
                                        ref={imageRef}
                                        src={croppingStudent.original_photo_url || croppingStudent.photo}
                                        alt="Cropping subject"
                                        className="block"
                                        style={{ maxHeight: '380px', maxWidth: '100%' }}
                                    />

                                    {/* ✅ overlay now positioned relative to the image div */}
                                    <div
                                        onMouseDown={onMouseDown}
                                        className="absolute border-2 border-dashed border-amber-400 bg-amber-400/20 cursor-move"
                                        style={{
                                            left: `${cropBox.x}px`,
                                            top: `${cropBox.y}px`,
                                            width: `${cropBox.width}px`,
                                            height: `${cropBox.height}px`,
                                            boxShadow: '0 0 0 4000px rgba(0,0,0,0.6)'  
                                        }}
                                    >
                                        <div className="absolute top-1 left-2 bg-amber-500 text-[9px] text-white font-bold px-1 rounded shadow">
                                            FACE CROP ZONE
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {cropError && <p className="text-xs text-red-500">{cropError}</p>}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
                    <button
                        onClick={croppingStudent ? () => setCroppingStudent(null) : onClose}
                        className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition"
                    >
                        {croppingStudent ? 'Cancel Crop' : 'Cancel'}
                    </button>
                    {tab === 'bulk' && (
                        <button
                            onClick={results ? onSuccess : handleBulkUpload}
                            disabled={uploading || (!results && selectedFiles.length === 0)}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition"
                        >
                            {uploading ? 'Uploading...' : results ? 'Done' : `Upload ${selectedFiles.length} Photo${selectedFiles.length !== 1 ? 's' : ''}`}
                        </button>
                    )}
                    {tab === 'manual' && croppingStudent && (
                        <button
                            onClick={handleExecuteManualCrop}
                            disabled={cropping}
                            className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 disabled:opacity-50 transition"
                        >
                            {cropping ? 'Processing Crop...' : 'Confirm Face Crop'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}

export default UploadPhotosModal;