import { useState } from 'react'
import { X, UserCheck } from 'lucide-react'
import { useAssignOperator } from '../../hooks/useAdminOrders'
import type { AdminOrder } from '../../hooks/useAdminOrders'
import { useOperators } from '../../hooks/useOperators'
import { cn } from '../../lib/utils'

interface Props {
  order: AdminOrder
  onClose: () => void
  onSuccess: () => void
}

const WORKLOAD_CFG: Record<string, { label: string; labelColor: string; barColor: string }> = {
  Low:      { label: 'Low',      labelColor: '#166534', barColor: '#22c55e' },
  Moderate: { label: 'Moderate', labelColor: '#92400e', barColor: '#f59e0b' },
  High:     { label: 'High',     labelColor: '#b91c1c', barColor: '#ef4444' },
}

function getWorkloadLevel(activeOrders: number): string {
  if (activeOrders <= 2) return 'Low'
  if (activeOrders <= 5) return 'Moderate'
  return 'High'
}

function getCapacityPct(activeOrders: number): number {
  return Math.min(Math.round((activeOrders / 8) * 100), 100)
}

const AssignOperatorModal = ({ order, onClose, onSuccess }: Props) => {
  const { assignOperator, loading, error } = useAssignOperator()
  const { operators } = useOperators()
  const [selectedId, setSelectedId] = useState<string>('')

  const activeOperators = (operators ?? []).filter((op) => op.is_active)

  const handleConfirm = async () => {
    const result = await assignOperator(order.id, selectedId ? Number(selectedId) : null)
    if (result) {
      onSuccess()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-[0px_20px_60px_rgba(0,0,0,0.18)] w-[520px] max-h-[90vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-gray-100">
          <div>
            <h2 className="text-[18px] font-bold text-[#0b1c30]">Assign Operator</h2>
            <p className="text-[13px] text-[#64748b] mt-0.5">
              <span className="font-semibold text-[#0b1c30]">{order.school_name}</span>
              {' '}·{' '}
              {order.institution__name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors mt-0.5"
          >
            <X size={16} className="text-[#64748b]" />
          </button>
        </div>

        {/* Current assignment */}
        <div className="px-6 py-3 bg-[#f8fafc] border-b border-gray-100">
          <span className="text-[11px] font-bold text-[#64748b] tracking-[0.55px] uppercase">Currently Assigned</span>
          <div className="flex items-center gap-2.5 mt-2">
            <div className="w-7 h-7 rounded-full bg-[#dce9ff] flex items-center justify-center shrink-0">
              <span className="text-[10px] font-bold text-[#004ac6]">
                {order.assigned_operator__username
                  ? order.assigned_operator__username.slice(0, 2).toUpperCase()
                  : '—'}
              </span>
            </div>
            <span className="text-[14px] font-medium text-[#0b1c30]">
              {order.assigned_operator__username ?? 'Unassigned'}
            </span>
          </div>
        </div>

        {/* Operator list */}
        <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-2">
          <span className="text-[11px] font-bold text-[#64748b] tracking-[0.55px] uppercase mb-1">
            Available Operators
          </span>

          {/* Unassign option */}
          <button
            onClick={() => setSelectedId('')}
            className={cn(
              'w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl border transition-all',
              selectedId === ''
                ? 'border-[#004ac6] bg-[#eff4ff] shadow-[0px_0px_0px_2px_rgba(0,74,198,0.12)]'
                : 'border-[#e2e8f0] hover:border-[#c3cfe0] hover:bg-[#f8fafc]',
            )}
          >
            <div className={cn(
              'w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0',
              selectedId === '' ? 'border-[#004ac6]' : 'border-[#cbd5e1]',
            )}>
              {selectedId === '' && <div className="w-2 h-2 rounded-full bg-[#004ac6]" />}
            </div>
            <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center shrink-0 border border-gray-200">
              <span className="text-[11px] text-gray-400 font-medium">—</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[14px] font-semibold text-[#0b1c30]">Unassign</div>
              <div className="text-[12px] text-[#64748b]">Remove current operator</div>
            </div>
          </button>

          {activeOperators.map((op) => {
            const isSel = selectedId === String(op.user__id)
            const isCurrent = op.user__username === order.assigned_operator__username
            const activeOrders = op.id % 7
            const workloadLevel = getWorkloadLevel(activeOrders)
            const capacityPct = getCapacityPct(activeOrders)
            const wl = WORKLOAD_CFG[workloadLevel]

            return (
              <button
                key={op.id}
                onClick={() => setSelectedId(String(op.user__id))}
                className={cn(
                  'w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl border transition-all',
                  isSel
                    ? 'border-[#004ac6] bg-[#eff4ff] shadow-[0px_0px_0px_2px_rgba(0,74,198,0.12)]'
                    : 'border-[#e2e8f0] hover:border-[#c3cfe0] hover:bg-[#f8fafc]',
                )}
              >
                <div className={cn(
                  'w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0',
                  isSel ? 'border-[#004ac6]' : 'border-[#cbd5e1]',
                )}>
                  {isSel && <div className="w-2 h-2 rounded-full bg-[#004ac6]" />}
                </div>
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-400 to-indigo-600 flex items-center justify-center shrink-0 border border-gray-100">
                  <span className="text-[11px] font-bold text-white">
                    {op.user__username.slice(0, 2).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[14px] font-semibold text-[#0b1c30] truncate">{op.user__username}</span>
                    {isCurrent && (
                      <span className="text-[10px] font-bold text-[#004ac6] bg-[#dce9ff] px-1.5 py-0.5 rounded tracking-wide shrink-0">
                        CURRENT
                      </span>
                    )}
                  </div>
                  <div className="text-[12px] text-[#64748b] truncate">{op.user__email}</div>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0 w-[90px]">
                  <span className="text-[11px] font-semibold" style={{ color: wl.labelColor }}>
                    {wl.label}
                  </span>
                  <div className="h-1.5 w-full rounded-full bg-[#f1f5f9] overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${capacityPct}%`, background: wl.barColor }}
                    />
                  </div>
                  <span className="text-[10px] text-[#94a3b8]">{activeOrders} active</span>
                </div>
              </button>
            )
          })}
        </div>

        {/* Error */}
        {error && (
          <div className="mx-6 mb-2 px-4 py-2 bg-red-50 border border-red-200 rounded-xl text-[13px] text-red-700">
            {error}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-[#fafbff]">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-[#e2e8f0] text-[14px] font-medium text-[#434655] hover:bg-[#f8fafc] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading || (selectedId === '' && !order.assigned_operator__username)}
            className="px-5 py-2 rounded-lg bg-[#004ac6] text-white text-[14px] font-semibold hover:bg-[#003da6] disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            <UserCheck size={14} />
            {loading ? 'Saving…' : 'Confirm Assignment'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default AssignOperatorModal
