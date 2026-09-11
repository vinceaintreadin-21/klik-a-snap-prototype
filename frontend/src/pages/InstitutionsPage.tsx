import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus, Search, ChevronDown, ChevronRight, ChevronLeft,
  List, LayoutGrid, Eye, Pencil, Ban, CheckCircle2,
  AlertTriangle, X, Building2, Filter, RefreshCw,
  CheckCircle, Upload,
} from 'lucide-react'
import {
  useInstitutions,
  useCreateInstitution,
  useUpdateInstitution,
} from '../hooks/useInstitutions'
import { cn } from '../lib/utils'

// ── Types ──────────────────────────────────────────────────────────────────────

type InstStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
type ModalType  = 'create' | 'suspend' | 'activate' | null

interface Institution {
  id: number
  name: string
  address: string
  contact_person: string
  contact_email: string
  contact_phone: string
  logo_url: string | null
  status: InstStatus
  created_at: string
  suspended_at: string | null
  suspended_by__username: string | null
  suspended_reason: string
}

// ── Status config ──────────────────────────────────────────────────────────────

const STATUS_CFG: Record<InstStatus, { bg: string; dot: string; text: string; label: string }> = {
  ACTIVE:    { bg: '#f0fdf4', dot: '#22c55e', text: '#15803d', label: 'Active'    },
  INACTIVE:  { bg: '#f1f5f9', dot: '#94a3b8', text: '#64748b', label: 'Inactive'  },
  SUSPENDED: { bg: '#fff7ed', dot: '#f97316', text: '#c2410c', label: 'Suspended' },
}

// ── Pager ──────────────────────────────────────────────────────────────────────

const PER_PAGE = 10

function TablePager({ total, page, totalPages, onPage }: {
  total: number; page: number; totalPages: number; onPage: (p: number) => void
}) {
  const showing = Math.min(PER_PAGE * page, total)
  const from    = (page - 1) * PER_PAGE + 1
  const pages   = Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1)
  if (total === 0) return null
  return (
    <div className="bg-[#f8fafc] border-t border-[#f1f5f9] flex items-center justify-between px-6 py-4">
      <span className="text-[12px] text-[#434655]">
        Showing <span className="text-[#0b1c30]">{from}–{showing}</span> of{' '}
        <span className="text-[#0b1c30]">{total}</span> institutions
      </span>
      <div className="flex items-center gap-1.5">
        <button onClick={() => onPage(Math.max(1, page - 1))} disabled={page === 1}
          className="w-8 h-8 flex items-center justify-center rounded border border-[#e2e8f0] disabled:opacity-40 hover:bg-white transition-colors">
          <ChevronLeft size={12} className="text-[#434655]" />
        </button>
        {pages.map((p) => (
          <button key={p} onClick={() => onPage(p)}
            className={cn('w-8 h-8 flex items-center justify-center rounded text-[13px] font-medium transition-colors',
              page === p ? 'bg-[#004ac6] text-white' : 'text-[#434655] hover:bg-white border border-transparent hover:border-[#e2e8f0]')}>
            {p}
          </button>
        ))}
        {totalPages > 5 && <span className="w-8 h-8 flex items-center justify-center text-[13px] text-[#434655]">…</span>}
        <button onClick={() => onPage(Math.min(totalPages, page + 1))} disabled={page === totalPages}
          className="w-8 h-8 flex items-center justify-center rounded border border-[#e2e8f0] disabled:opacity-40 hover:bg-white transition-colors">
          <ChevronRight size={12} className="text-[#434655]" />
        </button>
      </div>
    </div>
  )
}

// ── Account Status Modal (suspend / activate) ──────────────────────────────────

function AccountStatusModal({
  action, inst, loading, error, onConfirm, onClose,
}: {
  action: 'suspend' | 'activate'
  inst: Institution
  loading: boolean
  error: string | null
  onConfirm: (reason?: string) => void
  onClose: () => void
}) {
  const [reason, setReason] = useState('')
  const [done, setDone]     = useState(false)
  const isSuspend = action === 'suspend'

  if (done) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
        <div className="relative bg-white rounded-2xl shadow-[0px_20px_60px_rgba(0,0,0,0.18)] w-[420px] p-8 flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
            style={{ background: isSuspend ? '#fff7ed' : '#dcfce7' }}>
            {isSuspend
              ? <Ban size={26} className="text-[#f97316]" />
              : <CheckCircle2 size={26} className="text-[#166534]" />}
          </div>
          <h3 className="text-[18px] font-bold text-[#0b1c30] mb-2">
            {isSuspend ? 'Institution Suspended' : 'Institution Activated'}
          </h3>
          <p className="text-[14px] text-[#64748b] leading-6 mb-6">
            {isSuspend
              ? `${inst.name} has been suspended. All assets have been queued for cleanup.`
              : `${inst.name} is now active and can place new orders immediately.`}
          </p>
          <button onClick={onClose}
            className="px-6 py-2.5 rounded-lg bg-[#004ac6] text-white text-[14px] font-semibold hover:bg-[#003da6] transition-colors">
            Done
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-[0px_20px_60px_rgba(0,0,0,0.18)] w-[460px] flex flex-col overflow-hidden">

        <div className="flex items-start justify-between px-6 pt-6 pb-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
              style={{ background: isSuspend ? '#fff7ed' : '#f0fdf4' }}>
              {isSuspend
                ? <Ban size={18} className="text-[#f97316]" />
                : <CheckCircle2 size={18} className="text-[#22c55e]" />}
            </div>
            <div>
              <h2 className="text-[18px] font-bold text-[#0b1c30]">
                {isSuspend ? 'Suspend Institution' : 'Activate Institution'}
              </h2>
              <p className="text-[13px] text-[#64748b] mt-0.5">
                {isSuspend
                  ? 'Assets will be purged. This is logged to the Audit Log.'
                  : 'Access will be restored immediately.'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors">
            <X size={16} className="text-[#64748b]" />
          </button>
        </div>

        {/* Institution card */}
        <div className="mx-6 mb-4 flex items-center gap-3 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl px-4 py-3">
          <div className="w-10 h-10 rounded-lg bg-[#e5eeff] flex items-center justify-center shrink-0">
            <Building2 size={18} className="text-[#004ac6]" />
          </div>
          <div className="min-w-0">
            <div className="text-[15px] font-semibold text-[#0b1c30] truncate">{inst.name}</div>
            <div className="text-[12px] text-[#64748b] truncate">{inst.contact_person} · {inst.contact_email}</div>
          </div>
        </div>

        {/* Warning / info banner */}
        <div className={cn('mx-6 mb-4 flex items-start gap-2.5 rounded-xl px-4 py-3 border',
          isSuspend ? 'bg-[#fff7ed] border-[#fed7aa]' : 'bg-[#f0fdf4] border-[#bbf7d0]')}>
          {isSuspend
            ? <AlertTriangle size={14} className="text-[#f97316] shrink-0 mt-0.5" />
            : <CheckCircle2 size={14} className="text-[#22c55e] shrink-0 mt-0.5" />}
          <p className={cn('text-[13px] leading-5', isSuspend ? 'text-[#92400e]' : 'text-[#166534]')}>
            {isSuspend
              ? 'Suspending will revoke login access and trigger Cloudinary asset cleanup for all student photos and ID cards.'
              : 'The institution will regain full access and can log in and place new orders immediately.'}
          </p>
        </div>

        <div className="px-6 pb-6 flex flex-col gap-4">
          {isSuspend && (
            <div>
              <label className="text-[12px] font-bold text-[#64748b] tracking-[0.55px] uppercase block mb-2">
                Reason <span className="text-[#94a3b8] font-normal">(optional)</span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Describe the reason for suspension…"
                rows={2}
                className="w-full border border-[#e2e8f0] rounded-xl px-4 py-3 text-[14px] text-[#0b1c30] placeholder-[#94a3b8] resize-none focus:outline-none focus:border-[#004ac6] focus:ring-1 focus:ring-[#004ac6]"
              />
            </div>
          )}

          {error && (
            <div className="px-4 py-2 bg-red-50 border border-red-200 rounded-xl text-[13px] text-red-700">{error}</div>
          )}

          <div className="flex items-center justify-end gap-3">
            <button onClick={onClose}
              className="px-4 py-2 rounded-lg border border-[#e2e8f0] text-[14px] font-medium text-[#434655] hover:bg-[#f8fafc] transition-colors">
              Cancel
            </button>
            <button
              onClick={async () => { await onConfirm(reason || undefined); setDone(true) }}
              disabled={loading}
              className={cn(
                'px-5 py-2 rounded-lg text-white text-[14px] font-semibold transition-colors flex items-center gap-2 disabled:opacity-40',
                isSuspend ? 'bg-[#b91c1c] hover:bg-[#991b1b]' : 'bg-[#15803d] hover:bg-[#166534]',
              )}>
              {loading
                ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : isSuspend ? <Ban size={14} /> : <CheckCircle2 size={14} />}
              {loading ? 'Saving…' : isSuspend ? 'Suspend Institution' : 'Activate Institution'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Create Institution Modal ───────────────────────────────────────────────────

function CreateInstitutionModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const { createInstitution, loading, error } = useCreateInstitution()
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: '', email: '', contact_person: '', contact_phone: '',
    address: '', order_quota: '', contract_ends_at: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setLogoFile(file)
      setLogoPreview(URL.createObjectURL(file))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await createInstitution({
      ...form,
      logo: logoFile ?? undefined,
      order_quota: form.order_quota ? parseInt(form.order_quota) : null,
      contract_ends_at: form.contract_ends_at || null,
    })
    if (res) { onSuccess(); onClose() }
  }

  const fields: { name: keyof typeof form; label: string; type: string; required?: boolean }[] = [
    { name: 'name',           label: 'Institution Name', type: 'text',  required: true },
    { name: 'email',          label: 'Contact Email',    type: 'email', required: true },
    { name: 'contact_person', label: 'Contact Person',   type: 'text',  required: true },
    { name: 'contact_phone',  label: 'Phone',            type: 'text'  },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-[0px_20px_60px_rgba(0,0,0,0.18)] w-[540px] max-h-[90vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#e5eeff] flex items-center justify-center">
              <Building2 size={16} className="text-[#004ac6]" />
            </div>
            <div>
              <h2 className="text-[18px] font-bold text-[#0b1c30]">Add Institution</h2>
              <p className="text-[12px] text-[#64748b] mt-0.5">An activation email will be sent to the contact</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors">
            <X size={16} className="text-[#64748b]" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4">

          {/* Logo upload */}
          <div>
            <label className="text-[12px] font-bold text-[#64748b] tracking-[0.55px] uppercase block mb-2">Logo</label>
            <label className={cn(
              'flex items-center gap-3 border-2 border-dashed rounded-xl px-4 py-3 cursor-pointer transition-colors',
              logoPreview ? 'border-[#004ac6] bg-[#eff4ff]' : 'border-[#e2e8f0] hover:border-[#004ac6] hover:bg-[#f8fafc]',
            )}>
              {logoPreview ? (
                <img src={logoPreview} alt="logo" className="w-10 h-10 rounded-lg object-cover shrink-0" />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-[#e5eeff] flex items-center justify-center shrink-0">
                  <Upload size={16} className="text-[#004ac6]" />
                </div>
              )}
              <div className="min-w-0">
                <div className="text-[13px] font-medium text-[#0b1c30]">
                  {logoFile ? logoFile.name : 'Upload institution logo'}
                </div>
                <div className="text-[11px] text-[#94a3b8]">PNG, JPG up to 5MB</div>
              </div>
              <input type="file" accept="image/*" onChange={handleFile} className="hidden" />
            </label>
          </div>

          {/* Text fields */}
          <div className="grid grid-cols-2 gap-3">
            {fields.map((f) => (
              <div key={f.name} className={f.name === 'name' || f.name === 'email' ? 'col-span-2' : ''}>
                <label className="text-[12px] font-bold text-[#64748b] tracking-[0.55px] uppercase block mb-2">
                  {f.label} {f.required && <span className="text-red-600">*</span>}
                </label>
                <input
                  name={f.name}
                  type={f.type}
                  value={form[f.name]}
                  onChange={handleChange}
                  required={f.required}
                  disabled={loading}
                  className="w-full border border-[#e2e8f0] rounded-xl px-4 py-2.5 text-[14px] text-[#0b1c30] placeholder-[#94a3b8] focus:outline-none focus:border-[#004ac6] focus:ring-1 focus:ring-[#004ac6]"
                />
              </div>
            ))}
          </div>

          {/* Address */}
          <div>
            <label className="text-[12px] font-bold text-[#64748b] tracking-[0.55px] uppercase block mb-2">Address</label>
            <textarea
              name="address"
              value={form.address}
              onChange={handleChange}
              rows={2}
              disabled={loading}
              className="w-full border border-[#e2e8f0] rounded-xl px-4 py-2.5 text-[14px] text-[#0b1c30] placeholder-[#94a3b8] resize-none focus:outline-none focus:border-[#004ac6] focus:ring-1 focus:ring-[#004ac6]"
            />
          </div>

          {/* Order quota + contract date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[12px] font-bold text-[#64748b] tracking-[0.55px] uppercase block mb-2">
                Order Quota <span className="text-[#94a3b8] font-normal">(blank = unlimited)</span>
              </label>
              <input
                name="order_quota"
                type="number"
                min="1"
                value={form.order_quota}
                onChange={handleChange}
                disabled={loading}
                placeholder="e.g. 10"
                className="w-full border border-[#e2e8f0] rounded-xl px-4 py-2.5 text-[14px] text-[#0b1c30] placeholder-[#94a3b8] focus:outline-none focus:border-[#004ac6] focus:ring-1 focus:ring-[#004ac6]"
              />
            </div>
            <div>
              <label className="text-[12px] font-bold text-[#64748b] tracking-[0.55px] uppercase block mb-2">
                Contract End Date <span className="text-[#94a3b8] font-normal">(optional)</span>
              </label>
              <input
                name="contract_ends_at"
                type="date"
                value={form.contract_ends_at}
                onChange={handleChange}
                disabled={loading}
                className="w-full border border-[#e2e8f0] rounded-xl px-4 py-2.5 text-[14px] text-[#0b1c30] focus:outline-none focus:border-[#004ac6] focus:ring-1 focus:ring-[#004ac6]"
              />
            </div>
          </div>

          {error && (
            <div className="px-4 py-2 bg-red-50 border border-red-200 rounded-xl text-[13px] text-red-700">{error}</div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-1">
            <button type="button" onClick={onClose} disabled={loading}
              className="px-4 py-2 rounded-lg border border-[#e2e8f0] text-[14px] font-medium text-[#434655] hover:bg-[#f8fafc] transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading || !form.name || !form.email || !form.contact_person}
              className="px-5 py-2 rounded-lg bg-[#004ac6] text-white text-[14px] font-semibold hover:bg-[#003da6] disabled:opacity-40 transition-colors flex items-center gap-2">
              {loading
                ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Creating…</>
                : <><Building2 size={14} /> Add Institution</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Grid card ──────────────────────────────────────────────────────────────────

function InstitutionCard({
  inst, selected, onToggle, onSuspend, onActivate,
}: {
  inst: Institution
  selected: boolean
  onToggle: () => void
  onSuspend: (i: Institution) => void
  onActivate: (i: Institution) => void
}) {
  const cfg = STATUS_CFG[inst.status]
  const canActivate = inst.status !== 'ACTIVE'
  return (
    <div className={cn(
      'bg-white rounded-2xl border p-4 flex flex-col gap-3 transition-all hover:shadow-md cursor-default',
      selected ? 'border-[#004ac6] shadow-[0px_0px_0px_2px_rgba(0,74,198,0.12)]' : 'border-[#c3c6d7]',
    )}>
      <div className="flex items-start gap-2.5">
        <input type="checkbox" checked={selected} onChange={onToggle}
          className="w-4 h-4 rounded border-[#c3c6d7] accent-[#004ac6] cursor-pointer shrink-0 mt-0.5" />
        <div className="w-9 h-9 rounded-lg bg-[#e5eeff] flex items-center justify-center shrink-0">
          {inst.logo_url
            ? <img src={inst.logo_url} alt={inst.name} className="w-full h-full object-cover rounded-lg" />
            : <Building2 size={16} className="text-[#004ac6]" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[14px] font-semibold text-[#0b1c30] truncate">{inst.name}</div>
          <div className="text-[11px] text-[#64748b] truncate">{inst.contact_person}</div>
        </div>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold shrink-0"
          style={{ background: cfg.bg, color: cfg.text }}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.dot }} />
          {cfg.label}
        </span>
      </div>
      <div className="text-[12px] text-[#64748b] truncate">{inst.contact_email}</div>
      <div className="flex items-center justify-between pt-1 border-t border-gray-100">
        <span className="text-[11px] text-[#94a3b8]">{new Date(inst.created_at).toLocaleDateString()}</span>
        <div className="flex items-center gap-1">
          {canActivate ? (
            <button onClick={() => onActivate(inst)}
              className="text-[11px] font-medium text-[#15803d] px-2 py-0.5 rounded hover:bg-[#f0fdf4] transition-colors">
              Activate
            </button>
          ) : (
            <button onClick={() => onSuspend(inst)}
              className="text-[11px] font-medium text-[#c2410c] px-2 py-0.5 rounded hover:bg-[#fff7ed] transition-colors">
              Suspend
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────

const InstitutionsPage = () => {
  const navigate = useNavigate()
  const { institutions, loading, error, refetch } = useInstitutions()
  const updateInst = useUpdateInstitution()

  const [modal, setModal]    = useState<ModalType>(null)
  const [selInst, setSelInst] = useState<Institution | null>(null)
  const [rowSel, setRowSel]  = useState<Set<number>>(new Set())
  const [view, setView]      = useState<'table' | 'grid'>('table')

  // Filters
  const [search, setSearch]     = useState('')
  const [statusF, setStatusF]   = useState<InstStatus | ''>('')
  const [page, setPage]         = useState(1)

  // Toast
  const [toastMsg, setToastMsg] = useState<string | null>(null)
  const toast = (msg: string) => { setToastMsg(msg); setTimeout(() => setToastMsg(null), 3000) }

  useEffect(() => { setPage(1) }, [search, statusF])

  const list = institutions as Institution[]

  const filtered = useMemo(() => list.filter((inst) => {
    const q = search.toLowerCase()
    const matchSearch = !q ||
      inst.name.toLowerCase().includes(q) ||
      inst.contact_person.toLowerCase().includes(q) ||
      inst.contact_email.toLowerCase().includes(q)
    const matchStatus = !statusF || inst.status === statusF
    return matchSearch && matchStatus
  }), [list, search, statusF])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const pageData   = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  const allRowsSel = pageData.length > 0 && pageData.every((i) => rowSel.has(i.id))
  const toggleAll  = () => setRowSel(allRowsSel ? new Set() : new Set(pageData.map((i) => i.id)))
  const toggleRow  = (id: number) => {
    const next = new Set(rowSel); next.has(id) ? next.delete(id) : next.add(id); setRowSel(next)
  }

  const openModal = (m: ModalType, inst: Institution) => { setSelInst(inst); setModal(m) }
  const closeModal = () => { setModal(null); setSelInst(null) }

  const totalCount    = list.length
  const activeCount   = list.filter((i) => i.status === 'ACTIVE').length
  const suspendCount  = list.filter((i) => i.status === 'SUSPENDED').length

  const handleSuspend = async (reason?: string) => {
    if (!selInst) return
    await updateInst.updateInstitution(selInst.id, {
      status: 'SUSPENDED',
      suspended_reason: reason,
    })
    refetch()
    toast('Institution suspended')
  }

  const handleActivate = async () => {
    if (!selInst) return
    await updateInst.updateInstitution(selInst.id, { status: 'ACTIVE' })
    refetch()
    toast('Institution activated')
  }

  return (
    <div className="flex flex-col gap-5">

      {/* Page header */}
      <div className="flex items-end justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-[12px]">
            <button onClick={() => navigate('/admin/dashboard')} className="text-[#64748b] hover:text-[#004ac6] transition-colors">
              Dashboard
            </button>
            <ChevronRight size={10} className="text-[#94a3b8]" />
            <span className="text-[#004ac6] font-medium">Institutions</span>
          </div>
          <h1 className="text-[24px] font-bold text-[#0b1c30] tracking-tight">Institution Management</h1>
        </div>
        <button
          onClick={() => setModal('create')}
          className="flex items-center gap-2 bg-[#004ac6] text-white text-[14px] font-semibold px-5 py-2.5 rounded-lg hover:bg-[#003da6] transition-colors shadow-sm"
        >
          <Plus size={14} />
          Register Institution
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Institutions', value: totalCount,   color: 'text-[#0b1c30]'  },
          { label: 'Active',             value: activeCount,  color: 'text-[#047857]'  },
          { label: 'Suspended',          value: suspendCount, color: 'text-[#c2410c]'  },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-[#e2e8f0] p-5 shadow-sm">
            <p className="text-[11px] font-bold text-[#64748b] uppercase tracking-wider mb-1.5">{s.label}</p>
            <p className={cn('text-[32px] font-bold leading-none', s.color)}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters + view toggle */}
      <div className="bg-white border border-[#e2e8f0] rounded-xl shadow-sm">
        <div className="flex items-center gap-3 p-4 flex-wrap">
          <div className="relative flex-1 min-w-[240px]">
            <Search size={13.5} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8] pointer-events-none" />
            <input
              type="text"
              placeholder="Search institutions, contacts…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-lg pl-9 pr-4 py-2.5 text-[14px] text-[#0b1c30] placeholder-[#94a3b8] focus:outline-none focus:border-[#004ac6]"
            />
          </div>

          <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#94a3b8] uppercase tracking-widest">
            <Filter size={11} /> Status
          </div>
          <div className="relative">
            <select
              value={statusF}
              onChange={(e) => setStatusF(e.target.value as InstStatus | '')}
              className="appearance-none bg-[#f8fafc] border border-[#e2e8f0] rounded-lg pl-3 pr-8 py-2.5 text-[14px] text-[#0b1c30] cursor-pointer focus:outline-none focus:border-[#004ac6]"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
            <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6b7280] pointer-events-none" />
          </div>

          <button onClick={() => { setSearch(''); setStatusF('') }}
            disabled={!search && !statusF}
            className="text-[12px] font-semibold text-[#004ac6] hover:underline disabled:opacity-30 disabled:no-underline">
            Clear
          </button>

          <button onClick={() => refetch()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#e2e8f0] text-[13px] text-[#434655] hover:bg-gray-50 transition-colors">
            <RefreshCw size={13} />
          </button>

          {/* View toggle */}
          <div className="ml-auto flex items-center p-1 rounded-lg bg-[#f1f5f9]">
            <button onClick={() => setView('table')}
              className={cn('w-8 h-8 flex items-center justify-center rounded transition-colors',
                view === 'table' ? 'bg-white shadow-sm' : 'hover:bg-white/50')}>
              <List size={16} className={view === 'table' ? 'text-[#004ac6]' : 'text-[#94a3b8]'} />
            </button>
            <button onClick={() => setView('grid')}
              className={cn('w-8 h-8 flex items-center justify-center rounded transition-colors',
                view === 'grid' ? 'bg-white shadow-sm' : 'hover:bg-white/50')}>
              <LayoutGrid size={16} className={view === 'grid' ? 'text-[#004ac6]' : 'text-[#94a3b8]'} />
            </button>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-4 text-[13px] text-red-700">{error}</div>
      )}

      {/* Table view */}
      {view === 'table' && (
        <div className="bg-white border border-[#e2e8f0] rounded-xl shadow-sm overflow-hidden">
          {/* Bulk bar */}
          {rowSel.size > 0 && (
            <div className="bg-[#004ac6] flex items-center justify-between px-6 py-2.5">
              <div className="flex items-center gap-4">
                <span className="text-white text-[13px] font-medium">{rowSel.size} selected</span>
                <div className="w-px h-4 bg-white/30" />
                {['Export', 'Deactivate All'].map((a) => (
                  <button key={a} className="text-white text-[13px] font-medium px-3 py-1 rounded hover:bg-white/10 transition-colors">{a}</button>
                ))}
              </div>
              <button onClick={() => setRowSel(new Set())}
                className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors">
                <X size={15} className="text-white" />
              </button>
            </div>
          )}

          {loading ? (
            <div className="py-14 flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-[#004ac6] border-t-transparent rounded-full animate-spin" />
              <p className="text-[13px] text-[#64748b]">Loading institutions…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-14 text-center text-[14px] text-[#64748b]">No institutions found.</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[820px] border-collapse">
                  <thead>
                    <tr className="bg-[#f8fafc] border-b border-[#f1f5f9]">
                      <th className="w-12 px-5 py-3">
                        <input type="checkbox" checked={allRowsSel} onChange={toggleAll}
                          className="w-4 h-4 rounded border-[#cbd5e1] accent-[#004ac6] cursor-pointer" />
                      </th>
                      <th className="w-14 px-3 py-3 text-[11px] font-bold text-[#64748b] tracking-[0.55px] uppercase">Logo</th>
                      <th className="text-left px-4 py-3 text-[11px] font-bold text-[#64748b] tracking-[0.55px] uppercase">Institution</th>
                      <th className="text-left px-4 py-3 text-[11px] font-bold text-[#64748b] tracking-[0.55px] uppercase">Contact Person</th>
                      <th className="text-left px-4 py-3 text-[11px] font-bold text-[#64748b] tracking-[0.55px] uppercase">Status</th>
                      <th className="text-left px-4 py-3 text-[11px] font-bold text-[#64748b] tracking-[0.55px] uppercase">Created</th>
                      <th className="text-right px-5 py-3 text-[11px] font-bold text-[#64748b] tracking-[0.55px] uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageData.map((inst) => {
                      const cfg    = STATUS_CFG[inst.status]
                      const isSel  = rowSel.has(inst.id)
                      const canAct = inst.status !== 'ACTIVE'
                      return (
                        <tr key={inst.id} className={cn('border-t border-[#f1f5f9] hover:bg-[#f8fafc] transition-colors', isSel && 'bg-[#f8fafc]')}>
                          <td className="w-12 px-5 py-4">
                            <input type="checkbox" checked={isSel} onChange={() => toggleRow(inst.id)}
                              className="w-4 h-4 rounded border-[#cbd5e1] accent-[#004ac6] cursor-pointer" />
                          </td>
                          <td className="px-3 py-4">
                            <div className="w-10 h-10 rounded-lg bg-[#e5eeff] flex items-center justify-center overflow-hidden">
                              {inst.logo_url
                                ? <img src={inst.logo_url} alt={inst.name} className="w-full h-full object-cover" />
                                : <Building2 size={16} className="text-[#004ac6]" />}
                            </div>
                          </td>
                          <td className="px-4 py-4 min-w-[200px]">
                            <div className="text-[14px] font-semibold text-[#0b1c30]">{inst.name}</div>
                            <div className="text-[12px] text-[#64748b] truncate max-w-[220px]">{inst.address || '—'}</div>
                          </td>
                          <td className="px-4 py-4 min-w-[160px]">
                            <div className="text-[14px] text-[#0b1c30]">{inst.contact_person}</div>
                            <div className="text-[12px] text-[#64748b]">{inst.contact_email}</div>
                          </td>
                          <td className="px-4 py-4">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold"
                              style={{ background: cfg.bg, color: cfg.text }}>
                              <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.dot }} />
                              {cfg.label}
                            </span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-[13px] text-[#64748b]">
                            {new Date(inst.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center justify-end gap-1">
                              <button title="Edit" className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#f1f5f9] transition-colors">
                                <Pencil size={13.5} className="text-[#94a3b8]" />
                              </button>
                              <button title="View" className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#f1f5f9] transition-colors">
                                <Eye size={13.5} className="text-[#94a3b8]" />
                              </button>
                              <div className="w-px h-4 bg-[#e2e8f0] mx-0.5" />
                              {canAct ? (
                                <button title="Activate" onClick={() => openModal('activate', inst)}
                                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#f0fdf4] transition-colors">
                                  <CheckCircle size={13.5} className="text-[#22c55e]" />
                                </button>
                              ) : (
                                <button title="Suspend" onClick={() => openModal('suspend', inst)}
                                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#fff7ed] transition-colors">
                                  <Ban size={13.5} className="text-[#f97316]" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              <TablePager total={filtered.length} page={page} totalPages={totalPages} onPage={setPage} />
            </>
          )}
        </div>
      )}

      {/* Grid view */}
      {view === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            <div className="col-span-3 py-14 text-center text-[13px] text-[#64748b]">Loading institutions…</div>
          ) : filtered.length === 0 ? (
            <div className="col-span-3 py-14 text-center text-[13px] text-[#64748b]">No institutions found.</div>
          ) : pageData.map((inst) => (
            <InstitutionCard
              key={inst.id}
              inst={inst}
              selected={rowSel.has(inst.id)}
              onToggle={() => toggleRow(inst.id)}
              onSuspend={(i) => openModal('suspend', i)}
              onActivate={(i) => openModal('activate', i)}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {modal === 'create' && (
        <CreateInstitutionModal
          onClose={closeModal}
          onSuccess={() => { refetch(); toast('Institution created'); closeModal() }}
        />
      )}
      {modal === 'suspend' && selInst && (
        <AccountStatusModal
          action="suspend"
          inst={selInst}
          loading={updateInst.loading}
          error={updateInst.error}
          onConfirm={handleSuspend}
          onClose={closeModal}
        />
      )}
      {modal === 'activate' && selInst && (
        <AccountStatusModal
          action="activate"
          inst={selInst}
          loading={updateInst.loading}
          error={updateInst.error}
          onConfirm={handleActivate}
          onClose={closeModal}
        />
      )}

      {/* Toast */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 bg-[#166534] text-white px-5 py-3.5 rounded-xl shadow-lg flex items-center gap-3 z-50">
          <CheckCircle2 size={16} />
          <span className="text-[14px] font-semibold">{toastMsg}</span>
        </div>
      )}
    </div>
  )
}

export default InstitutionsPage
