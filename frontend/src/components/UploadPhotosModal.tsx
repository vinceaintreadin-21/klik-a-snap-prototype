import { useState } from 'react'
import { useBulkUpload, useStudentsForOrder, useManualLinkPhoto } from '../hooks/useUploadPhotos'

interface Props {
    order: { id: number; school_name: string; batch_name: string; student_count: number }
    onClose: () => void
    onSuccess: () => void
}

const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
        PENDING: 'bg-gray-100 text-gray-600',
        PROCESSED: 'bg-green-100 text-green-600',
        MANUAL_REVIEW: 'bg-red-100 text-red-600',
    }
    return (
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] ?? 'bg-gray-100 text-gray-500'}`}>
            {status}
        </span>
    )
}

const UploadPhotosModal = ({ order, onClose, onSuccess }: Props) => {
    const [tab, setTab] = useState<'bulk' | 'manual'>('bulk')
    const [selectedFiles, setSelectedFiles] = useState<File[]>([])
    const [search, setSearch] = useState('')
    const [linkingStudentId, setLinkingStudentId] = useState<number | null>(null)
    const [showOnlyReview, setShowOnlyReview] = useState(false)

    const { bulkUpload, loading: uploading, error: uploadError, uploadProgress, results } = useBulkUpload()
    const { students, loading: studentsLoading, refetch } = useStudentsForOrder(order.id)
    const { linkPhoto, loading: linking, error: linkError } = useManualLinkPhoto()

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

    const filteredStudents = students.filter(s => {
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
                                onClick={() => setTab(t)}
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
                <div className="flex-1 overflow-y-auto px-6 py-4">

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
                    {tab === 'manual' && (
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
                                                <div className="flex items-center gap-2">
                                                    {statusBadge(student.photo_status)}
                                                    {['PENDING', 'MANUAL_REVIEW'].includes(student.photo_status) && (
                                                        <button
                                                            onClick={() => setLinkingStudentId(
                                                                linkingStudentId === student.id ? null : student.id
                                                            )}
                                                            className="text-xs text-indigo-600 hover:underline"
                                                        >
                                                            Link Photo
                                                        </button>
                                                    )}
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
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition"
                    >
                        Cancel
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
                </div>
            </div>
        </div>
    )
}

export default UploadPhotosModal