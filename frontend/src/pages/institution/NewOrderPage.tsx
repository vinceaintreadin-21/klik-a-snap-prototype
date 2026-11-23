import { useState, useRef, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { isAxiosError } from 'axios'
import {
    ChevronRight, ArrowLeft, Upload, CheckCircle2,
    FileText, Info, AlertCircle, Check, QrCode, Download,
    Loader2, X, ChevronLeft, Pencil,
} from 'lucide-react'
import { cn } from '../../lib/utils'
import api from '../../utils/api'
import { useOrders } from '../../context/OrderContext'

type OrderStep = 1 | 2 | 3

type PreviewColumn = {
    key: string
    label: string
}

type ImportedRow = {
    row: number
    name: string
    values: Record<string, string>
}

type PreviewRow = ImportedRow & {
    errors: string[]
}

const FULL_NAME_KEYS = ['name', 'full_name', 'fullname']
const NAME_KEYS = [...FULL_NAME_KEYS, 'first_name', 'last_name']

function validateRow(row: ImportedRow): PreviewRow {
    return { ...row, errors: row.name.trim() ? [] : ['Missing name'] }
}

function PreviewRowEditor({ columns, row, onSave, onClose }: {
    columns: PreviewColumn[]
    row: PreviewRow
    onSave: (row: PreviewRow) => void
    onClose: () => void
}) {
    const dialog = useRef<HTMLDialogElement>(null)
    const [values, setValues] = useState(row.values)
    const [manualName, setManualName] = useState(row.name)
    const nameColumn = columns.find(({ key }) => NAME_KEYS.includes(key))
    const fullName = FULL_NAME_KEYS.map((key) => values[key]?.trim()).find(Boolean)
    const name = nameColumn
        ? fullName || [values.first_name?.trim(), values.last_name?.trim()].filter(Boolean).join(' ')
        : manualName.trim()
    const focusKey = row.errors.length ? nameColumn?.key : columns[0]?.key
    const inputClass = 'w-full min-w-0 rounded-lg border border-slate-300 px-3 py-2 text-sm font-normal focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100'

    useEffect(() => {
        const element = dialog.current
        element?.showModal()
        return () => { element?.close() }
    }, [])

    return (
        <dialog ref={dialog} aria-labelledby="row-editor-title"
            onCancel={(event) => { event.preventDefault(); onClose() }}
            className="m-auto w-[calc(100%_-_2rem)] max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white p-0 text-slate-900 shadow-2xl backdrop:bg-slate-900/45">
            <form className="flex max-h-[85dvh] flex-col" onSubmit={(event) => {
                event.preventDefault()
                if (name) onSave(validateRow({ row: row.row, name, values }))
            }}>
                <header className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4">
                    <h2 id="row-editor-title" className="text-base font-semibold">Edit row {row.row}</h2>
                    <button type="button" aria-label="Close row editor" onClick={onClose}
                        className="rounded-lg p-2 text-slate-500 hover:bg-slate-100">
                        <X size={16} />
                    </button>
                </header>
                <div className="grid min-h-0 gap-4 overflow-y-auto px-5 py-4 sm:grid-cols-2">
                    {!nameColumn && (
                        <label className="grid gap-1.5 text-sm font-medium sm:col-span-2">
                            Name
                            <input autoFocus={!focusKey} value={manualName} required
                                onChange={(event) => setManualName(event.target.value)} className={inputClass} />
                        </label>
                    )}
                    {columns.map(({ key, label }) => (
                        <label key={key} className="grid gap-1.5 text-sm font-medium">
                            {label}
                            <input autoFocus={key === focusKey} value={values[key] ?? ''}
                                aria-invalid={(!name && key === nameColumn?.key) || undefined}
                                onChange={(event) => {
                                    const value = event.target.value
                                    setValues((previous) => ({ ...previous, [key]: value }))
                                }}
                                className={cn(inputClass, !name && key === nameColumn?.key && 'border-red-400 bg-red-50')} />
                        </label>
                    ))}
                </div>
                <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4">
                    <span aria-live="polite" className="text-sm text-red-700">{!name && 'Name is required.'}</span>
                    <div className="ml-auto flex gap-2">
                        <button type="button" onClick={onClose}
                            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium hover:bg-slate-100">
                            Cancel
                        </button>
                        <button type="submit" disabled={!name}
                            className="rounded-lg bg-[#7e22ce] px-3 py-2 text-sm font-medium text-white hover:bg-[#6b21a8] disabled:opacity-50">
                            Save changes
                        </button>
                    </div>
                </footer>
            </form>
        </dialog>
    )
}

function StepIndicator({ step, current }: { step: OrderStep; current: OrderStep }) {
    const isDone = step < current
    const isActive = step === current
    return (
        <div className="flex items-center gap-2">
            <div className={cn(
                'w-9 h-9 rounded-full flex items-center justify-center text-[14px] font-bold transition-all',
                isDone || isActive ? 'bg-[#7e22ce] text-white' : 'bg-[#f1f5f9] text-[#9ba3af]'
            )}>
                {isDone ? <Check size={16} /> : step}
            </div>
            <span className={cn('text-[13px] font-medium',
                isActive ? 'text-[#7e22ce]' : isDone ? 'text-[#374151]' : 'text-[#9ba3af]')}>
                {step === 1 ? 'Upload List' : step === 2 ? 'Review & Confirm' : 'Generate QR Codes'}
            </span>
        </div>
    )
}

function StepDivider({ done }: { done: boolean }) {
    return <div className="flex-1 h-px mx-3" style={{ background: done ? '#7e22ce' : '#e2e8f0' }} />
}

export default function NewOrderPage() {
    const navigate = useNavigate()
    const { addOrder } = useOrders()

    const [step, setStep] = useState<OrderStep>(1)
    const [batchName, setBatchName] = useState('')
    const [file, setFile] = useState<File | null>(null)
    const [isDragOver, setIsDragOver] = useState(false)
    const [parsing, setParsing] = useState(false)
    const [parsedRows, setParsedRows] = useState<PreviewRow[]>([])
    const [columns, setColumns] = useState<PreviewColumn[]>([])
    const [page, setPage] = useState(1)
    const [showIssuesOnly, setShowIssuesOnly] = useState(false)
    const [editingRow, setEditingRow] = useState<PreviewRow | null>(null)
    const [parseError, setParseError] = useState<string | null>(null)
    const [creatingOrder, setCreatingOrder] = useState(false)
    const [createdOrder, setCreatedOrder] = useState<any | null>(null)
    const [downloadingQR, setDownloadingQR] = useState(false)
    const [downloadedQR, setDownloadedQR] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const errorRows = parsedRows.filter((r) => r.errors.length > 0)
    const validRows = parsedRows.filter((r) => r.errors.length === 0)

    const pageSize = 20
    const previewRows = showIssuesOnly ? errorRows : parsedRows
    const pageCount = Math.max(1, Math.ceil(previewRows.length / pageSize))
    const currentPage = Math.min(page, pageCount)
    const start = (currentPage - 1) * pageSize
    const visibleRows = previewRows.slice(start, start + pageSize)

    const handleSaveRow = (updatedRow: PreviewRow) => {
        setParsedRows((rows) => rows.map((row) => row.row === updatedRow.row ? updatedRow : row))
        setPage(currentPage)
        setEditingRow(null)
    }

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

            const importedRows: ImportedRow[] | undefined = res.data.preview_rows
            const importedColumns: PreviewColumn[] | undefined = res.data.columns

          if (!importedRows || !importedColumns) {
            setParseError(
              res.data.sheets?.length > 1
                  ? 'Select a worksheet before previewing this workbook.'
                  : 'This file format does not provide a flexible preview yet.',
            )
            return
          }
            setColumns(importedColumns)
            setParsedRows(importedRows.map(validateRow))
            setPage(1)
            setShowIssuesOnly(false)
            setStep(2)
        } catch (err) {
            const message = isAxiosError(err) ? err.response?.data?.error : undefined
            setParseError(message || 'Failed to parse file. Please check the format.')
        } finally {
            setParsing(false)
        }
    }
    // ── Step 2: create order ──────────────────────────────────────────────────

    const handleCreateOrder = async () => {
        if (!batchName.trim() || errorRows.length > 0 || validRows.length === 0) return
        setCreatingOrder(true)
        try {
            const res = await api.post('/orders/', {
                batch_name: batchName.trim(),
                school_name: batchName.trim(),
                students: validRows.map((row) => ({
                    name: row.name,
                    extra_fields: row.values,
                })),
            })
            const order = res.data?.order ?? res.data
            setCreatedOrder(order)
            addOrder(order)
            setStep(3)
        } catch (err) {
            const message = isAxiosError(err) ? err.response?.data?.error : undefined
            alert(message || 'Failed to create order.')
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
                    <button onClick={() => navigate('/client/orders')} className="text-[#9ba3af] hover:text-[#7e22ce]">Orders</button>
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

            <div className="p-8 flex flex-col gap-6 bg-[#f5f3ff] flex-1">
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
                                        <Info size={13} className="text-[#7e22ce] shrink-0" />Max file size: 25 MB
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
                                        className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2.5 text-[14px] text-[#374151] placeholder-[#c8cbd9] focus:outline-none focus:ring-2 focus:ring-[#f3e8ff] focus:border-[#7e22ce] transition-colors"
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
                                        isDragOver ? 'border-[#7e22ce] bg-[#faf5ff]' :
                                            file ? 'border-[#22c55e] bg-[#f0fdf4] cursor-default' :
                                                'border-[#e2e8f0] bg-white hover:border-[#7e22ce] hover:bg-[#f8faff] shadow-[0px_1px_2px_rgba(0,0,0,0.04)]'
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
                                            <div className="w-14 h-14 rounded-2xl bg-[#f3e8ff] flex items-center justify-center mb-3">
                                                <Upload size={24} className="text-[#7e22ce]" />
                                            </div>
                                            <p className="text-[15px] font-semibold text-[#0b1c30]">Drag and drop your student list</p>
                                            <p className="text-[13px] text-[#9ba3af] mt-1">or click to browse from your computer</p>
                                            <button onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click() }}
                                                className="mt-4 bg-[#7e22ce] text-white text-[14px] font-medium px-5 py-2.5 rounded-lg hover:bg-[#6b21a8] transition-colors">
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
                                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#7e22ce] text-white text-[13px] font-medium hover:bg-[#6b21a8] disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm">
                                {parsing ? <><Loader2 size={14} className="animate-spin" /> Parsing…</> : <>Continue to Review <ChevronRight size={14} /></>}
                            </button>
                        </div>
                    </div>
                )}

                {/* ── STEP 2 ── */}
                {step === 2 && (
                    <div className="flex min-w-0 flex-col gap-4">
                        {editingRow && (
                            <PreviewRowEditor key={editingRow.row} columns={columns} row={editingRow}
                                onClose={() => setEditingRow(null)} onSave={handleSaveRow} />
                        )}
                        <section aria-labelledby="data-preview-title"
                            className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                            <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-3.5">
                                <div className="flex items-center gap-2.5">
                                    <h2 id="data-preview-title" className="text-sm font-semibold text-slate-900">Data Preview</h2>
                                    <span className="rounded-full bg-[#f3e8ff] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#7e22ce]">
                                        Parsed results
                                    </span>
                                </div>
                                <div className="flex items-center gap-4 text-xs font-medium" aria-live="polite">
                                    <span className="flex items-center gap-1.5 text-emerald-700">
                                        <CheckCircle2 size={14} /> {validRows.length} valid
                                    </span>
                                    {errorRows.length > 0 && (
                                        <span className="flex items-center gap-1.5 text-red-700">
                                            <AlertCircle size={14} /> {errorRows.length} {errorRows.length === 1 ? 'error' : 'errors'}
                                        </span>
                                    )}
                                </div>
                            </header>
                            <div className="max-h-[55vh] overflow-auto focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-blue-600"
                                role="region" aria-label="Spreadsheet rows" tabIndex={0}>
                                <table className="w-full border-separate border-spacing-0 text-[13px]">
                                    <thead className="sticky top-0 z-20 bg-slate-50 text-[10px] uppercase tracking-wide text-slate-600">
                                        <tr>
                                            <th scope="col" className="border-b border-slate-200 px-4 py-3 text-left">Row</th>
                                            {columns.map(({ key, label }) => (
                                                <th key={key} scope="col" className="whitespace-nowrap border-b border-slate-200 px-4 py-3 text-left">{label}</th>
                                            ))}
                                            <th scope="col" className="border-b border-slate-200 px-4 py-3 text-left">Status</th>
                                            <th scope="col" className="sticky right-0 border-b border-l border-slate-200 bg-slate-50 px-4 py-3 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {visibleRows.map((row) => {
                                            const hasError = row.errors.length > 0
                                            return (
                                                <tr key={row.row} className={cn('group', hasError
                                                    ? 'bg-red-50 hover:bg-red-100/70'
                                                    : 'odd:bg-white even:bg-slate-50 hover:bg-blue-50')}>
                                                    <th scope="row" className="border-b border-slate-100 px-4 py-2.5 text-left font-normal tabular-nums text-slate-500">
                                                        {row.row}
                                                    </th>
                                                    {columns.map(({ key }) => {
                                                        const value = row.values[key]
                                                        const missingName = hasError && NAME_KEYS.includes(key) && !value?.trim()
                                                        return (
                                                            <td key={key} className={cn(
                                                                'whitespace-nowrap border-b border-slate-100 px-4 py-2.5',
                                                                missingName ? 'font-medium text-red-700' : value?.trim() ? 'text-slate-700' : 'text-slate-400',
                                                            )}>
                                                                {value?.trim() ? value : missingName ? 'Missing' : '—'}
                                                            </td>
                                                        )
                                                    })}
                                                    <td className="whitespace-nowrap border-b border-slate-100 px-4 py-2.5">
                                                        <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium',
                                                            hasError ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-800')}>
                                                            {hasError ? row.errors.join(', ') : 'Valid'}
                                                        </span>
                                                    </td>
                                                    <td className={cn('sticky right-0 border-b border-l border-slate-200 px-3 py-2 text-right',
                                                        hasError ? 'bg-red-50 group-hover:bg-red-100' : 'bg-white group-even:bg-slate-50 group-hover:bg-blue-50')}>
                                                        <button type="button" disabled={creatingOrder}
                                                            aria-label={`${hasError ? 'Fix error in' : 'Edit'} row ${row.row}`}
                                                            onClick={() => setEditingRow(row)}
                                                            className={cn('inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-1 text-xs font-semibold disabled:opacity-50',
                                                                hasError ? 'text-red-700 hover:bg-red-100' : 'text-[#7e22ce] hover:bg-blue-100')}>
                                                            {hasError ? <AlertCircle size={13} /> : <Pencil size={13} />}
                                                            {hasError ? 'Fix error' : 'Edit'}
                                                        </button>
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                        {visibleRows.length === 0 && (
                                            <tr>
                                                <td colSpan={columns.length + 3} className="px-5 py-8 text-center text-slate-500">
                                                    {showIssuesOnly ? 'No rows need correction.' : 'No rows found in this worksheet.'}
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-5 py-3 text-xs">
                                <div className="flex flex-wrap items-center gap-3">
                                    <span className="tabular-nums text-slate-600" aria-live="polite">
                                        {previewRows.length
                                            ? `Showing ${start + 1}–${start + visibleRows.length} of ${previewRows.length} rows`
                                            : '0 rows'}
                                    </span>
                                    <button type="button" aria-label="Previous page" disabled={currentPage === 1}
                                        onClick={() => setPage(currentPage - 1)}
                                        className="rounded-md border border-slate-200 bg-white p-1.5 text-slate-600 hover:bg-blue-50 disabled:opacity-40">
                                        <ChevronLeft size={13} />
                                    </button>
                                    <span className="font-semibold tabular-nums text-[#7e22ce]">{currentPage} / {pageCount}</span>
                                    <button type="button" aria-label="Next page" disabled={currentPage === pageCount}
                                        onClick={() => setPage(currentPage + 1)}
                                        className="rounded-md border border-slate-200 bg-white p-1.5 text-slate-600 hover:bg-blue-50 disabled:opacity-40">
                                        <ChevronRight size={13} />
                                    </button>
                                </div>
                                <label className="flex cursor-pointer items-center gap-2 text-slate-700">
                                    <input type="checkbox" checked={showIssuesOnly}
                                        onChange={(event) => { setShowIssuesOnly(event.target.checked); setPage(1) }}
                                        className="size-4 accent-[#7e22ce]" />
                                    Show errors only
                                </label>
                            </footer>
                        </section>

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
                                    className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#7e22ce] text-white text-[13px] font-medium hover:bg-[#6b21a8] disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm">
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
                            <div className="w-20 h-20 rounded-2xl bg-[#f3e8ff] flex items-center justify-center">
                                <QrCode size={40} className="text-[#7e22ce]" />
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
                                        downloadingQR ? 'bg-[#7e22ce] text-white opacity-70 cursor-wait' :
                                            'bg-[#7e22ce] text-white hover:bg-[#6b21a8]'
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
