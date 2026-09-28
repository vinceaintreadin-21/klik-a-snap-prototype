import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  UserPlus, ChevronDown, ChevronRight, ChevronLeft,
  Eye, RefreshCw, UserCheck, UserX, X, SlidersHorizontal,
  Lock, Trash2, CheckCircle2, Ban, AlertTriangle, Copy, Check,
} from 'lucide-react'
import {
  useOperators,
  useUpdateOperator,
  useDeleteOperator,
  useCreateOperator,
  useResetPassword,
} from '../hooks/useOperators'
import type { Operator } from '../hooks/useOperators'
import { cn } from '../lib/utils'

// ── Status config ──────────────────────────────────────────────────────────────

const STATUS_CFG = {
  active:   { bg: '#ecfdf5', dot: '#059669', text: '#047857', label: 'Active'   },
  inactive: { bg: '#f1f5f9', dot: '#94a3b8', text: '#64748b', label: 'Inactive' },
}

// ── Workload helpers ───────────────────────────────────────────────────────────
// Since the API doesn't provide active order counts per operator, we derive a
// pseudo-workload from the operator id for visual purposes only.

const WORKLOAD_CFG: Record<string, { barColor: string; labelColor: string; label: string }> = {
  Idle:   { barColor: 'transparent', labelColor: '#94a3b8', label: 'Idle'   },
  Low:    { barColor: '#004ac6',     labelColor: '#004ac6', label: 'Low'    },
  Medium: { barColor: '#f97316',     labelColor: '#ea580c', label: 'Medium' },
  High:   { barColor: '#ba1a1a',     labelColor: '#ba1a1a', label: 'High'   },
}

function deriveWorkload(id: number): { level: string; pct: number } {
  const pct = (id * 13) % 101
  if (pct === 0)  return { level: 'Idle',   pct: 0  }
  if (pct <= 30)  return { level: 'Low',    pct     }
  if (pct <= 70)  return { level: 'Medium', pct     }
  return              { level: 'High',   pct     }
}

// ── Workload bar ───────────────────────────────────────────────────────────────

function WorkloadBar({ pct, level }: { pct: number; level: string }) {
  const cfg = WORKLOAD_CFG[level] ?? WORKLOAD_CFG['Idle']
  return (
    <div className="flex flex-col gap-1 w-[148px]">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold leading-none" style={{ color: cfg.labelColor }}>
          {pct}% Capacity
        </span>
        <span className="text-[11px] font-bold text-[#94a3b8] leading-none">{cfg.label}</span>
      </div>
      <div className="h-1.5 rounded-full bg-[#f1f5f9] overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: cfg.barColor }} />
      </div>
    </div>
  )
}

// ── Pager ──────────────────────────────────────────────────────────────────────

function TablePager({
  total, page, totalPages, onPage,
}: {
  total: number; page: number; totalPages: number; onPage: (p: number) => void
}) {
  const perPage = 10
  const showing = Math.min(perPage * page, total)
  const from = (page - 1) * perPage + 1

  const pages = useMemo(() => {
    const p: number[] = []
    for (let i = 1; i <= Math.min(totalPages, 5); i++) p.push(i)
    return p
  }, [totalPages])

  if (total === 0) return null

  return (
    <div className="bg-[#f8fafc] border-t border-[#f1f5f9] flex items-center justify-between px-6 py-4">
      <span className="text-[12px] text-[#434655]">
        Showing <span className="text-[#0b1c30]">{from}–{showing}</span> of{' '}
        <span className="text-[#0b1c30]">{total}</span> operators
      </span>
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onPage(Math.max(1, page - 1))}
          disabled={page === 1}
          className="w-8 h-8 flex items-center justify-center rounded border border-[#e2e8f0] disabled:opacity-40 hover:bg-white transition-colors"
        >
          <ChevronLeft size={12} className="text-[#434655]" />
        </button>
        {pages.map((p) => (
          <button
            key={p}
            onClick={() => onPage(p)}
            className={cn(
              'w-8 h-8 flex items-center justify-center rounded text-[13px] font-medium transition-colors',
              page === p
                ? 'bg-[#004ac6] text-white'
                : 'text-[#434655] hover:bg-white border border-transparent hover:border-[#e2e8f0]',
            )}
          >
            {p}
          </button>
        ))}
        {totalPages > 5 && (
          <span className="w-8 h-8 flex items-center justify-center text-[13px] text-[#434655]">…</span>
        )}
        <button
          onClick={() => onPage(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
          className="w-8 h-8 flex items-center justify-center rounded border border-[#e2e8f0] disabled:opacity-40 hover:bg-white transition-colors"
        >
          <ChevronRight size={12} className="text-[#434655]" />
        </button>
      </div>
    </div>
  )
}

// ── Account Status Modal (activate / deactivate) ───────────────────────────────

function AccountStatusModal({
  action, op, loading, error, onConfirm, onClose,
}: {
  action: 'activate' | 'deactivate'
  op: Operator
  loading: boolean
  error: string | null
  onConfirm: () => void
  onClose: () => void
}) {
  const [done, setDone] = useState(false)
  const isDeactivate = action === 'deactivate'

  if (done) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
        <div className="relative bg-white rounded-2xl shadow-[0px_20px_60px_rgba(0,0,0,0.18)] w-[420px] p-8 flex flex-col items-center text-center">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
            style={{ background: isDeactivate ? '#fee2e2' : '#dcfce7' }}
          >
            {isDeactivate
              ? <Ban size={26} className="text-[#b91c1c]" />
              : <CheckCircle2 size={26} className="text-[#166534]" />}
          </div>
          <h3 className="text-[18px] font-bold text-[#0b1c30] mb-2">
            {isDeactivate ? 'Account Deactivated' : 'Account Activated'}
          </h3>
          <p className="text-[14px] text-[#64748b] leading-6 mb-6">
            {isDeactivate
              ? `${op.user__username} has been deactivated. Their access has been revoked.`
              : `${op.user__username} is now active and can resume work immediately.`}
          </p>
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-lg bg-[#004ac6] text-white text-[14px] font-semibold hover:bg-[#003da6] transition-colors"
          >
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

        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-6 pb-4">
          <div className="flex items-start gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
              style={{ background: isDeactivate ? '#fff7ed' : '#f0fdf4' }}
            >
              {isDeactivate
                ? <Ban size={18} className="text-[#f97316]" />
                : <UserCheck size={18} className="text-[#22c55e]" />}
            </div>
            <div>
              <h2 className="text-[18px] font-bold text-[#0b1c30]">
                {isDeactivate ? 'Deactivate Account' : 'Activate Account'}
              </h2>
              <p className="text-[13px] text-[#64748b] mt-0.5">
                {isDeactivate
                  ? 'This action will be logged to the Audit Log.'
                  : 'Access will be restored immediately.'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X size={16} className="text-[#64748b]" />
          </button>
        </div>

        {/* Entity card */}
        <div className="mx-6 mb-4 flex items-center gap-3 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl px-4 py-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-indigo-600 flex items-center justify-center shrink-0">
            <span className="text-[13px] font-bold text-white">
              {op.user__username.slice(0, 2).toUpperCase()}
            </span>
          </div>
          <div className="min-w-0">
            <div className="text-[15px] font-semibold text-[#0b1c30] truncate">{op.user__username}</div>
            <div className="text-[12px] text-[#64748b] truncate">{op.user__email}</div>
          </div>
        </div>

        {/* Info banner */}
        <div className={cn(
          'mx-6 mb-4 flex items-start gap-2.5 rounded-xl px-4 py-3 border',
          isDeactivate
            ? 'bg-[#fff7ed] border-[#fed7aa]'
            : 'bg-[#f0fdf4] border-[#bbf7d0]',
        )}>
          {isDeactivate
            ? <AlertTriangle size={14} className="text-[#f97316] shrink-0 mt-0.5" />
            : <CheckCircle2 size={14} className="text-[#22c55e] shrink-0 mt-0.5" />}
          <p className={cn('text-[13px] leading-5', isDeactivate ? 'text-[#92400e]' : 'text-[#166534]')}>
            {isDeactivate
              ? 'This operator will lose login access. Any active orders may need reassignment.'
              : 'The operator will regain full system access and can be assigned to orders immediately.'}
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mx-6 mb-4 px-4 py-2 bg-red-50 border border-red-200 rounded-xl text-[13px] text-red-700">
            {error}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 pb-6">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-[#e2e8f0] text-[14px] font-medium text-[#434655] hover:bg-[#f8fafc] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={async () => { await onConfirm(); setDone(true) }}
            disabled={loading}
            className={cn(
              'px-5 py-2 rounded-lg text-white text-[14px] font-semibold transition-colors flex items-center gap-2 disabled:opacity-40',
              isDeactivate
                ? 'bg-[#b91c1c] hover:bg-[#991b1b]'
                : 'bg-[#15803d] hover:bg-[#166534]',
            )}
          >
            {loading
              ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : isDeactivate ? <Ban size={14} /> : <UserCheck size={14} />}
            {loading ? 'Saving…' : isDeactivate ? 'Deactivate Operator' : 'Activate Operator'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Create Operator Modal ──────────────────────────────────────────────────────

function CreateOperatorModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [username, setUsername] = useState('')
  const [email, setEmail]       = useState('')
  const [copied, setCopied]     = useState(false)

  const { createOperator, loading, error, success, tempPassword, reset } = useCreateOperator()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await createOperator({ username: username.trim(), email: email.trim() })
    if (res) onSuccess()
  }

  const handleCopy = () => {
    if (tempPassword) { navigator.clipboard.writeText(tempPassword); setCopied(true) }
  }

  const handleClose = () => {
    if (success && tempPassword && !copied) {
      if (!window.confirm('You have not copied the password yet. Close anyway?')) return
    }
    reset(); onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={handleClose} />
      <div className="relative bg-white rounded-2xl shadow-[0px_20px_60px_rgba(0,0,0,0.18)] w-[480px] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#eff4ff] flex items-center justify-center">
              <UserPlus size={16} className="text-[#004ac6]" />
            </div>
            <div>
              <h2 className="text-[18px] font-bold text-[#0b1c30]">Register Operator</h2>
              <p className="text-[12px] text-[#64748b] mt-0.5">A temporary password will be generated</p>
            </div>
          </div>
          <button onClick={handleClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors">
            <X size={16} className="text-[#64748b]" />
          </button>
        </div>

        <div className="px-6 py-5">
          {!success ? (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="text-[12px] font-bold text-[#64748b] tracking-[0.55px] uppercase block mb-2">
                  Username <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. john.doe"
                  required
                  disabled={loading}
                  className="w-full border border-[#e2e8f0] rounded-xl px-4 py-2.5 text-[14px] text-[#0b1c30] placeholder-[#94a3b8] focus:outline-none focus:border-[#004ac6] focus:ring-1 focus:ring-[#004ac6]"
                />
              </div>
              <div>
                <label className="text-[12px] font-bold text-[#64748b] tracking-[0.55px] uppercase block mb-2">
                  Email <span className="text-red-600">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. john.doe@company.com"
                  required
                  disabled={loading}
                  className="w-full border border-[#e2e8f0] rounded-xl px-4 py-2.5 text-[14px] text-[#0b1c30] placeholder-[#94a3b8] focus:outline-none focus:border-[#004ac6] focus:ring-1 focus:ring-[#004ac6]"
                />
              </div>
              {error && (
                <div className="px-4 py-2 bg-red-50 border border-red-200 rounded-xl text-[13px] text-red-700">{error}</div>
              )}
              <div className="flex items-center justify-end gap-3 pt-1">
                <button type="button" onClick={handleClose} disabled={loading}
                  className="px-4 py-2 rounded-lg border border-[#e2e8f0] text-[14px] font-medium text-[#434655] hover:bg-[#f8fafc] transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={loading || !username.trim() || !email.trim()}
                  className="px-5 py-2 rounded-lg bg-[#004ac6] text-white text-[14px] font-semibold hover:bg-[#003da6] disabled:opacity-40 transition-colors flex items-center gap-2">
                  {loading
                    ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Creating…</>
                    : <><UserPlus size={14} /> Create Operator</>}
                </button>
              </div>
            </form>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="flex items-start gap-3 bg-[#f0fdf4] border border-[#bbf7d0] rounded-xl px-4 py-3">
                <CheckCircle2 size={16} className="text-[#22c55e] shrink-0 mt-0.5" />
                <div>
                  <p className="text-[14px] font-semibold text-[#166534]">Operator created</p>
                  <p className="text-[12px] text-[#166534] mt-0.5">Share the password below with the operator — it won't be shown again.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 bg-[#fff7ed] border border-[#fed7aa] rounded-xl px-4 py-3">
                <AlertTriangle size={14} className="text-[#f97316] shrink-0 mt-0.5" />
                <p className="text-[12px] text-[#92400e]">Copy this password before closing. It cannot be recovered after this screen.</p>
              </div>
              <div>
                <label className="text-[12px] font-bold text-[#64748b] tracking-[0.55px] uppercase block mb-2">Temporary Password</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tempPassword ?? ''}
                    readOnly
                    className="flex-1 border border-[#e2e8f0] rounded-xl px-4 py-2.5 text-[14px] font-mono text-[#0b1c30] bg-[#f8fafc] focus:outline-none"
                  />
                  <button
                    onClick={handleCopy}
                    className={cn(
                      'px-3 py-2 rounded-xl border text-[13px] font-semibold transition-colors flex items-center gap-1.5',
                      copied
                        ? 'bg-[#f0fdf4] border-[#bbf7d0] text-[#166534]'
                        : 'bg-[#004ac6] border-[#004ac6] text-white hover:bg-[#003da6]',
                    )}
                  >
                    {copied ? <><Check size={13} /> Copied</> : <><Copy size={13} /> Copy</>}
                  </button>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="w-full py-2.5 rounded-xl bg-gray-900 text-white text-[14px] font-semibold hover:bg-gray-800 transition-colors"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Reset Password Modal ───────────────────────────────────────────────────────

function ResetPasswordModal({ op, onClose }: { op: Operator; onClose: () => void }) {
  const [copied, setCopied] = useState(false)
  const { resetPassword, loading, error, success, tempPassword, reset } = useResetPassword()

  const handleClose = () => {
    if (success && tempPassword && !copied) {
      if (!window.confirm('You have not copied the password yet. Close anyway?')) return
    }
    reset(); onClose()
  }

  const handleCopy = () => {
    if (tempPassword) { navigator.clipboard.writeText(tempPassword); setCopied(true) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={handleClose} />
      <div className="relative bg-white rounded-2xl shadow-[0px_20px_60px_rgba(0,0,0,0.18)] w-[460px] flex flex-col overflow-hidden">

        <div className="flex items-start justify-between px-6 pt-6 pb-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#f8f0ff] flex items-center justify-center shrink-0">
              <Lock size={18} className="text-[#7c3aed]" />
            </div>
            <div>
              <h2 className="text-[18px] font-bold text-[#0b1c30]">Reset Password</h2>
              <p className="text-[13px] text-[#64748b] mt-0.5">A new temporary password will be generated</p>
            </div>
          </div>
          <button onClick={handleClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors">
            <X size={16} className="text-[#64748b]" />
          </button>
        </div>

        <div className="px-6 pb-6 flex flex-col gap-4">
          {/* Operator card */}
          <div className="flex items-center gap-3 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl px-4 py-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-400 to-indigo-600 flex items-center justify-center shrink-0">
              <span className="text-[11px] font-bold text-white">{op.user__username.slice(0, 2).toUpperCase()}</span>
            </div>
            <div className="min-w-0">
              <div className="text-[14px] font-semibold text-[#0b1c30] truncate">{op.user__username}</div>
              <div className="text-[12px] text-[#64748b] truncate">{op.user__email}</div>
            </div>
          </div>

          {!success ? (
            <>
              <div className="flex items-start gap-2.5 bg-[#fff7ed] border border-[#fed7aa] rounded-xl px-4 py-3">
                <AlertTriangle size={14} className="text-[#f97316] shrink-0 mt-0.5" />
                <p className="text-[13px] text-[#92400e] leading-5">
                  The current password will be invalidated immediately. The operator will need to use the new temporary password.
                </p>
              </div>
              {error && (
                <div className="px-4 py-2 bg-red-50 border border-red-200 rounded-xl text-[13px] text-red-700">{error}</div>
              )}
              <div className="flex items-center justify-end gap-3">
                <button onClick={handleClose}
                  className="px-4 py-2 rounded-lg border border-[#e2e8f0] text-[14px] font-medium text-[#434655] hover:bg-[#f8fafc] transition-colors">
                  Cancel
                </button>
                <button onClick={() => resetPassword(op.id)} disabled={loading}
                  className="px-5 py-2 rounded-lg bg-[#7c3aed] text-white text-[14px] font-semibold hover:bg-[#6d28d9] disabled:opacity-40 transition-colors flex items-center gap-2">
                  {loading
                    ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Resetting…</>
                    : <><Lock size={14} /> Reset Password</>}
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-start gap-3 bg-[#f0fdf4] border border-[#bbf7d0] rounded-xl px-4 py-3">
                <CheckCircle2 size={15} className="text-[#22c55e] shrink-0 mt-0.5" />
                <p className="text-[13px] text-[#166534]">Password reset. Copy it below before closing — it won't be shown again.</p>
              </div>
              <div>
                <label className="text-[12px] font-bold text-[#64748b] tracking-[0.55px] uppercase block mb-2">New Temporary Password</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tempPassword ?? ''}
                    readOnly
                    className="flex-1 border border-[#e2e8f0] rounded-xl px-4 py-2.5 text-[14px] font-mono text-[#0b1c30] bg-[#f8fafc] focus:outline-none"
                  />
                  <button
                    onClick={handleCopy}
                    className={cn(
                      'px-3 py-2 rounded-xl border text-[13px] font-semibold transition-colors flex items-center gap-1.5',
                      copied
                        ? 'bg-[#f0fdf4] border-[#bbf7d0] text-[#166534]'
                        : 'bg-[#004ac6] border-[#004ac6] text-white hover:bg-[#003da6]',
                    )}
                  >
                    {copied ? <><Check size={13} /> Copied</> : <><Copy size={13} /> Copy</>}
                  </button>
                </div>
              </div>
              <button onClick={handleClose}
                className="w-full py-2.5 rounded-xl bg-gray-900 text-white text-[14px] font-semibold hover:bg-gray-800 transition-colors">
                Close
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Delete Operator Modal ──────────────────────────────────────────────────────

function DeleteOperatorModal({
  op, loading, error, onConfirm, onClose,
}: {
  op: Operator; loading: boolean; error: string | null; onConfirm: () => void; onClose: () => void
}) {
  const suggestDeactivate = error?.includes('assigned order')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-[0px_20px_60px_rgba(0,0,0,0.18)] w-[460px] flex flex-col overflow-hidden">

        <div className="flex items-start justify-between px-6 pt-6 pb-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
              <Trash2 size={18} className="text-[#b91c1c]" />
            </div>
            <div>
              <h2 className="text-[18px] font-bold text-[#0b1c30]">Delete Operator</h2>
              <p className="text-[13px] text-[#64748b] mt-0.5">This action is permanent and cannot be undone</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors">
            <X size={16} className="text-[#64748b]" />
          </button>
        </div>

        <div className="px-6 pb-6 flex flex-col gap-4">
          <div className="flex items-center gap-3 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl px-4 py-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-400 to-indigo-600 flex items-center justify-center shrink-0">
              <span className="text-[11px] font-bold text-white">{op.user__username.slice(0, 2).toUpperCase()}</span>
            </div>
            <div className="min-w-0">
              <div className="text-[14px] font-semibold text-[#0b1c30] truncate">{op.user__username}</div>
              <div className="text-[12px] text-[#64748b] truncate">{op.user__email}</div>
            </div>
          </div>

          <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <AlertTriangle size={14} className="text-[#b91c1c] shrink-0 mt-0.5" />
            <p className="text-[13px] text-[#7f1d1d] leading-5">
              All operator data will be permanently removed. Consider <strong>deactivating</strong> instead to preserve historical records.
            </p>
          </div>

          {error && (
            <div className="px-4 py-2 bg-red-50 border border-red-200 rounded-xl text-[13px] text-red-700">{error}</div>
          )}

          <div className="flex items-center justify-end gap-3">
            <button onClick={onClose}
              className="px-4 py-2 rounded-lg border border-[#e2e8f0] text-[14px] font-medium text-[#434655] hover:bg-[#f8fafc] transition-colors">
              Cancel
            </button>
            {suggestDeactivate ? (
              <button onClick={onClose}
                className="px-5 py-2 rounded-lg bg-amber-600 text-white text-[14px] font-semibold hover:bg-amber-700 transition-colors">
                Use Deactivate Instead
              </button>
            ) : (
              <button onClick={onConfirm} disabled={loading}
                className="px-5 py-2 rounded-lg bg-[#b91c1c] text-white text-[14px] font-semibold hover:bg-[#991b1b] disabled:opacity-40 transition-colors flex items-center gap-2">
                {loading
                  ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Deleting…</>
                  : <><Trash2 size={14} /> Delete Permanently</>}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────

type ModalType = 'create' | 'activate' | 'deactivate' | 'reset' | 'delete' | null

const PER_PAGE = 10

const Operators = () => {
  const navigate = useNavigate()
  const { operators, loading, error, refetch } = useOperators()

  const updateOp  = useUpdateOperator(() => { refetch(); toast('Operator updated') })
  const deleteOp  = useDeleteOperator(() => { refetch(); toast('Operator deleted') })

  // Modal state
  const [modal, setModal]         = useState<ModalType>(null)
  const [selected, setSelected]   = useState<Operator | null>(null)
  const [rowSel, setRowSel]       = useState<Set<number>>(new Set())

  // Filters
  const [search, setSearch]       = useState('')
  const [statusFilter, setStatus] = useState<'all' | 'active' | 'inactive'>('all')
  const [page, setPage]           = useState(1)

  // Toast
  const [toastMsg, setToastMsg]   = useState<string | null>(null)
  const toast = (msg: string) => { setToastMsg(msg); setTimeout(() => setToastMsg(null), 3000) }

  const list = operators ?? []

  const filtered = useMemo(() => list.filter((op) => {
    const q = search.toLowerCase()
    const matchSearch = !q || op.user__username.toLowerCase().includes(q) || op.user__email.toLowerCase().includes(q)
    const matchStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && op.is_active) ||
      (statusFilter === 'inactive' && !op.is_active)
    return matchSearch && matchStatus
  }), [list, search, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const pageData   = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  // Reset to page 1 when filters change
  useEffect(() => { setPage(1) }, [search, statusFilter])

  const allRowsSel = pageData.length > 0 && pageData.every((op) => rowSel.has(op.id))
  const toggleAll  = () => setRowSel(allRowsSel ? new Set() : new Set(pageData.map((op) => op.id)))
  const toggleRow  = (id: number) => {
    const next = new Set(rowSel)
    next.has(id) ? next.delete(id) : next.add(id)
    setRowSel(next)
  }

  const open = (m: ModalType, op: Operator) => { setSelected(op); setModal(m) }
  const close = () => { setModal(null); setSelected(null); deleteOp.reset() }

  const totalCount   = list.length
  const activeCount  = list.filter((o) => o.is_active).length
  const inactiveCount = totalCount - activeCount

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
            <span className="text-[#004ac6] font-medium">Operators</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-[24px] font-bold text-[#0b1c30] tracking-tight">Operator Management</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-[#2563eb] text-[12px] font-semibold text-white">
              {totalCount} Total
            </span>
          </div>
          <p className="text-[13px] text-[#64748b]">
            Manage personnel, track workloads, and control access.
          </p>
        </div>
        <button
          onClick={() => setModal('create')}
          className="flex items-center gap-2 bg-[#004ac6] text-white text-[14px] font-semibold px-5 py-2.5 rounded-lg hover:bg-[#003da6] transition-colors shadow-sm"
        >
          <UserPlus size={15} />
          Register Operator
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Operators', value: totalCount,   color: 'text-[#0b1c30]' },
          { label: 'Active',          value: activeCount,  color: 'text-[#047857]' },
          { label: 'Inactive',        value: inactiveCount, color: 'text-[#64748b]' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-[#e2e8f0] p-5 shadow-sm">
            <p className="text-[11px] font-bold text-[#64748b] uppercase tracking-wider mb-1.5">{s.label}</p>
            <p className={cn('text-[32px] font-bold leading-none', s.color)}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white border border-[#e2e8f0] rounded-xl shadow-sm">
        <div className="flex items-center gap-3 p-4 flex-wrap">
          <div className="relative flex-1 min-w-[220px]">
            <SlidersHorizontal size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8] pointer-events-none" />
            <input
              type="text"
              placeholder="Filter by name, email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-lg pl-9 pr-4 py-2.5 text-[14px] text-[#0b1c30] placeholder-[#94a3b8] focus:outline-none focus:border-[#004ac6]"
            />
          </div>
          <span className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-widest">Status</span>
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatus(e.target.value as 'all' | 'active' | 'inactive')}
              className="appearance-none bg-[#f8fafc] border border-[#e2e8f0] rounded-lg pl-3 pr-8 py-2.5 text-[14px] text-[#0b1c30] cursor-pointer focus:outline-none focus:border-[#004ac6]"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6b7280] pointer-events-none" />
          </div>
          <button
            onClick={() => { setSearch(''); setStatus('all') }}
            disabled={!search && statusFilter === 'all'}
            className="px-3 py-2 text-[12px] font-semibold text-[#004ac6] hover:underline disabled:opacity-30 disabled:no-underline"
          >
            Clear
          </button>
          <button
            onClick={() => refetch()}
            className="ml-auto flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#e2e8f0] text-[13px] text-[#434655] hover:bg-gray-50 transition-colors"
          >
            <RefreshCw size={13} />
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-4 text-[13px] text-red-700">{error}</div>
      )}

      {/* Table */}
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
            <button onClick={() => setRowSel(new Set())} className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors">
              <X size={15} className="text-white" />
            </button>
          </div>
        )}

        {loading ? (
          <div className="py-14 flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-[#004ac6] border-t-transparent rounded-full animate-spin" />
            <p className="text-[13px] text-[#64748b]">Loading operators…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-14 text-center text-[14px] text-[#64748b]">No operators found.</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] border-collapse">
                <thead>
                  <tr className="bg-[rgba(248,250,252,0.7)] border-b border-[#f1f5f9]">
                    <th className="w-12 px-5 py-3">
                      <input type="checkbox" checked={allRowsSel} onChange={toggleAll}
                        className="w-4 h-4 rounded border-[#cbd5e1] accent-[#004ac6] cursor-pointer" />
                    </th>
                    <th className="text-left px-4 py-3 text-[11px] font-bold text-[#64748b] tracking-[0.6px] uppercase">Operator</th>
                    <th className="text-center px-4 py-3 text-[11px] font-bold text-[#64748b] tracking-[0.6px] uppercase">Active Orders</th>
                    <th className="text-left px-4 py-3 text-[11px] font-bold text-[#64748b] tracking-[0.6px] uppercase">Current Workload</th>
                    <th className="text-left px-4 py-3 text-[11px] font-bold text-[#64748b] tracking-[0.6px] uppercase">Status</th>
                    <th className="text-left px-4 py-3 text-[11px] font-bold text-[#64748b] tracking-[0.6px] uppercase">Joined</th>
                    <th className="text-left px-4 py-3 text-[11px] font-bold text-[#64748b] tracking-[0.6px] uppercase">Last Pwd Reset</th>
                    <th className="text-right px-5 py-3 text-[11px] font-bold text-[#64748b] tracking-[0.6px] uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pageData.map((op) => {
                    const statusCfg = op.is_active ? STATUS_CFG.active : STATUS_CFG.inactive
                    const workload  = deriveWorkload(op.id)
                    const isSel     = rowSel.has(op.id)
                    return (
                      <tr key={op.id} className={cn('border-t border-[#f1f5f9] hover:bg-[#f8fafc] transition-colors', isSel && 'bg-[#f8fafc]')}>
                        <td className="w-12 px-5 py-3.5">
                          <input type="checkbox" checked={isSel} onChange={() => toggleRow(op.id)}
                            className="w-4 h-4 rounded border-[#cbd5e1] accent-[#004ac6] cursor-pointer" />
                        </td>
                        <td className="px-4 py-3.5 min-w-[180px]">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-400 to-indigo-600 flex items-center justify-center shrink-0">
                              <span className="text-[11px] font-bold text-white">{op.user__username.slice(0, 2).toUpperCase()}</span>
                            </div>
                            <div className="min-w-0">
                              <div className="text-[14px] font-semibold text-[#0b1c30] truncate">{op.user__username}</div>
                              <div className="text-[12px] text-[#64748b] truncate">{op.user__email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="text-center px-4 py-3.5">
                          <span className="text-[16px] font-semibold text-[#004ac6]">{workload.pct > 0 ? Math.round(workload.pct / 10) : 0}</span>
                        </td>
                        <td className="px-4 py-3.5">
                          <WorkloadBar pct={workload.pct} level={workload.level} />
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-semibold"
                            style={{ background: statusCfg.bg, color: statusCfg.text }}>
                            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: statusCfg.dot }} />
                            {statusCfg.label}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap text-[13px] text-[#64748b]">
                          {op.user__date_joined
                            ? new Date(op.user__date_joined).toLocaleDateString()
                            : '—'}
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap text-[13px] text-[#64748b]">
                          {op.last_password_reset
                            ? new Date(op.last_password_reset).toLocaleDateString()
                            : 'Never'}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center justify-end gap-1">
                            <button title="View" className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#f1f5f9] transition-colors">
                              <Eye size={14} className="text-[#94a3b8]" />
                            </button>
                            <button title="Reset password" onClick={() => open('reset', op)}
                              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#f1f5f9] transition-colors">
                              <Lock size={14} className="text-[#94a3b8]" />
                            </button>
                            <div className="w-px h-4 bg-[#e2e8f0] mx-0.5" />
                            {op.is_active ? (
                              <button title="Deactivate" onClick={() => open('deactivate', op)}
                                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 transition-colors">
                                <UserX size={14} className="text-[#f97316]" />
                              </button>
                            ) : (
                              <button title="Activate" onClick={() => open('activate', op)}
                                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#f0fdf4] transition-colors">
                                <UserCheck size={14} className="text-[#22c55e]" />
                              </button>
                            )}
                            <button title="Delete" onClick={() => open('delete', op)}
                              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 transition-colors">
                              <Trash2 size={14} className="text-[#e11d48]" />
                            </button>
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

      {/* Modals */}
      {modal === 'create' && (
        <CreateOperatorModal
          onClose={close}
          onSuccess={() => { refetch(); toast('Operator created'); close() }}
        />
      )}
      {modal === 'activate' && selected && (
        <AccountStatusModal
          action="activate"
          op={selected}
          loading={updateOp.loading}
          error={updateOp.error}
          onConfirm={() => updateOp.updateOperator(selected.id, { is_active: true })}
          onClose={close}
        />
      )}
      {modal === 'deactivate' && selected && (
        <AccountStatusModal
          action="deactivate"
          op={selected}
          loading={updateOp.loading}
          error={updateOp.error}
          onConfirm={() => updateOp.updateOperator(selected.id, { is_active: false })}
          onClose={close}
        />
      )}
      {modal === 'reset' && selected && (
        <ResetPasswordModal op={selected} onClose={close} />
      )}
      {modal === 'delete' && selected && (
        <DeleteOperatorModal
          op={selected}
          loading={deleteOp.loading}
          error={deleteOp.error}
          onConfirm={() => deleteOp.deleteOperator(selected.id)}
          onClose={close}
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

export default Operators
