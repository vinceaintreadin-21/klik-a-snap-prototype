import { useNavigate } from 'react-router-dom'
import {
  TrendingUp, TrendingDown, ChevronRight, MoreHorizontal,
  ShoppingBag, CheckCircle2, Clock, AlertTriangle, Activity,
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, Legend,
} from 'recharts'
import {
  useAnalyticsOverview,
  useOrdersPerMonth,
  useManualReviewRate,
  useAvgTurnaround,
} from '../hooks/useAnalytics'
import { useAdminOrders } from '../hooks/useAdminOrders'
import { useOperators } from '../hooks/useOperators'
import { cn } from '../lib/utils'

// ── Stat card ──────────────────────────────────────────────────────────────────

function StatCard({
  label, value, unit, delta, deltaType, icon: Icon, iconBg, iconColor,
}: {
  label: string
  value: string
  unit?: string
  delta?: string
  deltaType?: 'up' | 'down' | 'stable'
  icon: React.ElementType
  iconBg: string
  iconColor: string
}) {
  return (
    <div className="flex-1 bg-white border border-[#e2e8f0] rounded-2xl p-5 shadow-sm min-w-0">
      <div className="flex items-start justify-between mb-3">
        <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center', iconBg)}>
          <Icon size={16} className={iconColor} />
        </div>
        {delta && (
          <span className={cn(
            'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold',
            deltaType === 'stable'
              ? 'bg-[#e0f2fe] text-[#0369a1]'
              : deltaType === 'up'
              ? 'bg-[#dcfce7] text-[#166534]'
              : 'bg-[#fee2e2] text-[#991b1b]',
          )}>
            {deltaType === 'up'   && <TrendingUp size={10} />}
            {deltaType === 'down' && <TrendingDown size={10} />}
            {delta}
          </span>
        )}
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-[30px] font-bold text-[#0b1c30] leading-none">{value}</span>
        {unit && <span className="text-[15px] text-[#64748b]">{unit}</span>}
      </div>
      <p className="text-[11px] font-bold text-[#64748b] uppercase tracking-wider mt-1.5">{label}</p>
    </div>
  )
}

// ── Custom tooltip ──────────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: {
  active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-[#e2e8f0] rounded-xl shadow-lg px-3 py-2.5 text-[12px]">
      <div className="font-semibold text-[#64748b] mb-1.5">{label}</div>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-[#64748b]">{p.name}:</span>
          <span className="font-semibold text-[#0b1c30]">{p.value.toLocaleString()}</span>
        </div>
      ))}
    </div>
  )
}

// ── Skeleton loader ────────────────────────────────────────────────────────────

function ChartSkeleton({ height = 220 }: { height?: number }) {
  return (
    <div className="animate-pulse flex flex-col gap-2" style={{ height }}>
      <div className="flex items-end gap-1 h-full px-2">
        {[40, 65, 50, 80, 55, 90, 70].map((h, i) => (
          <div key={i} className="flex-1 bg-gray-100 rounded-t" style={{ height: `${h}%` }} />
        ))}
      </div>
    </div>
  )
}

// ── AI Confidence placeholder ──────────────────────────────────────────────────
// This chart is intentionally a stub — ready for the AI pipeline metrics endpoint.

const AI_CONFIDENCE_PLACEHOLDER = [
  { score: '0.5', count: 0 },
  { score: '0.6', count: 0 },
  { score: '0.7', count: 0 },
  { score: '0.8', count: 0 },
  { score: '0.9', count: 0 },
  { score: '1.0', count: 0 },
]

function AIConfidenceChart() {
  return (
    <div className="bg-white border border-[#e2e8f0] rounded-2xl p-5 shadow-sm flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-[15px] font-bold text-[#0b1c30]">AI Match Confidence</h3>
          <p className="text-[12px] text-[#64748b] mt-0.5">Distribution of face-match confidence scores</p>
        </div>
        <button className="p-1 rounded hover:bg-gray-50">
          <MoreHorizontal size={16} className="text-[#94a3b8]" />
        </button>
      </div>

      {/* Coming soon overlay */}
      <div className="relative flex-1">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={AI_CONFIDENCE_PLACEHOLDER} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="score" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {AI_CONFIDENCE_PLACEHOLDER.map((_, i) => (
                <Cell key={i} fill="#e2e8f0" />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-[1px] rounded-lg">
          <div className="w-9 h-9 rounded-xl bg-[#eff4ff] flex items-center justify-center mb-2">
            <Activity size={16} className="text-[#004ac6]" />
          </div>
          <p className="text-[13px] font-semibold text-[#0b1c30]">AI Pipeline Metrics</p>
          <p className="text-[11px] text-[#64748b] mt-0.5 text-center px-4">
            Confidence distribution will appear once<br />the AI pipeline is instrumented.
          </p>
        </div>
      </div>

      {/* Score legend */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#f1f5f9]">
        {[
          { label: 'High (≥0.9)',   color: '#1d4ed8' },
          { label: 'Mid (0.7–0.9)', color: '#93c5fd' },
          { label: 'Low (<0.7)',    color: '#e2e8f0' },
        ].map((s) => (
          <div key={s.label} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ background: s.color }} />
            <span className="text-[11px] text-[#64748b]">{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Orders by institution (derived from orders list) ───────────────────────────

function OrdersByInstitution({ orders }: { orders: { institution__name: string }[] }) {
  // Aggregate client-side from the loaded orders
  const counts = orders.reduce<Record<string, number>>((acc, o) => {
    const name = o.institution__name ?? 'Unknown'
    acc[name] = (acc[name] ?? 0) + 1
    return acc
  }, {})

  const data = Object.entries(counts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6)
    .map(([name, value]) => ({ name, value }))

  const max = Math.max(...data.map((d) => d.value), 1)

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[180px] text-[13px] text-[#94a3b8]">
        No order data yet
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {data.map((d) => (
        <div key={d.name}>
          <div className="flex items-center justify-between text-[13px] mb-1">
            <span className="text-[#434655] truncate max-w-[200px]">{d.name}</span>
            <span className="text-[#0b1c30] font-semibold ml-2 shrink-0">{d.value.toLocaleString()}</span>
          </div>
          <div className="h-2 bg-[#e2e8f0] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#1d4ed8] rounded-full transition-all"
              style={{ width: `${(d.value / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Operator productivity (derived from operators list) ────────────────────────
// Uses workload pseudo-data until a dedicated endpoint is available.

function OperatorProductivityChart({ operators }: { operators: { user__username: string; id: number }[] }) {
  const data = operators.slice(0, 6).map((op) => {
    const seed = op.id
    return {
      op: op.user__username.length > 8 ? op.user__username.slice(0, 8) + '…' : op.user__username,
      processed: (seed * 37) % 400 + 100,
      approved:  (seed * 19) % 300 + 80,
    }
  })

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[200px] text-[13px] text-[#94a3b8]">
        No operator data yet
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis dataKey="op" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
        <Tooltip content={<ChartTooltip />} />
        <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 11 }} />
        <Bar dataKey="processed" name="Processed" fill="#1d4ed8" radius={[3, 3, 0, 0]} />
        <Bar dataKey="approved"  name="Approved"  fill="#60a5fa" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────

const Analytics = () => {
  const navigate = useNavigate()
  const { data: overview, loading: ovLoading } = useAnalyticsOverview()
  const { data: monthly,  loading: moLoading } = useOrdersPerMonth()
  const { data: review,   loading: rvLoading } = useManualReviewRate()
  const { data: turnaround }                   = useAvgTurnaround()
  const { orders }                             = useAdminOrders()
  const { operators }                          = useOperators()

  // Normalise monthly — backend returns `count`, old hook type had `orders`
  const monthlyData = monthly.map((d) => ({
    month: d.month,
    orders: (d as any).count ?? (d as any).orders ?? 0,
  }))

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
            <span className="text-[#004ac6] font-medium">Analytics</span>
          </div>
          <h1 className="text-[24px] font-bold text-[#0b1c30] tracking-tight">Analytics</h1>
          <p className="text-[13px] text-[#64748b]">
            Production metrics, order trends, and AI pipeline performance.
          </p>
        </div>
      </div>

      {/* Stat cards row */}
      <div className="flex gap-4">
        <StatCard
          label="Total Orders"
          value={ovLoading ? '—' : (overview?.total_orders?.toLocaleString() ?? '—')}
          icon={ShoppingBag}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
        />
        <StatCard
          label="IDs Produced"
          value={ovLoading ? '—' : (overview?.total_ids?.toLocaleString() ?? '—')}
          icon={CheckCircle2}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
        />
        <StatCard
          label="Avg Turnaround"
          value={turnaround?.avg_turnaround_days != null ? String(turnaround.avg_turnaround_days) : '—'}
          unit="days"
          delta="SLA: 7d"
          deltaType="stable"
          icon={Clock}
          iconBg="bg-purple-50"
          iconColor="text-purple-600"
        />
        <StatCard
          label="Manual Review Rate"
          value={rvLoading ? '—' : (review?.rate != null ? `${review.rate}%` : '—')}
          delta={review?.rate != null ? (review.rate < 5 ? 'Healthy' : 'High') : undefined}
          deltaType={review?.rate != null ? (review.rate < 5 ? 'up' : 'down') : undefined}
          icon={AlertTriangle}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
        />
      </div>

      {/* Charts row 1: Orders trend + AI Confidence */}
      <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 360px' }}>

        {/* Orders per month area chart */}
        <div className="bg-white border border-[#e2e8f0] rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-[15px] font-bold text-[#0b1c30]">Orders Per Month</h3>
              <p className="text-[12px] text-[#64748b] mt-0.5">Total orders placed each month</p>
            </div>
            <button className="p-1 rounded hover:bg-gray-50">
              <MoreHorizontal size={16} className="text-[#94a3b8]" />
            </button>
          </div>
          {moLoading ? (
            <ChartSkeleton height={220} />
          ) : monthlyData.length === 0 ? (
            <div className="flex items-center justify-center h-[220px] text-[13px] text-[#94a3b8]">
              No data yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={monthlyData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="ordersGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#3b5bdb" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#3b5bdb" stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: '#9CA3AF' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#9CA3AF' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => v >= 1000 ? `${v / 1000}k` : v}
                />
                <Tooltip content={<ChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="orders"
                  name="Orders"
                  stroke="#3b5bdb"
                  strokeWidth={2.5}
                  fill="url(#ordersGrad)"
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* AI Confidence Distribution */}
        <AIConfidenceChart />
      </div>

      {/* Charts row 2: Manual review + Orders by institution + Operator productivity */}
      <div className="grid grid-cols-3 gap-4">

        {/* Manual review breakdown */}
        <div className="bg-white border border-[#e2e8f0] rounded-2xl p-5 shadow-sm flex flex-col gap-4">
          <div>
            <h3 className="text-[15px] font-bold text-[#0b1c30]">Manual Review Rate</h3>
            <p className="text-[12px] text-[#64748b] mt-0.5">Students flagged for manual review</p>
          </div>

          {rvLoading ? (
            <div className="animate-pulse space-y-3">
              <div className="h-8 w-24 bg-gray-100 rounded" />
              <div className="h-2 w-full bg-gray-100 rounded-full" />
            </div>
          ) : review ? (
            <>
              <div className="flex items-end gap-2">
                <span className="text-[36px] font-bold text-[#0b1c30] leading-none">{review.rate}%</span>
                <span className={cn(
                  'text-[12px] font-semibold px-2 py-0.5 rounded-full mb-1',
                  review.rate < 5
                    ? 'bg-[#dcfce7] text-[#166534]'
                    : review.rate < 10
                    ? 'bg-[#fff7ed] text-[#c2410c]'
                    : 'bg-[#fee2e2] text-[#991b1b]',
                )}>
                  {review.rate < 5 ? 'Healthy' : review.rate < 10 ? 'Elevated' : 'High'}
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-[12px] text-[#64748b]">
                  <span>Flagged students</span>
                  <span className="font-semibold text-[#0b1c30]">{review.manual_review_count.toLocaleString()}</span>
                </div>
                <div className="w-full h-2 bg-[#f1f5f9] rounded-full overflow-hidden">
                  <div
                    className={cn('h-full rounded-full transition-all',
                      review.rate < 5 ? 'bg-[#22c55e]' : review.rate < 10 ? 'bg-[#f97316]' : 'bg-[#ef4444]')}
                    style={{ width: `${Math.min(review.rate, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-[#94a3b8]">
                  <span>0%</span>
                  <span>{review.total_students.toLocaleString()} total students</span>
                </div>
              </div>

              {/* Avg turnaround mini stat */}
              {turnaround && (
                <div className="pt-3 border-t border-[#f1f5f9] flex items-center justify-between">
                  <span className="text-[12px] text-[#64748b]">Avg Turnaround</span>
                  <div className="text-right">
                    <span className="text-[15px] font-bold text-[#0b1c30]">
                      {turnaround.avg_turnaround_days ?? '—'}d
                    </span>
                    {turnaround.avg_turnaround_hours != null && (
                      <span className="text-[11px] text-[#94a3b8] ml-1">
                        ({turnaround.avg_turnaround_hours}h)
                      </span>
                    )}
                  </div>
                </div>
              )}

              {turnaround && (
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[12px] text-[#64748b]">Completed orders</span>
                  <span className="text-[13px] font-semibold text-[#0b1c30]">
                    {turnaround.completed_order_count.toLocaleString()}
                  </span>
                </div>
              )}
            </>
          ) : (
            <p className="text-[13px] text-[#94a3b8]">No data</p>
          )}
        </div>

        {/* Orders by institution */}
        <div className="bg-white border border-[#e2e8f0] rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-[15px] font-bold text-[#0b1c30]">Orders by Institution</h3>
              <p className="text-[12px] text-[#64748b] mt-0.5">Top 6 by order count</p>
            </div>
            <button className="p-1 rounded hover:bg-gray-50">
              <MoreHorizontal size={16} className="text-[#94a3b8]" />
            </button>
          </div>
          <OrdersByInstitution orders={orders} />
        </div>

        {/* Operator productivity */}
        <div className="bg-white border border-[#e2e8f0] rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-[15px] font-bold text-[#0b1c30]">Operator Productivity</h3>
              <p className="text-[12px] text-[#64748b] mt-0.5">
                Pseudo-data — real metrics coming soon
              </p>
            </div>
            <button className="p-1 rounded hover:bg-gray-50">
              <MoreHorizontal size={16} className="text-[#94a3b8]" />
            </button>
          </div>
          <OperatorProductivityChart operators={(operators ?? []) as { user__username: string; id: number }[]} />
        </div>
      </div>

      {/* System health footer strip */}
      <div className="bg-white border border-[#e2e8f0] rounded-2xl px-6 py-4 shadow-sm flex items-center gap-8 flex-wrap">
        {[
          { label: 'Active Institutions', value: overview?.active_institutions },
          { label: 'Active Operators',    value: overview?.active_operators    },
          { label: 'Pending Orders',      value: overview?.pending_orders      },
          { label: 'Total IDs Produced',  value: overview?.total_ids           },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-[#22c55e]" />
            <span className="text-[12px] text-[#64748b]">{item.label}</span>
            <span className="text-[14px] font-bold text-[#0b1c30]">
              {item.value != null ? item.value.toLocaleString() : '—'}
            </span>
          </div>
        ))}
        <div className="ml-auto flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[11px] font-medium text-emerald-600">System Operational</span>
        </div>
      </div>
    </div>
  )
}

export default Analytics
