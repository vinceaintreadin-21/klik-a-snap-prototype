import { useState } from 'react'
import { X, AlertTriangle, Shield, CheckCircle2, ChevronDown, ChevronRight } from 'lucide-react'
import { useOverrideOrderStatus } from '../../hooks/useAdminOrders'
import type { AdminOrder } from '../../hooks/useAdminOrders'
import AdminOrderStatusBadge from './AdminOrderStatusBadge'

const ORDER_STATUSES = ['PENDING', 'PROCESSING', 'PROOFING', 'APPROVED', 'PRINTING', 'COMPLETED', 'CANCELLED']

interface Props {
  order: AdminOrder
  onClose: () => void
  onSuccess: () => void
}

const OverrideStatusModal = ({ order, onClose, onSuccess }: Props) => {
  const { overrideStatus, loading, error } = useOverrideOrderStatus()
  const [newStatus, setNewStatus] = useState(order.status)
  const [reason, setReason] = useState('')
  const [done, setDone] = useState(false)

  const canSubmit = newStatus !== order.status && reason.trim().length >= 8

  const handleConfirm = async () => {
    const result = await overrideStatus(order.id, newStatus, reason.trim())
    if (result) {
      setDone(true)
      onSuccess()
    }
  }

  // Success state
  if (done) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
        <div className="relative bg-white rounded-2xl shadow-[0px_20px_60px_rgba(0,0,0,0.18)] w-[440px] p-8 flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-full bg-[#dcfce7] flex items-center justify-center mb-4">
            <CheckCircle2 size={28} className="text-[#166534]" />
          </div>
          <h3 className="text-[18px] font-bold text-[#0b1c30] mb-1">Override Applied</h3>
          <p className="text-[14px] text-[#64748b] mb-6">
            Order <span className="font-semibold text-[#0b1c30]">#{order.id}</span> status has been updated and recorded in the Audit Log.
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
      <div className="relative bg-white rounded-2xl shadow-[0px_20px_60px_rgba(0,0,0,0.18)] w-[480px] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-6 pb-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#fff7ed] flex items-center justify-center shrink-0 mt-0.5">
              <AlertTriangle size={18} className="text-[#f97316]" />
            </div>
            <div>
              <h2 className="text-[18px] font-bold text-[#0b1c30]">Override Order Status</h2>
              <p className="text-[13px] text-[#64748b] mt-0.5">
                <span className="font-semibold text-[#0b1c30]">{order.school_name}</span>
                {' '}·{' '}
                {order.institution__name}
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

        {/* Audit warning */}
        <div className="mx-6 mb-4 flex items-start gap-2.5 bg-[#fff7ed] border border-[#fed7aa] rounded-xl px-4 py-3">
          <Shield size={14} className="text-[#f97316] shrink-0 mt-0.5" />
          <p className="text-[13px] text-[#92400e] leading-5">
            This is an admin override. Your account, reason, and the status change will be permanently recorded in the Audit Log.
          </p>
        </div>

        <div className="px-6 pb-6 flex flex-col gap-5">

          {/* Status change row */}
          <div>
            <label className="text-[12px] font-bold text-[#64748b] tracking-[0.55px] uppercase block mb-2">
              Status Change
            </label>
            <div className="flex items-center gap-3">
              <AdminOrderStatusBadge status={order.status} />
              <ChevronRight size={16} className="text-[#94a3b8] shrink-0" />
              <div className="relative flex-1">
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full appearance-none border border-[#e2e8f0] rounded-lg pl-3 pr-8 py-2 text-[14px] text-[#0b1c30] bg-white cursor-pointer focus:outline-none focus:border-[#004ac6] focus:ring-1 focus:ring-[#004ac6]"
                >
                  {ORDER_STATUSES.map((s) => (
                    <option key={s} value={s} disabled={s === order.status}>{s}</option>
                  ))}
                </select>
                <ChevronDown
                  size={14}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6b7280] pointer-events-none"
                />
              </div>
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="text-[12px] font-bold text-[#64748b] tracking-[0.55px] uppercase block mb-2">
              Override Reason <span className="text-red-600">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Describe the reason for this override (min. 8 characters)…"
              rows={3}
              className="w-full border border-[#e2e8f0] rounded-xl px-4 py-3 text-[14px] text-[#0b1c30] placeholder-[#94a3b8] resize-none focus:outline-none focus:border-[#004ac6] focus:ring-1 focus:ring-[#004ac6]"
            />
            <div className="flex items-center justify-between mt-1.5">
              {reason.length > 0 && reason.trim().length < 8 ? (
                <span className="text-[11px] text-red-600">Please enter at least 8 characters</span>
              ) : (
                <span />
              )}
              <span className="text-[11px] text-[#94a3b8] ml-auto">{reason.length} chars</span>
            </div>
          </div>

          {/* API error */}
          {error && (
            <div className="px-4 py-2 bg-red-50 border border-red-200 rounded-xl text-[13px] text-red-700">
              {error}
            </div>
          )}

          {/* Footer buttons */}
          <div className="flex items-center justify-end gap-3 pt-1">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-[#e2e8f0] text-[14px] font-medium text-[#434655] hover:bg-[#f8fafc] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={!canSubmit || loading}
              className="px-5 py-2 rounded-lg bg-[#b91c1c] text-white text-[14px] font-semibold hover:bg-[#991b1b] disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              <Shield size={14} />
              {loading ? 'Saving…' : 'Confirm Override'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OverrideStatusModal
