import { useState } from 'react'
import { Eye, UserPlus, SlidersHorizontal, X } from 'lucide-react'
import AssignOperatorModal from './AssignOperatorModal'
import OverrideStatusModal from './OverrideStatusModal'
import AdminOrderStatusBadge from './AdminOrderStatusBadge'
import type { AdminOrder } from '../../hooks/useAdminOrders'
import { cn } from '../../lib/utils'

interface Props {
  orders: AdminOrder[]
  loading: boolean
  error: string | null
  onRefetch: () => void
  selected: Set<number>
  onToggleRow: (id: number) => void
  onToggleAll: () => void
  onClearSelection: () => void
}

function ProgressCell({ done, total }: { done: number; total: number }) {
  const pct = total === 0 ? 0 : Math.round((done / total) * 100)
  return (
    <div className="flex flex-col gap-1 min-w-[80px]">
      <div className="flex items-center justify-between text-[12px] text-[#0b1c30]">
        <span>{done} / {total}</span>
        <span className="ml-2">{pct}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-[#d3e4fe] overflow-hidden w-full">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, background: pct === 100 ? '#166534' : '#004ac6' }}
        />
      </div>
    </div>
  )
}

const AdminOrderTable = ({
  orders, loading, error, onRefetch,
  selected, onToggleRow, onToggleAll, onClearSelection,
}: Props) => {
  const [assignOrder, setAssignOrder] = useState<AdminOrder | null>(null)
  const [overrideOrder, setOverrideOrder] = useState<AdminOrder | null>(null)

  const allSelected = orders.length > 0 && orders.every((o) => selected.has(o.id))

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-[#c3c6d7] p-12 text-center">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-[13px] text-[#64748b]">Loading orders…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-4 text-[13px] text-red-700">
        {error}
      </div>
    )
  }

  return (
    <>
      <div className="bg-white border border-[#c3c6d7] rounded-xl shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] overflow-hidden">

        {/* Bulk action bar */}
        {selected.size > 0 && (
          <div className="bg-[#004ac6] flex items-center justify-between px-6 py-2.5">
            <div className="flex items-center gap-4">
              <span className="text-white text-[13px] font-medium">{selected.size} selected</span>
              <div className="w-px h-4 bg-white/30" />
              <div className="flex items-center gap-1">
                {['Export', 'Reassign', 'Archive'].map((a) => (
                  <button
                    key={a}
                    className="text-white text-[13px] font-medium px-3 py-1 rounded hover:bg-white/10 transition-colors"
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={onClearSelection}
              className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
            >
              <X size={15} className="text-white" />
            </button>
          </div>
        )}

        {orders.length === 0 ? (
          <div className="py-14 text-center text-[14px] text-[#64748b]">
            No orders match your filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] border-collapse">
              <thead>
                <tr className="bg-[#eff4ff] border-b border-[#c3c6d7]">
                  <th className="w-12 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={onToggleAll}
                      className="w-4 h-4 rounded border-[#c3c6d7] accent-[#004ac6] cursor-pointer"
                    />
                  </th>
                  <th className="text-left px-4 py-3 text-[11px] font-bold text-[#434655] uppercase tracking-wide whitespace-nowrap">
                    Order
                  </th>
                  <th className="text-left px-4 py-3 text-[11px] font-bold text-[#434655] uppercase tracking-wide">
                    Institution
                  </th>
                  <th className="text-left px-4 py-3 text-[11px] font-bold text-[#434655] uppercase tracking-wide whitespace-nowrap">
                    Operator
                  </th>
                  <th className="text-left px-4 py-3 text-[11px] font-bold text-[#434655] uppercase tracking-wide">
                    Status
                  </th>
                  <th className="text-left px-4 py-3 text-[11px] font-bold text-[#434655] uppercase tracking-wide whitespace-nowrap">
                    Students
                  </th>
                  <th className="text-left px-4 py-3 text-[11px] font-bold text-[#434655] uppercase tracking-wide whitespace-nowrap">
                    Deadline
                  </th>
                  <th className="text-left px-4 py-3 text-[11px] font-bold text-[#434655] uppercase tracking-wide whitespace-nowrap">
                    Created
                  </th>
                  <th className="text-right px-4 py-3 text-[11px] font-bold text-[#434655] uppercase tracking-wide">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => {
                  const isSel = selected.has(order.id)
                  const initials = order.institution__name
                    ? order.institution__name.slice(0, 2).toUpperCase()
                    : '?'

                  return (
                    <tr
                      key={order.id}
                      className={cn(
                        'border-t border-[#e8edf5] hover:bg-[#eff4ff] transition-colors',
                        isSel && 'bg-[#eff4ff]',
                      )}
                    >
                      {/* Checkbox */}
                      <td className="w-12 px-4 py-3.5">
                        <input
                          type="checkbox"
                          checked={isSel}
                          onChange={() => onToggleRow(order.id)}
                          className="w-4 h-4 rounded border-[#c3c6d7] accent-[#004ac6] cursor-pointer"
                        />
                      </td>

                      {/* Order ID + batch */}
                      <td className="px-4 py-3.5 min-w-[120px]">
                        <div className="text-[14px] font-bold text-[#0b1c30] leading-5">
                          #{order.id}
                        </div>
                        <div className="text-[12px] text-[#64748b] leading-4">{order.batch_name}</div>
                      </td>

                      {/* Institution */}
                      <td className="px-4 py-3.5 min-w-[180px]">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded shrink-0 bg-[#d3e4fe] flex items-center justify-center">
                            <span className="text-[11px] font-bold text-[#004ac6]">{initials}</span>
                          </div>
                          <div className="min-w-0">
                            <div className="text-[13px] font-medium text-[#0b1c30] truncate leading-5">
                              {order.institution__name}
                            </div>
                            <div className="text-[12px] text-[#64748b] truncate leading-4">
                              {order.school_name}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Operator */}
                      <td className="px-4 py-3.5 min-w-[140px]">
                        {order.assigned_operator__username ? (
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-400 to-indigo-600 flex items-center justify-center shrink-0">
                              <span className="text-[9px] font-bold text-white">
                                {order.assigned_operator__username.slice(0, 2).toUpperCase()}
                              </span>
                            </div>
                            <span className="text-[13px] text-[#0b1c30] truncate">
                              {order.assigned_operator__username}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[12px] italic text-[#94a3b8]">Unassigned</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        <AdminOrderStatusBadge status={order.status} />
                      </td>

                      {/* Students / progress */}
                      <td className="px-4 py-3.5 min-w-[100px]">
                        <ProgressCell done={0} total={order.student_count} />
                      </td>

                      {/* Deadline */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="text-[13px] text-[#0b1c30]">
                          {order.deadline ? new Date(order.deadline).toLocaleDateString() : '—'}
                        </span>
                      </td>

                      {/* Created */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="text-[13px] text-[#0b1c30]">
                          {new Date(order.created_at).toLocaleDateString()}
                        </div>
                        <div className="text-[11px] text-[#64748b]">
                          {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            title="View"
                            className="w-[28px] h-[28px] flex items-center justify-center rounded hover:bg-[#dce9ff] transition-colors"
                          >
                            <Eye size={13.5} className="text-[#434655]" />
                          </button>
                          <button
                            title="Assign operator"
                            onClick={() => setAssignOrder(order)}
                            className="w-[28px] h-[28px] flex items-center justify-center rounded hover:bg-[#dce9ff] transition-colors"
                          >
                            <UserPlus size={13.5} className="text-[#434655]" />
                          </button>
                          <button
                            title="Override status"
                            onClick={() => setOverrideOrder(order)}
                            className="w-[28px] h-[28px] flex items-center justify-center rounded hover:bg-[#ffe4e6] transition-colors"
                          >
                            <SlidersHorizontal size={13.5} className="text-[#e11d48]" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {assignOrder && (
        <AssignOperatorModal
          order={assignOrder}
          onClose={() => setAssignOrder(null)}
          onSuccess={() => { setAssignOrder(null); onRefetch() }}
        />
      )}
      {overrideOrder && (
        <OverrideStatusModal
          order={overrideOrder}
          onClose={() => setOverrideOrder(null)}
          onSuccess={() => { setOverrideOrder(null); onRefetch() }}
        />
      )}
    </>
  )
}

export default AdminOrderTable
