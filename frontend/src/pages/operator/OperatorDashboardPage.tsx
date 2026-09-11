/**
 * OperatorDashboardPage — redesigned operator dashboard with the QUEUEBITS_UI
 * style (stat cards, orders table) while wiring up the real API data.
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useOrders } from '../../context/OrderContext'
import api from '../../utils/api'
import {
  CheckCircle2,  AlertTriangle, Loader2,
  LayoutTemplate, Upload, GitBranch, ClipboardCheck,
} from 'lucide-react'
import { cn } from '../../lib/utils'
import LayoutConfigModal from '../../components/LayoutConfigModal'
import UploadPhotosModal from '../../components/UploadPhotosModal'
import ManualReviewQueueModal from '../../components/ManualReviewQueueModal'
import GenerateTestPhotosButton from '../../components/GenerateTestPhotosButton'

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon: Icon,
  iconColor,
  iconBg,
  sub,
}: {
  label: string
  value: string | number
  icon: React.ElementType
  iconColor: string
  iconBg: string
  sub?: string
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3">
      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', iconBg)}>
        <Icon size={18} className={iconColor} />
      </div>
      <div>
        <div className="text-[28px] font-bold text-gray-900 leading-none tracking-tight">{value}</div>
        {sub && <div className="text-[12px] text-gray-400 mt-1 font-medium">{sub}</div>}
        <div className="text-[12px] text-gray-500 mt-1">{label}</div>
      </div>
    </div>
  )
}

// ── Status badge ──────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  PENDING:    { bg: 'bg-amber-50',   text: 'text-amber-700'   },
  PROCESSING: { bg: 'bg-blue-50',    text: 'text-blue-700'    },
  PROOFING:   { bg: 'bg-purple-50',  text: 'text-purple-700'  },
  APPROVED:   { bg: 'bg-emerald-50', text: 'text-emerald-700' },
  PRINTING:   { bg: 'bg-orange-50',  text: 'text-orange-700'  },
  COMPLETED:  { bg: 'bg-green-50',   text: 'text-green-700'   },
  FAILED:     { bg: 'bg-red-50',     text: 'text-red-700'     },
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_COLORS[status] ?? { bg: 'bg-gray-50', text: 'text-gray-600' }
  return (
    <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full', cfg.bg, cfg.text)}>
      {status}
    </span>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function OperatorDashboardPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { orders, progress, updateStatus, connectOrderSocket } = useOrders()

  const [selectedOrderId,  setSelectedOrderId]  = useState<number | null>(null)
  const [isLayoutModalOpen, setIsLayoutModalOpen] = useState(false)
  const [uploadModalOrder,  setUploadModalOrder]  = useState<any | null>(null)
  const [reviewOrder,       setReviewOrder]       = useState<any | null>(null)
  const [ordersWithLayout,  setOrdersWithLayout]  = useState<Set<number>>(new Set())

  useEffect(() => {
    orders.forEach(async (order) => {
      try {
        await api.get(`/orders/${order.id}/layout/`)
        setOrdersWithLayout(prev => new Set(prev).add(order.id))
      } catch { /* no layout yet */ }
    })
  }, [orders])

  const handleStartAI = async (id: number) => {
    try {
      try {
        await api.get(`/orders/${id}/layout/`)
      } catch (layoutErr: any) {
        if (layoutErr.response?.status === 404) {
          const go = window.confirm(
            'No layout configured for this order.\n\nClick OK to open the Layout editor, then run AI after saving.'
          )
          if (go) {
            setSelectedOrderId(id)
            setIsLayoutModalOpen(true)
          }
          return
        }
      }
      const res = await api.post(`/orders/${id}/process/`)
      updateStatus(id, 'PROCESSING')
      connectOrderSocket(id)

      const poll = setInterval(async () => {
        try {
          const orderRes = await api.get('/orders/')
          const allOrders = orderRes.data
          let stillProcessing = false
          allOrders.forEach((o: any) => {
            if (o.status === 'PROCESSING') stillProcessing = true
            if (o.id === id && o.status !== 'PROCESSING') updateStatus(id, o.status)
          })
          if (!stillProcessing) clearInterval(poll)
        } catch {
          clearInterval(poll)
        }
      }, 3000)

      alert(res.data.message)
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to start AI engine.')
    }
  }

  const handleCompleteOrder = async (id: number) => {
    if (!window.confirm('Are you sure you want to proceed?')) return
    try {
      const res = await api.post(`/orders/${id}/complete/`)
      const newStatus = res.data.message.includes('PRINTING') ? 'PRINTING' : 'COMPLETED'
      updateStatus(id, newStatus)
      alert(res.data.message)
    } catch (err: any) {
      alert(err.response?.data?.error || 'Cannot complete order yet.')
    }
  }

  // Stats derived from live orders
  const totalOrders     = orders.length
  const inProgress      = orders.filter(o => o.status === 'PROCESSING').length
  const needsReviewTotal = Object.values(progress).reduce((sum, p) => sum + (p.manual_review || 0), 0)
  const completed       = orders.filter(o => o.status === 'COMPLETED').length

  return (
    <div className="p-8 space-y-6 max-w-[1400px]">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user?.username}</h1>
        <p className="text-sm text-gray-500 mt-1">Here's the state of your production queue.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          label="Total Orders"
          value={totalOrders}
          icon={CheckCircle2}
          iconColor="text-blue-600"
          iconBg="bg-blue-50"
        />
        <StatCard
          label="In Progress"
          value={inProgress}
          icon={Loader2}
          iconColor="text-amber-600"
          iconBg="bg-amber-50"
          sub="Currently processing"
        />
        <StatCard
          label="Need Review"
          value={needsReviewTotal}
          icon={AlertTriangle}
          iconColor="text-red-600"
          iconBg="bg-red-50"
          sub="Manual review required"
        />
        <StatCard
          label="Completed"
          value={completed}
          icon={CheckCircle2}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { icon: LayoutTemplate, label: 'Layout Builder',  path: '/operator/layout-builder', color: 'text-blue-600',   bg: 'bg-blue-50'   },
          { icon: Upload,         label: 'Batch Upload',    path: '/operator/batch-upload',   color: 'text-green-600',  bg: 'bg-green-50'  },
          { icon: GitBranch,      label: 'View Pipeline',   path: '/operator/pipeline',       color: 'text-purple-600', bg: 'bg-purple-50' },
          { icon: ClipboardCheck, label: 'Manual Review',   path: '/operator/manual-review',  color: 'text-red-600',    bg: 'bg-red-50'    },
        ].map(item => (
          <button
            key={item.label}
            onClick={() => navigate(item.path)}
            className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-100 transition-all text-left group"
          >
            <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0', item.bg)}>
              <item.icon size={16} className={item.color} />
            </div>
            <span className="text-sm font-semibold text-gray-700 group-hover:text-blue-700 transition-colors">
              {item.label}
            </span>
          </button>
        ))}
      </div>

      {/* Production Queue */}
      <div>
        <h2 className="text-lg font-bold text-gray-800 mb-4">Production Queue</h2>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Order Details</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-sm text-gray-400">
                    No orders assigned to you yet.
                  </td>
                </tr>
              )}
              {orders.map((order) => {
                const p = progress[order.id] || { processed: 0, manual_review: 0, total: 0 }
                const hasLayout = ordersWithLayout.has(order.id)

                return (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-bold text-gray-900">{order.school_name}</p>
                      <p className="text-xs text-gray-400">{order.batch_name} • {order.student_count} pax</p>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={order.status} />
                      {['PROCESSING', 'PROOFING'].includes(order.status) && p.total > 0 && (
                        <div className="w-48 mt-2">
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div
                              className="bg-blue-600 h-1.5 rounded-full transition-all"
                              style={{ width: `${(p.processed / p.total) * 100}%` }}
                            />
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {p.processed}/{p.total} processed
                            {p.manual_review > 0 && (
                              <span className="text-red-500 ml-1">• {p.manual_review} need review</span>
                            )}
                          </p>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      {['PENDING', 'FAILED', 'PROOFING'].includes(order.status) && (
                        <>
                          <GenerateTestPhotosButton
                            orderId={order.id}
                            orderName={`${order.school_name}_${order.batch_name}`}
                          />
                          <button
                            onClick={() => setUploadModalOrder(order)}
                            className="px-3 py-1.5 text-xs font-semibold border border-gray-200 rounded-lg hover:bg-gray-100 transition-all"
                          >
                            Upload Photos
                          </button>
                        </>
                      )}

                      {p.manual_review > 0 && (
                        <button
                          onClick={() => setReviewOrder(order)}
                          className="px-3 py-1.5 text-xs font-semibold bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all"
                        >
                          Review ({p.manual_review})
                        </button>
                      )}

                      <button
                        onClick={() => { setSelectedOrderId(order.id); setIsLayoutModalOpen(true) }}
                        className="px-3 py-1.5 text-xs font-semibold border border-gray-200 rounded-lg hover:bg-gray-100 transition-all"
                      >
                        Layout
                      </button>

                      <button
                        disabled={order.status === 'PROCESSING'}
                        onClick={() => handleStartAI(order.id)}
                        className={cn(
                          'px-3 py-1.5 text-xs font-semibold rounded-lg text-white shadow-sm transition-all',
                          order.status === 'PROCESSING'
                            ? 'bg-gray-400'
                            : hasLayout
                              ? 'bg-blue-600 hover:bg-blue-700'
                              : 'bg-amber-500 hover:bg-amber-600'
                        )}
                      >
                        {order.status === 'PROCESSING' ? 'Running...' : hasLayout ? 'Run AI' : '⚠ Run AI'}
                      </button>

                      {order.status === 'APPROVED' && (
                        <button
                          onClick={() => handleCompleteOrder(order.id)}
                          className="px-3 py-1.5 text-xs font-semibold bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-all"
                        >
                          Send to Print
                        </button>
                      )}
                      {order.status === 'PRINTING' && (
                        <button
                          onClick={() => handleCompleteOrder(order.id)}
                          className="px-3 py-1.5 text-xs font-semibold bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all"
                        >
                          Mark Complete
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {isLayoutModalOpen && selectedOrderId && (
        <LayoutConfigModal orderId={selectedOrderId} onClose={() => setIsLayoutModalOpen(false)} />
      )}
      {uploadModalOrder && (
        <UploadPhotosModal
          order={uploadModalOrder}
          onClose={() => setUploadModalOrder(null)}
          onSuccess={() => setUploadModalOrder(null)}
        />
      )}
      {reviewOrder && (
        <ManualReviewQueueModal
          order={reviewOrder}
          onClose={() => setReviewOrder(null)}
          onSuccess={() => {}}
        />
      )}
    </div>
  )
}
