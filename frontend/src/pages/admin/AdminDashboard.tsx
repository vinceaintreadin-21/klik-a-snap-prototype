import { useNavigate } from 'react-router-dom'
import {
  ShoppingBag, CheckCircle2, AlertTriangle, Clock,
  TrendingUp, TrendingDown, Download, ArrowUpRight,
  Activity,
} from 'lucide-react'
import {
  ComposedChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts'
import { useAnalyticsOverview, useOrdersPerMonth, useManualReviewRate } from '../hooks/useAnalytics'
import { useAdminOrders } from '../hooks/useAdminOrders'
import { cn } from '../lib/utils'

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({
  label, value, sub, delta, deltaPositive, icon: Icon, iconColor, iconBg,
}: {
  label: string
  value: string
  sub?: string
  delta?: string
  deltaPositive?: boolean
  icon: React.ElementType
  iconColor: string
  iconBg: string
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', iconBg)}>
          <Icon size={18} className={iconColor} />
        </div>
        {delta && (
          <span className={cn(
            'flex items-center gap-0.5 text-[12px] font-semibold px-2 py-0.5 rounded-full',
            deltaPositive ? 'text-emerald-700 bg-emerald-50' : 'text-red-600 bg-red-50',
          )}>
            {deltaPositive ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
            {delta}
          </span>
        )}
      </div>
      <div>
        <div className="text-[28px] font-bold text-gray-900 leading-none tracking-tight">{value}</div>
        {sub && <div className="text-[12px] text-gray-400 mt-1 font-medium">{sub}</div>}
        <div className="text-[12px] text-gray-500 mt-1">{label}</div>
      </div>
    </div>
  )
}

// ── Custom chart tooltip ───────────────────────────────────────────────────────

function ChartTooltip({
  active, payload, label,
}: {
  active?: boolean
  payload?: { name: string; value: number; color: string }[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-lg px-3 py-2.5 text-[12px]">
      <div className="font-semibold text-gray-700 mb-1.5">{label}</div>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-gray-500">{p.name}:</span>
          <span className="font-semibold text-gray-800">{p.value.toLocaleString()}</span>
        </div>
      ))}
    </div>
  )
}

// ── Status config ──────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  PROCESSING:    { label: 'In Production', color: 'text-blue-700',    bg: 'bg-blue-50 border-blue-200',       icon: Activity      },
  PRINTING:      { label: 'Printing',      color: 'text-blue-700',    bg: 'bg-blue-50 border-blue-200',       icon: Activity      },
  PROOFING:      { label: 'Proofing',      color: 'text-amber-700',   bg: 'bg-amber-50 border-amber-200',     icon: Clock         },
  APPROVED:      { label: 'Approved',      color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', icon: CheckCircle2  },
  COMPLETED:     { label: 'Completed',     color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', icon: CheckCircle2  },
  PENDING:       { label: 'Pending',       color: 'text-gray-600',    bg: 'bg-gray-100 border-gray-200',      icon: AlertTriangle },
  DRAFT:         { label: 'Draft',         color: 'text-gray-600',    bg: 'bg-gray-100 border-gray-200',      icon: AlertTriangle },
  CANCELLED:     { label: 'Cancelled',     color: 'text-red-600',     bg: 'bg-red-50 border-red-200',         icon: AlertTriangle },
}

const PIE_COLORS: Record<string, string> = {
  PENDING:    '#94A3B8',
  PROCESSING: '#3B82F6',
  PRINTING:   '#6366F1',
  PROOFING:   '#F59E0B',
  APPROVED:   '#34D399',
  COMPLETED:  '#10B981',
  CANCELLED:  '#F87171',
}

// ── Main dashboard ─────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const navigate = useNavigate()
  const { data: overview } = useAnalyticsOverview()
  const { data: monthlyRaw } = useOrdersPerMonth()
  const { data: reviewData } = useManualReviewRate()
  const { orders } = useAdminOrders()

  // Build monthly chart data from real API
  const monthlyData = monthlyRaw.map((d) => ({
    month: d.month,
    orders: d.count,
  }))

  // Build pie data from real orders
  const statusCounts = orders.reduce<Record<string, number>>((acc, o) => {
    acc[o.status] = (acc[o.status] ?? 0) + 1
    return acc
  }, {})
  const pieData = Object.entries(statusCounts)
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({
      name,
      value,
      color: PIE_COLORS[name] ?? '#94A3B8',
    }))
  const pieTotal = pieData.reduce((s, d) => s + d.value, 0) || orders.length

  // Recent orders — last 5
  const recentOrders = orders.slice(0, 5)

  return (
    <div className="space-y-5">

      {/* Page header */}
      <div className="flex items-center justify-between mb-1">
        <div>
          <h1 className="text-[22px] font-bold text-gray-900 leading-none tracking-tight">Operations Dashboard</h1>
          <p className="text-[13px] text-gray-400 mt-1">
            Real-time overview.{' '}
            {overview?.pending_orders != null && (
              <span>
                <span className="font-semibold text-gray-700">{overview.pending_orders}</span> orders need attention.
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/admin/orders')}
            className="flex items-center gap-1.5 text-[13px] font-semibold text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-xl transition-all shadow-sm shadow-blue-200"
          >
            <Download size={13} />
            View All Orders
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          label="Active Orders"
          value={overview?.pending_orders != null ? String(overview.pending_orders) : '—'}
          sub="currently pending"
          icon={ShoppingBag}
          iconColor="text-blue-600"
          iconBg="bg-blue-50"
        />
        <StatCard
          label="IDs Produced"
          value={overview?.total_ids != null ? overview.total_ids.toLocaleString() : '—'}
          sub="total across all orders"
          icon={CheckCircle2}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50"
        />
        <StatCard
          label="Manual Review Rate"
          value={reviewData?.rate != null ? `${reviewData.rate}%` : '—'}
          sub={reviewData ? `${reviewData.manual_review_count} of ${reviewData.total_students} flagged` : 'loading...'}
          icon={AlertTriangle}
          iconColor="text-amber-600"
          iconBg="bg-amber-50"
        />
        <StatCard
          label="Avg Turnaround Time"
          value={overview?.avg_turnaround_days != null ? `${overview.avg_turnaround_days}d` : '—'}
          sub="SLA: 7d standard"
          icon={Clock}
          iconColor="text-purple-600"
          iconBg="bg-purple-50"
        />
      </div>

      {/* Charts row */}
      <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 340px' }}>

        {/* Monthly Trend */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-start justify-between mb-5">
            <div>
              <h2 className="text-[14px] font-semibold text-gray-900">Monthly Orders Trend</h2>
              <p className="text-[12px] text-gray-400 mt-0.5">Total orders placed per month</p>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-medium">
              <span className="flex items-center gap-1.5 text-gray-500">
                <span className="w-3 h-3 rounded-sm bg-blue-500 inline-block" />
                Orders
              </span>
            </div>
          </div>
          {monthlyData.length === 0 ? (
            <div className="flex items-center justify-center h-[220px] text-[13px] text-gray-400">
              No monthly data yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <ComposedChart data={monthlyData} margin={{ top: 4, right: 4, bottom: 0, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: '#9CA3AF' }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: '#9CA3AF' }}
                  tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : String(v))}
                />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="orders" name="Orders" fill="#3B82F6" radius={[4, 4, 0, 0]} maxBarSize={48} />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Order Status Donut */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="mb-4">
            <h2 className="text-[14px] font-semibold text-gray-900">Order Status Distribution</h2>
            <p className="text-[12px] text-gray-400 mt-0.5">Current snapshot across all orders</p>
          </div>
          {pieData.length === 0 ? (
            <div className="flex items-center justify-center h-[220px] text-[13px] text-gray-400">
              No orders yet
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="relative">
                <PieChart width={180} height={180}>
                  <Pie
                    data={pieData}
                    cx={90}
                    cy={90}
                    innerRadius={52}
                    outerRadius={82}
                    dataKey="value"
                    strokeWidth={2}
                    stroke="#F7F8FA"
                  >
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
                {/* Center label */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <div className="text-[22px] font-bold text-gray-900 leading-none">{pieTotal.toLocaleString()}</div>
                  <div className="text-[11px] text-gray-400 mt-0.5">Total Orders</div>
                </div>
              </div>
              {/* Legend */}
              <div className="w-full space-y-2 mt-2">
                {pieData.map((d) => (
                  <div key={d.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: d.color }} />
                      <span className="text-[12px] text-gray-600">{d.name}</span>
                    </div>
                    <span className="text-[12px] font-semibold text-gray-800">{d.value.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom row: Recent Orders + Quick Stats */}
      <div className="grid gap-4 pb-2" style={{ gridTemplateColumns: '1fr 300px' }}>

        {/* Recent Orders */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="text-[14px] font-semibold text-gray-900">Recent Orders</h2>
            <button
              onClick={() => navigate('/admin/orders')}
              className="flex items-center gap-1 text-[12px] font-medium text-blue-600 hover:text-blue-700 transition-colors"
            >
              View All Orders <ArrowUpRight size={13} />
            </button>
          </div>

          {/* Column headers */}
          <div
            className="grid gap-3 px-5 py-2.5 bg-gray-50 border-b border-gray-100"
            style={{ gridTemplateColumns: '110px 1fr 130px 120px 90px' }}
          >
            {['Institution', 'School / Batch', 'Operator', 'Status', 'Created'].map((h) => (
              <div key={h} className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{h}</div>
            ))}
          </div>

          {/* Rows */}
          <div className="divide-y divide-gray-50">
            {recentOrders.length === 0 ? (
              <div className="px-5 py-8 text-[13px] text-gray-400 text-center">No orders found.</div>
            ) : recentOrders.map((order) => {
              const cfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG['PENDING']
              const StatusIcon = cfg.icon
              return (
                <div
                  key={order.id}
                  className="grid gap-3 px-5 py-3.5 items-center hover:bg-gray-50/70 transition-colors"
                  style={{ gridTemplateColumns: '110px 1fr 130px 120px 90px' }}
                >
                  <div className="text-[12px] font-medium text-gray-800 truncate">{order.institution__name}</div>
                  <div className="min-w-0">
                    <div className="text-[13px] font-semibold text-gray-800 truncate">{order.school_name}</div>
                    <div className="text-[11px] text-gray-400 truncate">{order.batch_name}</div>
                  </div>
                  <div className="text-[12px] text-gray-500 truncate">
                    {order.assigned_operator__username ?? (
                      <span className="text-gray-300 italic">Unassigned</span>
                    )}
                  </div>
                  <div>
                    <span className={cn(
                      'flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border w-fit',
                      cfg.color, cfg.bg,
                    )}>
                      <StatusIcon size={9} />
                      {cfg.label}
                    </span>
                  </div>
                  <div className="text-[11px] text-gray-400">
                    {new Date(order.created_at).toLocaleDateString()}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* System Health panel */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-[14px] font-semibold text-gray-900">System Overview</h2>
            <p className="text-[12px] text-gray-400 mt-0.5">Live counts from the API</p>
          </div>
          <div className="px-5 py-4 space-y-4">
            {[
              { label: 'Total Orders',         value: overview?.total_orders,         color: 'text-gray-800' },
              { label: 'Pending Orders',        value: overview?.pending_orders,       color: 'text-orange-600' },
              { label: 'Total IDs Produced',    value: overview?.total_ids,            color: 'text-emerald-600' },
              { label: 'Active Institutions',   value: overview?.active_institutions,  color: 'text-blue-600' },
              { label: 'Active Operators',      value: overview?.active_operators,     color: 'text-indigo-600' },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <span className="text-[13px] text-gray-500">{item.label}</span>
                <span className={cn('text-[14px] font-bold tabular-nums', item.color)}>
                  {item.value != null ? item.value.toLocaleString() : '—'}
                </span>
              </div>
            ))}

            {/* Manual review bar */}
            {reviewData && (
              <div className="pt-2 border-t border-gray-100">
                <div className="flex justify-between mb-1.5">
                  <span className="text-[12px] text-gray-500">Manual Review Rate</span>
                  <span className="text-[12px] font-semibold text-amber-600">{reviewData.rate}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5">
                  <div
                    className="bg-amber-400 h-1.5 rounded-full transition-all"
                    style={{ width: `${Math.min(reviewData.rate, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-gray-400 mt-1">
                  <span>{reviewData.manual_review_count} flagged</span>
                  <span>{reviewData.total_students} total students</span>
                </div>
              </div>
            )}
          </div>

          {/* Footer status */}
          <div className="px-5 py-3 border-t border-gray-100 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-medium text-emerald-600">System Operational</span>
          </div>
        </div>
      </div>
    </div>
  )
}
