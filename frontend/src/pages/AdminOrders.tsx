import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search, ChevronDown, ChevronRight, List, LayoutGrid,
  CalendarDays, RefreshCw,
} from 'lucide-react'
import { useAdminOrders } from '../hooks/useAdminOrders'
import { useInstitutions } from '../hooks/useInstitutions'
import type { OrderFilters } from '../hooks/useAdminOrders'
import AdminOrderTable from '../components/admin-orders/AdminOrderTable'
import AdminOrderStatusBadge from '../components/admin-orders/AdminOrderStatusBadge'
import AssignOperatorModal from '../components/admin-orders/AssignOperatorModal'
import OverrideStatusModal from '../components/admin-orders/OverrideStatusModal'
import { cn } from '../lib/utils'
import type { AdminOrder } from '../hooks/useAdminOrders'

const ORDER_STATUSES = ['PENDING', 'PROCESSING', 'PROOFING', 'APPROVED', 'PRINTING', 'COMPLETED', 'CANCELLED']

// ── Grid card ──────────────────────────────────────────────────────────────────

function OrderGridCard({
  order,
  selected,
  onToggle,
  onAssign,
  onOverride,
}: {
  order: AdminOrder
  selected: boolean
  onToggle: () => void
  onAssign: (o: AdminOrder) => void
  onOverride: (o: AdminOrder) => void
}) {
  const initials = order.institution__name?.slice(0, 2).toUpperCase() ?? '?'
  return (
    <div className={cn(
      'bg-white rounded-2xl border p-4 flex flex-col gap-3 transition-all hover:shadow-md',
      selected ? 'border-[#004ac6] shadow-[0px_0px_0px_2px_rgba(0,74,198,0.12)]' : 'border-[#c3c6d7]',
    )}>
      {/* Top row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <input
            type="checkbox"
            checked={selected}
            onChange={onToggle}
            className="w-4 h-4 rounded border-[#c3c6d7] accent-[#004ac6] cursor-pointer shrink-0"
          />
          <div className="w-8 h-8 rounded bg-[#d3e4fe] flex items-center justify-center shrink-0">
            <span className="text-[11px] font-bold text-[#004ac6]">{initials}</span>
          </div>
          <div className="min-w-0">
            <div className="text-[13px] font-semibold text-[#0b1c30] truncate">{order.institution__name}</div>
            <div className="text-[11px] text-[#64748b] truncate">{order.school_name}</div>
          </div>
        </div>
        <AdminOrderStatusBadge status={order.status} />
      </div>

      {/* Batch + students */}
      <div className="flex items-center justify-between text-[12px]">
        <span className="text-[#64748b]">{order.batch_name}</span>
        <span className="font-semibold text-[#0b1c30]">{order.student_count} students</span>
      </div>

      {/* Operator */}
      <div className="flex items-center gap-2">
        {order.assigned_operator__username ? (
          <>
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-purple-400 to-indigo-600 flex items-center justify-center shrink-0">
              <span className="text-[8px] font-bold text-white">
                {order.assigned_operator__username.slice(0, 2).toUpperCase()}
              </span>
            </div>
            <span className="text-[12px] text-[#0b1c30] truncate">{order.assigned_operator__username}</span>
          </>
        ) : (
          <span className="text-[12px] italic text-[#94a3b8]">Unassigned</span>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-1 border-t border-gray-100">
        <span className="text-[11px] text-[#94a3b8]">
          {new Date(order.created_at).toLocaleDateString()}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onAssign(order)}
            className="text-[11px] font-medium text-[#004ac6] px-2 py-0.5 rounded hover:bg-[#eff4ff] transition-colors"
          >
            Assign
          </button>
          <button
            onClick={() => onOverride(order)}
            className="text-[11px] font-medium text-[#b91c1c] px-2 py-0.5 rounded hover:bg-red-50 transition-colors"
          >
            Override
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────

const AdminOrders = () => {
  const navigate = useNavigate()
  const [apiFilters, setApiFilters] = useState<OrderFilters>({})
  const { orders, loading, error, refetch } = useAdminOrders(apiFilters)
  const { institutions } = useInstitutions()

  // Local filter state
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [institutionFilter, setInstitutionFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')

  // Selection
  const [selected, setSelected] = useState<Set<number>>(new Set())

  // Modal state (for grid card actions — table manages its own)
  const [assignOrder, setAssignOrder] = useState<AdminOrder | null>(null)
  const [overrideOrder, setOverrideOrder] = useState<AdminOrder | null>(null)

  const hasFilters = search || statusFilter || institutionFilter || dateFrom || dateTo

  const clearFilters = () => {
    setSearch('')
    setStatusFilter('')
    setInstitutionFilter('')
    setDateFrom('')
    setDateTo('')
    setApiFilters({})
  }

  const applyFilters = () => {
    setApiFilters({
      status: statusFilter || undefined,
      institution_id: institutionFilter || undefined,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
    })
  }

  // Client-side search on top of API results
  const filtered = useMemo(() => {
    if (!search) return orders
    const q = search.toLowerCase()
    return orders.filter(
      (o) =>
        String(o.id).includes(q) ||
        o.school_name?.toLowerCase().includes(q) ||
        o.batch_name?.toLowerCase().includes(q) ||
        o.institution__name?.toLowerCase().includes(q) ||
        o.assigned_operator__username?.toLowerCase().includes(q),
    )
  }, [orders, search])

  // Selection helpers
  const toggleRow = (id: number) => {
    const next = new Set(selected)
    next.has(id) ? next.delete(id) : next.add(id)
    setSelected(next)
  }

  const toggleAll = () => {
    if (filtered.every((o) => selected.has(o.id))) {
      setSelected(new Set())
    } else {
      setSelected(new Set(filtered.map((o) => o.id)))
    }
  }

  return (
    <div className="flex flex-col gap-5">

      {/* Page header */}
      <div className="flex items-end justify-between">
        <div className="flex flex-col gap-1">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-[12px]">
            <button
              onClick={() => navigate('/admin/dashboard')}
              className="text-[#64748b] hover:text-[#004ac6] transition-colors"
            >
              Dashboard
            </button>
            <ChevronRight size={10} className="text-[#94a3b8]" />
            <span className="text-[#004ac6] font-medium">Orders</span>
          </div>
          {/* Title + badge */}
          <div className="flex items-center gap-3">
            <h1 className="text-[24px] font-bold text-[#0b1c30] tracking-tight leading-8">Orders</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-[#dbe1ff] text-[12px] font-semibold text-[#00174b]">
              {filtered.length} Total
            </span>
          </div>
        </div>

        {/* List / Grid toggle */}
        <div className="flex items-center p-1.5 rounded-lg bg-white border border-[#c3c6d7]">
          <button
            onClick={() => setViewMode('list')}
            className={cn(
              'flex items-center justify-center w-[30px] h-[28px] rounded transition-colors',
              viewMode === 'list' ? 'bg-[#dce9ff]' : 'hover:bg-gray-100',
            )}
          >
            <List size={14} className={viewMode === 'list' ? 'text-[#004ac6]' : 'text-[#434655]'} />
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={cn(
              'flex items-center justify-center w-[30px] h-[28px] rounded transition-colors',
              viewMode === 'grid' ? 'bg-[#dce9ff]' : 'hover:bg-gray-100',
            )}
          >
            <LayoutGrid size={14} className={viewMode === 'grid' ? 'text-[#004ac6]' : 'text-[#434655]'} />
          </button>
        </div>
      </div>

      {/* Filters bar */}
      <div className="bg-white border border-[#c3c6d7] rounded-xl p-4 flex flex-col gap-3">
        {/* Search */}
        <div className="relative w-full">
          <Search size={13.5} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8] pointer-events-none" />
          <input
            type="text"
            placeholder="Search by order ID, school, batch, institution, operator…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border border-[#e2e8f0] rounded-lg pl-9 pr-4 py-2.5 text-[14px] text-[#0b1c30] placeholder-[#94a3b8] bg-white focus:outline-none focus:border-[#004ac6] focus:ring-1 focus:ring-[#004ac6]"
          />
        </div>

        {/* Filter dropdowns */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Status */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none min-w-[140px] border border-[#e2e8f0] rounded-lg px-3 py-2 text-[13px] text-[#0b1c30] bg-white pr-8 cursor-pointer focus:outline-none focus:border-[#004ac6]"
            >
              <option value="">Status: All</option>
              {ORDER_STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6b7280] pointer-events-none" />
          </div>

          {/* Institution */}
          <div className="relative">
            <select
              value={institutionFilter}
              onChange={(e) => setInstitutionFilter(e.target.value)}
              className="appearance-none min-w-[160px] border border-[#e2e8f0] rounded-lg px-3 py-2 text-[13px] text-[#0b1c30] bg-white pr-8 cursor-pointer focus:outline-none focus:border-[#004ac6]"
            >
              <option value="">Institution: All</option>
              {institutions.map((i) => (
                <option key={i.id} value={String(i.id)}>{i.name}</option>
              ))}
            </select>
            <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6b7280] pointer-events-none" />
          </div>

          {/* Date range */}
          <div className="flex items-center gap-2 border border-[#e2e8f0] rounded-lg px-3 py-2 bg-white">
            <CalendarDays size={13.5} className="text-[#94a3b8] shrink-0" />
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="text-[13px] text-[#0b1c30] bg-transparent focus:outline-none w-[120px]"
            />
            <span className="text-[#94a3b8] text-[12px]">–</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="text-[13px] text-[#0b1c30] bg-transparent focus:outline-none w-[120px]"
            />
          </div>

          {/* Apply */}
          <button
            onClick={applyFilters}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#004ac6] text-white text-[13px] font-semibold hover:bg-[#003da6] transition-colors"
          >
            Apply
          </button>

          {/* Refresh */}
          <button
            onClick={() => refetch()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#e2e8f0] text-[#434655] text-[13px] hover:bg-gray-50 transition-colors"
          >
            <RefreshCw size={13} />
          </button>

          {/* Clear filters */}
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="text-[12px] font-semibold text-[#004ac6] px-2 hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Active status filter pills */}
      {statusFilter && (
        <div className="flex items-center gap-2 flex-wrap -mt-1">
          <span className="text-[12px] text-[#64748b]">Filtering by:</span>
          <AdminOrderStatusBadge status={statusFilter} />
          <button
            onClick={() => setStatusFilter('')}
            className="text-[11px] text-[#64748b] hover:text-[#0b1c30] transition-colors"
          >
            ✕
          </button>
        </div>
      )}

      {/* Table or Grid */}
      {viewMode === 'list' ? (
        <AdminOrderTable
          orders={filtered}
          loading={loading}
          error={error}
          onRefetch={refetch}
          selected={selected}
          onToggleRow={toggleRow}
          onToggleAll={toggleAll}
          onClearSelection={() => setSelected(new Set())}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            <div className="col-span-3 py-14 text-center text-[13px] text-[#64748b]">
              Loading orders…
            </div>
          ) : filtered.length === 0 ? (
            <div className="col-span-3 py-14 text-center text-[13px] text-[#64748b]">
              No orders match your filters.
            </div>
          ) : filtered.map((order) => (
            <OrderGridCard
              key={order.id}
              order={order}
              selected={selected.has(order.id)}
              onToggle={() => toggleRow(order.id)}
              onAssign={(o) => setAssignOrder(o)}
              onOverride={(o) => setOverrideOrder(o)}
            />
          ))}
        </div>
      )}

      {/* Grid-mode modals */}
      {assignOrder && (
        <AssignOperatorModal
          order={assignOrder}
          onClose={() => setAssignOrder(null)}
          onSuccess={() => { setAssignOrder(null); refetch() }}
        />
      )}
      {overrideOrder && (
        <OverrideStatusModal
          order={overrideOrder}
          onClose={() => setOverrideOrder(null)}
          onSuccess={() => { setOverrideOrder(null); refetch() }}
        />
      )}
    </div>
  )
}

export default AdminOrders
