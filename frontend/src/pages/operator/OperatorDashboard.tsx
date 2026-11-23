import ViewModeToggle, { type ViewMode } from '../../components/shared/ViewModeToggle'
import OrderActionsMenu from '../../components/operator/OrderActionsMenu'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, ArrowUpDown, CheckCircle2, ClipboardList, Loader2, Printer, Search, ChevronLeft, ChevronRight } from 'lucide-react'
import axios from 'axios'
import { useOrders } from '../../context/OrderContext'
import { useAuth } from '../../context/AuthContext'
import api from '../../utils/api'
import { cn } from '../../lib/utils'

const STAGES: Record<string, { label: string; badge: string; bar: string }> = {
  PENDING: { label: 'Pending Photos', badge: 'border-purple-200 bg-purple-50 text-purple-800', bar: 'bg-purple-500' },
  AWAITING_LAYOUT: { label: 'Awaiting Layout', badge: 'border-gray-300 bg-gray-100 text-gray-600', bar: 'bg-gray-300' },
  PROCESSING: { label: 'Processing', badge: 'border-[#93c5fd] bg-[#dbeafe] text-[#1e40af]', bar: 'bg-purple-600' },
  NEEDS_REVIEW: { label: 'Needs Review', badge: 'border-amber-300 bg-amber-100 text-amber-800', bar: 'bg-amber-500' },
  PROOFING: { label: 'Proofing', badge: 'border-pink-300 bg-pink-100 text-pink-800', bar: 'bg-pink-500' },
  APPROVED: { label: 'Approved', badge: 'border-emerald-300 bg-emerald-100 text-emerald-800', bar: 'bg-emerald-500' },
  PRINTING: { label: 'Printing', badge: 'border-cyan-300 bg-cyan-100 text-cyan-800', bar: 'bg-cyan-500' },
  COMPLETED: { label: 'Completed', badge: 'border-emerald-300 bg-emerald-100 text-emerald-800', bar: 'bg-emerald-500' },
  FAILED: { label: 'Failed', badge: 'border-red-200 bg-red-50 text-red-700', bar: 'bg-red-500' },
  CANCELLED: { label: 'Cancelled', badge: 'border-gray-200 bg-gray-100 text-gray-600', bar: 'bg-gray-300' },
}

const ACTIONS: Record<string, { label: string; route?: string; style: string }> = {
  set_layout: { label: 'Set Up Layout', route: 'layout-builder', style: 'border-gray-400 bg-gray-200 text-gray-800 hover:bg-gray-300' },
  upload_photos: { label: 'Upload Photos', route: 'batch-upload', style: 'border-purple-300 bg-purple-100 text-purple-900 hover:bg-purple-200' },
  view_pipeline: { label: 'View Pipeline', route: 'pipeline', style: 'border-purple-300 bg-purple-200 text-purple-900 hover:bg-purple-300' },
  review_photos: { label: 'Review Photos', route: 'manual-review', style: 'border-amber-300 bg-amber-200 text-amber-900 hover:bg-amber-300' },
  view_proofs: { label: 'View Proofs', route: 'proofing', style: 'border-pink-300 bg-pink-200 text-pink-900 hover:bg-pink-300' },
  send_to_print: { label: 'Send to Print', style: 'border-orange-300 bg-orange-200 text-orange-900 hover:bg-orange-300' },
  mark_completed: { label: 'Mark Completed', style: 'border-emerald-400 bg-emerald-200 text-emerald-900 hover:bg-emerald-300' },
  view_order: { label: 'View Order', route: 'proofing', style: 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50' },
}

const PER_PAGE = 10

type AssignedOrder = {
  id: number
  school_name: string
  batch_name: string
  status: string
  stage?: string
  primary_action?: string
  student_count: number
  processed_count?: number
  manual_review_count?: number
  deadline?: string | null
}

export default function OperatorDashboard() {
  const { user } = useAuth()
  const { orders, refreshOrders } = useOrders()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [view, setView] = useState<ViewMode>('list')
  const [sort, setSort] = useState<'deadline' | 'status' | 'subjects' | ''>('')
  const [page, setPage] = useState(1)
  const [busyId, setBusyId] = useState<number | null>(null)
  const busy = useRef(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    const refresh = async () => {
      try { await refreshOrders() }
      catch { if (active) setError('Could not refresh assigned orders. Please try again.') }
    }
    void refresh()
    const timer = window.setInterval(() => { void refresh() }, 10_000)
    return () => { active = false; window.clearInterval(timer) }
  }, [refreshOrders])

  const assigned = orders as AssignedOrder[]
  const reviewOrders = assigned.filter(order => ['PENDING', 'PROCESSING', 'FAILED', 'PROOFING'].includes(order.status) && (order.manual_review_count ?? 0) > 0)
  const reviewPhotos = reviewOrders.reduce((sum, order) => sum + (order.manual_review_count ?? 0), 0)
  const inProgress = assigned.filter(order => ['PENDING', 'PROCESSING', 'PROOFING', 'FAILED'].includes(order.status)).length
  const ready = assigned.filter(order => ['APPROVED', 'PRINTING'].includes(order.status)).length
  const completed = assigned.filter(order => order.status === 'COMPLETED').length

  const filtered = useMemo(() => {
    const text = query.trim().toLowerCase()
    const result = (orders as AssignedOrder[]).filter(order =>
      `${order.id} ${order.school_name} ${order.batch_name} ${order.status} ${order.stage ?? ''}`.toLowerCase().includes(text))
    if (sort === 'deadline') result.sort((a, b) => (a.deadline ?? '9999').localeCompare(b.deadline ?? '9999'))
    if (sort === 'status') result.sort((a, b) => (a.stage ?? a.status).localeCompare(b.stage ?? b.status))
    if (sort === 'subjects') result.sort((a, b) => b.student_count - a.student_count)
    return result
  }, [orders, query, sort])
  const pageCount = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const currentPage = Math.min(page, pageCount)
  const visible = filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE)

  const runAction = async (order: AssignedOrder) => {
    const action = ACTIONS[order.primary_action ?? '']
    if (!action || busy.current) return
    if (action.route) {
      navigate(`/operator/${action.route}`, { state: { orderId: order.id } })
      return
    }
    if (!window.confirm(`${action.label} for order #${order.id}?`)) return
    busy.current = true
    setBusyId(order.id)
    setError('')
    try {
      await api.post(`/orders/${order.id}/complete/`, { expected_status: order.status })
      await refreshOrders()
    } catch (error) {
      setError(axios.isAxiosError(error) ? error.response?.data?.error || 'Could not update this order. Please try again.' : 'Could not update this order. Please try again.')
      await refreshOrders().catch(() => {})
    } finally {
      busy.current = false
      setBusyId(null)
    }
  }

  const stats = [
    { label: 'Orders in Progress', count: inProgress, note: '', badge: `${inProgress} active`, Icon: ClipboardList, border: 'border-[#93b8ef]', icon: 'bg-[#dbeafe] text-[#1d4ed8]', badgeStyle: 'bg-[#dbeafe] text-[#1e40af]' },
    { label: 'Pending Manual Reviews', count: reviewPhotos, note: `photos in ${reviewOrders.length} order${reviewOrders.length === 1 ? '' : 's'}`, badge: reviewPhotos ? 'Action Required' : 'Up to date', Icon: AlertTriangle, border: 'border-amber-300', icon: 'bg-amber-100 text-amber-700', badgeStyle: 'bg-amber-100 text-amber-800' },
    { label: 'Ready to Print', count: ready, note: 'approved or printing', badge: 'Queued', Icon: Printer, border: 'border-purple-300', icon: 'bg-purple-100 text-purple-700', badgeStyle: 'bg-purple-100 text-purple-800' },
    { label: 'Completed', count: completed, note: '', badge: 'Total', Icon: CheckCircle2, border: 'border-emerald-300', icon: 'bg-emerald-100 text-emerald-700', badgeStyle: 'bg-emerald-100 text-emerald-800' },
  ]

  return (
    <div className="w-full space-y-7 px-4 py-7 sm:px-7 lg:px-8">
      <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
        Welcome, {user?.username ?? 'Operator'}!
      </h1>
      {error && (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
          <button
            onClick={() => {
              void refreshOrders()
                .then(() => setError(''))
                .catch(() => setError('Could not refresh assigned orders. Please try again.'))
            }}
            className="font-semibold underline"
          >
            Refresh orders
          </button>
        </div>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, count, note, badge, Icon, border, icon, badgeStyle }) => (
          <section key={label} className={cn('rounded-2xl border bg-white p-5', border)}>
            <div className="mb-4 flex items-start justify-between gap-2">
              <span className={cn('grid size-11 place-items-center rounded-xl', icon)}>
                <Icon size={22} />
              </span>
              <span className={cn('rounded-full px-2.5 py-1 text-xs font-semibold', badgeStyle)}>
                {badge}
              </span>
            </div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-600">
              {label}
            </h2>
            <div className="mt-3 flex flex-wrap items-baseline gap-2">
              <strong className={cn(
                'text-3xl font-bold tabular-nums',
                label === 'Pending Manual Reviews' && count > 0 ? 'text-amber-700' : 'text-gray-900',
              )}>
                {count.toLocaleString()}
              </strong>
              {note && <span className="text-xs text-gray-500">{note}</span>}
            </div>
          </section>
        ))}
      </div>
      <section className="overflow-hidden rounded-2xl border border-purple-100 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-purple-50 px-5 py-5">
          <div>
            <h2 className="text-lg font-bold text-gray-900">My Assigned Orders</h2>
            <p className="mt-1 text-sm text-gray-500">Showing {visible.length} of {filtered.length} orders</p>
          </div>
          <div className="flex w-full items-center gap-2 sm:w-auto">
            <div className="relative min-w-0 flex-1">
              <Search size={16} className="pointer-events-none absolute left-3 top-3 text-gray-400" />
              <input
                aria-label="Search assigned orders"
                placeholder="Search orders…"
                value={query}
                onChange={event => { setQuery(event.target.value); setPage(1) }}
                className="w-full rounded-xl border border-purple-100 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-purple-400 sm:w-64"
              />
            </div>
            <button
              onClick={() => {
                setSort(value => value === '' ? 'deadline' : value === 'deadline' ? 'status' : value === 'status' ? 'subjects' : '')
                setPage(1)
              }}
              className="flex items-center gap-2 rounded-xl border border-purple-100 px-3 py-2.5 text-sm text-gray-600"
            >
              <ArrowUpDown size={16} />
              {sort ? `Sort: ${sort}` : 'Sort'}
            </button>
            <ViewModeToggle value={view} onChange={setView} />
          </div>
        </div>
        {view === 'list' ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-purple-50/70 text-xs uppercase tracking-wide text-gray-600">
              <tr>
                {['Order ID', 'Client', 'Status', 'Subjects', 'Progress', 'Deadline', 'Actions'].map(label => (
                  <th key={label} scope="col" className="whitespace-nowrap px-3 py-4 font-semibold xl:px-4">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-purple-50">
              {visible.map(order => {
                const stage = STAGES[order.stage ?? order.status] ?? STAGES.PENDING
                const action = ACTIONS[order.primary_action ?? '']
                const done = order.processed_count ?? 0
                const review = order.manual_review_count ?? 0
                const percent = order.student_count > 0
                  ? Math.min(100, Math.round(done / order.student_count * 100))
                  : 0
                const daysLeft = order.deadline
                  ? (new Date(`${order.deadline}T00:00:00`).getTime() - new Date().setHours(0, 0, 0, 0)) / 86_400_000
                  : null
                const active = !['COMPLETED', 'CANCELLED'].includes(order.status)
                const overdue = active && daysLeft !== null && daysLeft < 0
                const dueSoon = active && daysLeft !== null && daysLeft >= 0 && daysLeft <= 7

                return (
                  <tr key={order.id} className="hover:bg-purple-50/30">
                    <td className="px-3 py-5 font-semibold text-purple-700 xl:px-4">#{order.id}</td>
                    <td className="min-w-36 px-3 py-5 xl:px-4">
                      <p className="font-medium text-gray-900">{order.school_name}</p>
                      <p className="mt-1 text-xs text-gray-500">{order.batch_name}</p>
                    </td>
                    <td className="px-3 py-5 xl:px-4">
                      <span className={cn(
                        'inline-block whitespace-nowrap rounded-md border px-2 py-1 text-xs font-semibold uppercase',
                        stage.badge,
                      )}>
                        {stage.label}
                      </span>
                    </td>
                    <td className="px-3 py-5 tabular-nums text-gray-700 xl:px-4">
                      {order.student_count.toLocaleString()}
                    </td>
                    <td className="min-w-40 px-3 py-5 xl:px-4">
                      <div
                        role="progressbar"
                        aria-label={`Order ${order.id} processing progress`}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={percent}
                        className="h-1.5 overflow-hidden rounded-full bg-purple-100"
                      >
                        <div className={cn('h-full rounded-full transition-all', stage.bar)} style={{ width: `${percent}%` }} />
                      </div>
                      <p className="mt-2 text-xs text-gray-500">
                        {done.toLocaleString()} / {order.student_count.toLocaleString()} processed
                        {review > 0 && ` · ${review} in review`}
                      </p>
                    </td>
                    <td className="whitespace-nowrap px-3 py-5 xl:px-4">
                      <span className={cn(
                        overdue ? 'font-semibold text-red-700' : dueSoon ? 'font-semibold text-amber-700' : 'text-gray-600',
                      )}>
                        {order.deadline
                          ? new Date(`${order.deadline}T00:00:00`).toLocaleDateString(undefined, {
                            month: 'short', day: 'numeric', year: 'numeric',
                          })
                          : '—'}
                      </span>
                      {(overdue || dueSoon) && (
                        <span className={cn(
                          'mt-1 block w-fit rounded border px-1.5 text-[10px] font-semibold uppercase',
                          overdue ? 'border-red-200 bg-red-50 text-red-700' : 'border-amber-200 bg-amber-50 text-amber-800',
                        )}>
                          {overdue ? 'Overdue' : 'Due soon'}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-5 xl:px-4">
                      {action ? (
                        <div className="flex items-center gap-2">
                          <button
                            disabled={busyId !== null}
                            onClick={() => { void runAction(order) }}
                            className={cn(
                              'flex min-h-10 w-36 items-center justify-center gap-2 whitespace-nowrap rounded-lg border px-3 py-2 text-xs font-semibold transition-colors disabled:opacity-50',
                              action.style,
                            )}
                          >
                            {busyId === order.id ? <Loader2 size={16} className="animate-spin" /> : action.label}
                          </button>
                          {['set_layout', 'upload_photos'].includes(order.primary_action ?? '') && (
                            <OrderActionsMenu
                              orderId={order.id}
                              orderName={`${order.school_name}_${order.batch_name}`}
                              disabled={busyId !== null}
                            />
                          )}
                        </div>
                      ) : <span className="text-xs text-gray-400">Loading action…</span>}
                    </td>
                  </tr>
                )
              })}
              {visible.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-14 text-center text-gray-500">
                    {orders.length ? 'No matching orders.' : 'No orders assigned yet.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2 xl:grid-cols-3">
            {visible.map(order => {
              const stage = STAGES[order.stage ?? order.status] ?? STAGES.PENDING
              const action = ACTIONS[order.primary_action ?? '']
              const done = order.processed_count ?? 0
              const review = order.manual_review_count ?? 0
              const percent = order.student_count > 0
                ? Math.min(100, Math.round(done / order.student_count * 100))
                : 0
              return (
                <article key={order.id} className="flex flex-col rounded-xl border border-purple-100 bg-white p-5">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-purple-700">#{order.id}</span>
                    <span className={cn('rounded-md border px-2 py-1 text-xs font-semibold uppercase', stage.badge)}>
                      {stage.label}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-900">{order.school_name}</h3>
                  <p className="mt-1 text-xs text-gray-500">{order.batch_name}</p>
                  <p className="mt-3 text-sm text-gray-600">{order.student_count.toLocaleString()} subjects</p>
                  <div
                    role="progressbar"
                    aria-label={`Order ${order.id} processing progress`}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={percent}
                    className="mt-3 h-1.5 overflow-hidden rounded-full bg-purple-100"
                  >
                    <div className={cn('h-full rounded-full', stage.bar)} style={{ width: `${percent}%` }} />
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    {done.toLocaleString()} / {order.student_count.toLocaleString()} processed
                    {review > 0 && ` · ${review} in review`}
                  </p>
                  <p className="mb-4 mt-3 text-xs text-gray-500">
                    Deadline {order.deadline
                      ? new Date(`${order.deadline}T00:00:00`).toLocaleDateString()
                      : '—'}
                  </p>
                  {action && (
                    <div className="mt-auto flex items-center gap-2">
                      <button
                        disabled={busyId !== null}
                        onClick={() => { void runAction(order) }}
                        className={cn(
                          'flex min-h-10 min-w-0 flex-1 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold disabled:opacity-50',
                          action.style,
                        )}
                      >
                        {busyId === order.id ? <Loader2 size={16} className="animate-spin" /> : action.label}
                      </button>
                      {['set_layout', 'upload_photos'].includes(order.primary_action ?? '') && (
                        <OrderActionsMenu
                          orderId={order.id}
                          orderName={`${order.school_name}_${order.batch_name}`}
                          disabled={busyId !== null}
                        />
                      )}
                    </div>
                  )}
                </article>
              )
            })}
            {visible.length === 0 && (
              <p className="col-span-full py-10 text-center text-sm text-gray-500">
                {orders.length ? 'No matching orders.' : 'No orders assigned yet.'}
              </p>
            )}
          </div>
        )}
        {pageCount > 1 && (
          <div className="flex items-center justify-between border-t border-purple-100 px-5 py-3 text-sm text-gray-500">
            <span>Page {currentPage} of {pageCount}</span>
            <div className="flex gap-2">
              <button
                aria-label="Previous page"
                disabled={currentPage === 1}
                onClick={() => setPage(currentPage - 1)}
                className="rounded border border-purple-100 p-2 disabled:opacity-40"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                aria-label="Next page"
                disabled={currentPage === pageCount}
                onClick={() => setPage(currentPage + 1)}
                className="rounded border border-purple-100 p-2 disabled:opacity-40"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
