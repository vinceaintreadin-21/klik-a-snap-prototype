import type { ReactNode } from 'react'

interface OrderSummary {
  id: string | number
  school_name?: string
  institution?: string
  batch_name?: string
  ref?: string
  status?: string
  stage?: string
  student_count?: number
  deadline?: string | null
}

interface Props<T extends OrderSummary> {
  orders: T[]
  onSelect: (order: T) => void
  actionLabel: string | ((order: T) => string)
  isActionDisabled?: (order: T) => boolean
  renderDetail?: (order: T) => ReactNode
}

export default function OperatorOrderTable<T extends OrderSummary>({
  orders, onSelect, actionLabel, isActionDisabled, renderDetail,
}: Props<T>) {
  return (
    <div className="overflow-x-auto rounded-xl border border-purple-100 bg-white">
      <table className="w-full text-left text-sm">
        <thead className="bg-purple-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            {['Order ID', 'Client / Batch', 'Status', 'Subjects', 'Deadline', 'Actions'].map(label => (
              <th key={label} scope="col" className="whitespace-nowrap px-4 py-3 font-semibold">{label}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-purple-50">
          {orders.length === 0 && (
            <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-400">No matching orders.</td></tr>
          )}
          {orders.map(order => (
            <tr key={order.id} className="hover:bg-purple-50/30">
              <td className="px-4 py-4 font-semibold text-purple-700">#{order.id}</td>
              <td className="min-w-44 px-4 py-4">
                <p className="font-medium text-slate-900">{order.school_name ?? order.institution ?? 'Unnamed institution'}</p>
                <p className="mt-1 text-xs text-slate-500">{order.batch_name ?? order.ref}</p>
                {renderDetail && <div className="mt-1 text-xs text-slate-500">{renderDetail(order)}</div>}
              </td>
              <td className="whitespace-nowrap px-4 py-4">
                <span className="rounded-md bg-purple-50 px-2 py-1 text-xs font-semibold uppercase text-purple-800">
                  {(order.stage ?? order.status ?? 'Pending').replaceAll('_', ' ')}
                </span>
              </td>
              <td className="px-4 py-4 tabular-nums">{(order.student_count ?? 0).toLocaleString()}</td>
              <td className="whitespace-nowrap px-4 py-4 text-slate-500">
                {order.deadline ? new Date(`${order.deadline}T00:00:00`).toLocaleDateString() : '—'}
              </td>
              <td className="px-4 py-4">
                <button
                  type="button"
                  onClick={() => onSelect(order)}
                  disabled={isActionDisabled?.(order)}
                  className="whitespace-nowrap rounded-lg bg-purple-600 px-4 py-2 text-xs font-semibold text-white hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {typeof actionLabel === 'function' ? actionLabel(order) : actionLabel}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
