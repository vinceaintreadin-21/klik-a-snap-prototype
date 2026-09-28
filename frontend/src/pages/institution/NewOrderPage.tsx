import { useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    ChevronRight, ChevronLeft, ArrowLeft, Upload, CheckCircle2,
    FileText, Info, AlertCircle, Check, QrCode, Download,
    Loader2, X,
} from 'lucide-react'
import { cn } from '../../lib/utils'
import api from '../../utils/api'
import { useOrders } from '../../context/OrderContext'

type OrderStep = 1 | 2 | 3

interface ParsedStudent {
    row: number
    student_id: string
    name: string
    grade?: string
    extra?: Record<string, string>
    errors: string[]
}

function StepIndicator({ step, current }: { step: OrderStep; current: OrderStep }) {
    const isDone = step < current
    const isActive = step === current
    return (
        <div className="flex items-center gap-2">
            <div className={cn(
                'w-9 h-9 rounded-full flex items-center justify-center text-[14px] font-bold transition-all',
                isDone || isActive ? 'bg-[#004ac6] text-white' : 'bg-[#f1f5f9] text-[#9ba3af]'
            )}>
                {isDone ? <Check size={16} /> : step}
            </div>
            <span className={cn('text-[13px] font-medium',
                isActive ? 'text-[#004ac6]' : isDone ? 'text-[#374151]' : 'text-[#9ba3af]')}>
                {step === 1 ? 'Upload List' : step === 2 ? 'Review & Confirm' : 'Generate QR Codes'}
            </span>
        </div>
    )
}

function StepDivider({ done }: { done: boolean }) {
    return <div className="flex-1 h-px mx-3" style={{ background: done ? '#004ac6' : '#e2e8f0' }} />
}

export default function NewOrderPage() {
    const navigate = useNavigate()
    const { addOrder } = useOrders()

    const [step, setStep] = useState<OrderStep>(1)
    const [batchName, setBatchName] = useState('')
    const [file, setFile] = useState<File | null>(null)
    const [isDragOver, setIsDragOver] = useState(false)
    const [parsing, setParsing] = useState(false)
    const [parsedRows, setParsedRows] = useState<ParsedStudent[]>([])
    const [parseError, setParseError] = useState<string | null>(null)
    const [creatingOrder, setCreatingOrder] = useState(false)
    const [createdOrder, setCreatedOrder] = useState<any | null>(null)
    const [downloadingQR, setDownloadingQR] = useState(false)
    const [downloadedQR, setDownloadedQR] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const errorRows = parsedRows.filter((r) => r.errors.length > 0)
    const validRows = parsedRows.filter((r) => r.errors.length === 0)

    // ── Step 1: file selection ────────────────────────────────────────────────

    const handleFileChange = (f: File) => {
        setFile(f)
        setParseError(null)
        setParsedRows([])
    }

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragOver(false)
        const f = e.dataTransfer.files[0]
        if (f) handleFileChange(f)
    }, [])

    const handleParseAndContinue = async () => {
        if (!file || !batchName.trim()) return
        setParsing(true)
        setParseError(null)
        try {
            const formData = new FormData()
            formData.append('file', file)
            const res = await api.post('/orders/parse-file/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            })
            const rows: ParsedStudent[] = res.data?.students ?? res.data ?? []
            setParsedRows(rows)
            setStep(2)
        } catch (err: any) {
            setParseError(err.response?.data?.error || 'Failed to parse file. Please check the format.')
        } finally {
            setParsing(false)
        }
    }

    // ── Step 2: create order ──────────────────────────────────────────────────

    const handleCreateOrder = async () => {
        if (!file || !batchName.trim() || errorRows.length > 0) return
        setCreatingOrder(true)
        try {
            const formData = new FormData()
            formData.append('batch_name', batchName.trim())
            formData.append('file', file)
            const res = await api.post('/orders/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            })
            const order = res.data?.order ?? res.data
            setCreatedOrder(order)
            addOrder(order)
            setStep(3)
        } catch (err: any) {
            alert(err.response?.data?.error || 'Failed to create order.')
        } finally {
            setCreatingOrder(false)
        }
    }

    // ── Step 3: download QR ───────────────────────────────────────────────────

    const handleDownloadQR = async () => {
        if (!createdOrder?.id) return
        setDownloadingQR(true)
        try {
            const res = await api.get(`/orders/${createdOrder.id}/qr-codes/download/`, { responseType: 'blob' })
            const url = URL.createObjectURL(res.data)
            const a = document.createElement('a')
            a.href = url
            a.download = `qr-codes-order-${createdOrder.id}.zip`
            a.click()
            URL.revokeObjectURL(url)
            setDownloadedQR(true)
        } catch (err: any) {
            alert(err.response?.data?.error || 'Failed to download QR codes.')
        } finally {
            setDownloadingQR(false)
        }
    }

    return (
        <div className="flex flex-col min-h-full">
            {/* Header */}
            <div className="px-8 pt-7 pb-6 border-b border-[#eceef0] bg-white">
                <nav className="flex items-center gap-1.5 text-[12px] mb-3">
                    <span className="text-[#9ba3af]">Institution</span>
                    <ChevronRight size={11} className="text-[#c8cbd9]" />
                    <button onClick={() => navigate('/client/orders')} className="text-[#9ba3af] hover:text-[#004ac6]">Orders</button>
                    <ChevronRight size={11} className="text-[#c8cbd9]" />
                    <span className="text-[#374151] font-medium">New Order</span>
                </nav>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-[24px] font-bold text-[#0b1c30] leading-tight tracking-[-0.3px]">New Order</h1>
                        <p className="text-[14px] text-[#64748b] mt-1">Upload your student list, review data, and generate QR codes.</p>
                    </div>
                    <button onClick={() => navigate('/client/orders')}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#e2e8f0] text-[13px] text-[#64748b] hover:bg-[#f8fafc] transition-colors">
                        <ArrowLeft size={14} />
                        Cancel
                    </button>
                </div>
            </div>

            <div className="p-8 flex flex-col gap-6 bg-[#f7f8fa] flex-1">
                {/* Stepper */}
                <div className="flex items-center bg-white border border-[#e2e8f0] rounded-2xl px-8 py-5 shadow-[0px_1px_2px_rgba(0,0,0,0.04)]">
                    <StepIndicator step={1} current={step} />
                    <StepDivider done={step > 1} />
                    <StepIndicator step={2} current={step} />
                    <StepDivider done={step > 2} />
                    <StepIndicator step={3} current={step} />
                </div>

                {/* ── STEP 1 ── */}
                {step === 1 && (
                    <div className="flex flex-col gap-4">
                        <div className="flex gap-5">
                            {/* Instructions sidebar */}
                            <div className="w-[260px] shrink-0 bg-white border border-[#e2e8f0] rounded-2xl p-5 flex flex-col gap-3 self-start shadow-[0px_1px_2px_rgba(0,0,0,0.04)]">
                                <h3 className="text-[14px] font-semibold text-[#0b1c30]">Instructions</h3>
                                <p className="text-[13px] text-[#64748b] leading-5">
                                    Upload your student roster to begin ID card generation. Ensure all required fields are present.
                                </p>
                                <div className="flex flex-col gap-2 pt-1">
                                    <div className="flex items-center gap-2 text-[12px] text-[#64748b]">
                                        <Info size={13} className="text-[#004ac6] shrink-0" />Max file size: 25 MB
                                    </div>
                                    <div className="flex items-center gap-2 text-[12px] text-[#64748b]">
                                        <FileText size={13} className="text-[#9ba3af] shrink-0" />Formats: .csv, .xlsx, .xls
                                    </div>
                                </div>
                            </div>

                            {/* Upload area */}
                            <div className="flex-1 flex flex-col gap-4">
                                {/* Batch name */}
                                <div className="bg-white border border-[#e2e8f0] rounded-2xl p-5 shadow-[0px_1px_2px_rgba(0,0,0,0.04)]">
                                    <label className="text-[12px] font-semibold text-[#374151] uppercase tracking-[0.4px] block mb-2">
                                        Batch Name <span className="text-[#ba1a1a]">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. 2024 Undergraduate Batch"
                                        value={batchName}
                                        onChange={(e) => setBatchName(e.target.value)}
                                        className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2.5 text-[14px] text-[#374151] placeholder-[#c8cbd9] focus:outline-none focus:ring-2 focus:ring-[#e8eeff] focus:border-[#004ac6] transition-colors"
                                    />
                                </div>

                                {/* Drop zone */}
                                <div
                                    onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
                                    onDragLeave={() => setIsDragOver(false)}
                                    onDrop={handleDrop}
                                    onClick={() => !file && fileInputRef.current?.click()}
                                    className={cn(
                                        'border-2 border-dashed rounded-2xl flex flex-col items-center justify-center min-h-[220px] transition-all cursor-pointer',
                                        isDragOver ? 'border-[#004ac6] bg-[#eff4ff]' :
                                            file ? 'border-[#22c55e] bg-[#f0fdf4] cursor-default' :
                                                'border-[#e2e8f0] bg-white hover:border-[#004ac6] hover:bg-[#f8faff] shadow-[0px_1px_2px_rgba(0,0,0,0.04)]'
                                    )}>
                                    <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls" onChange={(e) => {
                                        const f = e.target.files?.[0]
                                        if (f) handleFileChange(f)
                                    }} className="hidden" />
                                    {file ? (
                                        <>
                                            <div className="w-14 h-14 rounded-2xl bg-[#dcfce7] flex items-center justify-center mb-3">
                                                <CheckCircle2 size={28} className="text-[#22c55e]" />
                                            </div>
                                            <p className="text-[15px] font-semibold text-[#166534]">{file.name}</p>
                                            <p className="text-[13px] text-[#64748b] mt-1">
                                                {(file.size / 1024).toFixed(1)} KB · Ready to process
                                            </p>
                                            <button onClick={(e) => { e.stopPropagation(); setFile(null) }}
                                                className="mt-3 flex items-center gap-1 text-[12px] text-[#9ba3af] hover:text-[#374151]">
                                                <X size={12} /> Replace file
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <div className="w-14 h-14 rounded-2xl bg-[#e8eeff] flex items-center justify-center mb-3">
                                                <Upload size={24} className="text-[#004ac6]" />
                                            </div>
                                            <p className="text-[15px] font-semibold text-[#0b1c30]">Drag and drop your student list</p>
                                            <p className="text-[13px] text-[#9ba3af] mt-1">or click to browse from your computer</p>
                                            <button onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click() }}
                                                className="mt-4 bg-[#004ac6] text-white text-[14px] font-medium px-5 py-2.5 rounded-lg hover:bg-[#003da6] transition-colors">
                                                Select File
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {parseError && (
                            <div className="flex items-center gap-2.5 bg-[#fff5f5] border border-[#fca5a5] rounded-xl px-4 py-3">
                                <AlertCircle size={15} className="text-[#b91c1c] shrink-0" />
                                <p className="text-[13px] text-[#b91c1c]">{parseError}</p>
                            </div>
                        )}

                        <div className="flex items-center justify-between pt-2 border-t border-[#f1f5f9]">
                            <button onClick={() => navigate('/client/orders')}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#e2e8f0] text-[13px] text-[#64748b] hover:bg-[#f8fafc] transition-colors">
                                <ArrowLeft size={14} /> Cancel
                            </button>
                            <button
                                onClick={handleParseAndContinue}
                                disabled={!file || !batchName.trim() || parsing}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#004ac6] text-white text-[13px] font-medium hover:bg-[#003da6] disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm">
                                {parsing ? <><Loader2 size={14} className="animate-spin" /> Parsing…</> : <>Continue to Review <ChevronRight size={14} /></>}
                            </button>
                        </div>
                    </div>
                )}

                {/* ── STEP 2 ── */}
                {step === 2 && (
                    <div className="flex flex-col gap-4">
                        <div className="bg-white border border-[#e2e8f0] rounded-2xl overflow-hidden shadow-[0px_1px_2px_rgba(0,0,0,0.04)]">
                            <div className="flex items-center justify-between px-6 py-4 border-b border-[#f1f5f9]">
                                <div className="flex items-center gap-3">
                                    <span className="text-[15px] font-semibold text-[#0b1c30]">Data Preview</span>
                                    <span className="bg-[#e8eeff] text-[#004ac6] text-[11px] font-bold px-2.5 py-0.5 rounded-full tracking-wide uppercase">Parsed Results</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="flex items-center gap-1.5 text-[13px] text-[#166534]">
                                        <CheckCircle2 size={14} className="text-[#22c55e]" />
                                        <span className="font-semibold">{validRows.length}</span> Valid
                                    </span>
                                    {errorRows.length > 0 && (
                                        <span className="flex items-center gap-1.5 text-[13px] text-[#b91c1c]">
                                            <AlertCircle size={14} className="text-[#ef4444]" />
                                            <span className="font-semibold">{errorRows.length}</span> Error{errorRows.length !== 1 ? 's' : ''}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="bg-[rgba(248,250,252,0.9)] border-b border-[#f1f5f9]">
                                        <th className="text-left px-6 py-3 text-[11px] font-bold text-[#64748b] tracking-[0.55px] uppercase w-[60px]">#</th>
                                        <th className="text-left px-6 py-3 text-[11px] font-bold text-[#64748b] tracking-[0.55px] uppercase">Student ID</th>
                                        <th className="text-left px-6 py-3 text-[11px] font-bold text-[#64748b] tracking-[0.55px] uppercase">Name</th>
                                        <th className="text-left px-6 py-3 text-[11px] font-bold text-[#64748b] tracking-[0.55px] uppercase">Grade / Level</th>
                                        <th className="text-left px-6 py-3 text-[11px] font-bold text-[#64748b] tracking-[0.55px] uppercase">Issues</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {parsedRows.slice(0, 20).map((row) => {
                                        const hasError = row.errors.length > 0
                                        return (
                                            <tr key={row.row} className={cn('border-b border-[#f8fafc]', hasError && 'bg-[#fff5f5]')}>
                                                <td className="px-6 py-3 text-[12px] text-[#9ba3af]">{row.row}</td>
                                                <td className="px-6 py-3">
                                                    <span className={cn('font-mono text-[13px]', hasError ? 'text-[#ba1a1a] font-semibold' : 'text-[#374151]')}>
                                                        {row.student_id || '—'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-3">
                                                    <span className={cn('text-[13px]', hasError ? 'text-[#ba1a1a]' : 'text-[#374151]')}>
                                                        {row.name || '—'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-3 text-[13px] text-[#64748b]">{row.grade ?? '—'}</td>
                                                <td className="px-6 py-3">
                                                    {hasError ? (
                                                        <span className="text-[11px] text-[#b91c1c] font-medium">{row.errors.join(', ')}</span>
                                                    ) : (
                                                        <span className="text-[11px] text-[#22c55e] font-medium flex items-center gap-1">
                                                            <Check size={11} /> OK
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>

                            {parsedRows.length > 20 && (
                                <div className="px-6 py-2 text-[12px] text-[#9ba3af] bg-[#f8fafc] border-t border-[#f1f5f9]">
                                    Showing first 20 of {parsedRows.length} rows
                                </div>
                            )}

                            <div className="bg-[#f8fafc] border-t border-[#f1f5f9] flex items-center justify-between px-6 py-3">
                                <span className="text-[12px] text-[#9ba3af]">{parsedRows.length} rows parsed from {file?.name}</span>
                                <span className={cn('text-[12px] font-medium', errorRows.length > 0 ? 'text-[#b91c1c]' : 'text-[#166534]')}>
                                    {errorRows.length > 0
                                        ? `${errorRows.length} error${errorRows.length !== 1 ? 's' : ''} — fix before proceeding`
                                        : 'All records valid'}
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-[#f1f5f9]">
                            <button onClick={() => setStep(1)}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#e2e8f0] text-[13px] text-[#64748b] hover:bg-[#f8fafc] transition-colors">
                                <ArrowLeft size={14} /> Back
                            </button>
                            <div className="flex items-center gap-3">
                                {errorRows.length > 0 && (
                                    <p className="text-[12px] text-[#b91c1c] font-medium">
                                        Fix {errorRows.length} error{errorRows.length !== 1 ? 's' : ''} to continue
                                    </p>
                                )}
                                <button
                                    onClick={handleCreateOrder}
                                    disabled={errorRows.length > 0 || creatingOrder || parsedRows.length === 0}
                                    className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#004ac6] text-white text-[13px] font-medium hover:bg-[#003da6] disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm">
                                    {creatingOrder
                                        ? <><Loader2 size={14} className="animate-spin" /> Creating Order…</>
                                        : <>Create Order & Generate QR <ChevronRight size={14} /></>}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── STEP 3 ── */}
                {step === 3 && (
                    <div className="flex flex-col items-center justify-center flex-1 gap-6 py-8">
                        <div className="bg-white border border-[#e2e8f0] rounded-2xl p-10 flex flex-col items-center gap-5 w-[480px] shadow-[0px_4px_24px_rgba(0,74,198,0.08)]">
                            <div className="w-20 h-20 rounded-2xl bg-[#e8eeff] flex items-center justify-center">
                                <QrCode size={40} className="text-[#004ac6]" />
                            </div>
                            <div className="text-center">
                                <h3 className="text-[22px] font-bold text-[#0b1c30]">Order Created!</h3>
                                <p className="text-[14px] text-[#64748b] mt-1.5 leading-5">
                                    {validRows.length} student records have been submitted. QR codes are ready to download.
                                </p>
                            </div>
                            <div className="w-full bg-[#f8fafc] border border-[#f1f5f9] rounded-xl px-5 py-4 flex flex-col gap-2.5">
                                {[
                                    { label: 'Order ID', value: `#${createdOrder?.id ?? '—'}` },
                                    { label: 'Batch Name', value: batchName },
                                    { label: 'Students', value: String(validRows.length) },
                                    { label: 'Status', value: createdOrder?.status ?? 'PENDING' },
                                ].map(({ label, value }) => (
                                    <div key={label} className="flex items-center justify-between text-[13px]">
                                        <span className="text-[#9ba3af]">{label}</span>
                                        <span className="font-semibold text-[#0b1c30]">{value}</span>
                                    </div>
                                ))}
                            </div>
                            <button
                                onClick={handleDownloadQR}
                                disabled={downloadingQR || downloadedQR}
                                className={cn(
                                    'w-full flex items-center justify-center gap-2 py-3 rounded-xl text-[15px] font-semibold transition-all shadow-sm',
                                    downloadedQR ? 'bg-[#dcfce7] text-[#166534] border border-[#bbf7d0]' :
                                        downloadingQR ? 'bg-[#004ac6] text-white opacity-70 cursor-wait' :
                                            'bg-[#004ac6] text-white hover:bg-[#003da6]'
                                )}>
                                {downloadedQR ? <><CheckCircle2 size={18} /> Downloaded Successfully</> :
                                    downloadingQR ? <><Loader2 size={18} className="animate-spin" /> Preparing…</> :
                                        <><Download size={18} /> Download QR Codes (.zip)</>}
                            </button>
                            <button
                                onClick={() => navigate('/client/dashboard')}
                                className="text-[13px] text-[#9ba3af] hover:text-[#374151] transition-colors">
                                Return to Dashboard
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
