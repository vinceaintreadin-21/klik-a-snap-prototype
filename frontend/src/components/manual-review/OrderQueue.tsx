import { useState, useMemo } from "react";
import { Search, Check, ChevronRight, AlertTriangle, Users, Clock } from "lucide-react";
import { useOrders } from "../../context/OrderContext";
import { cn } from "../../lib/utils";

interface OrderQueueProps {
  onSelect: (order: any) => void
}

export function OrderQueue({ onSelect }: OrderQueueProps) {
  const { orders, progress } = useOrders()
  const [query, setQuery] = useState('')

  const reviewOrders = orders.filter(o => (progress[o.id]?.manual_review ?? 0) > 0)

  const filtered = useMemo(() => {
    const q = query.toLowerCase()
    if (!q) return reviewOrders
    return reviewOrders.filter(o =>
      o.school_name.toLowerCase().includes(q) ||
      o.batch_name.toLowerCase().includes(q) ||
      String(o.id).includes(q),
    )
  }, [reviewOrders, query])

  const totalNeedingReview = reviewOrders.reduce(
    (sum, o) => sum + (progress[o.id]?.manual_review ?? 0), 0
  )

  return (
    <div className="flex flex-col h-full">
      <header className="sticky top-0 bg-white border-b border-gray-100 shadow-sm z-10">
        <div className="flex items-center gap-4 px-8 py-3">
          <span className="text-[15px] font-semibold text-gray-900">Manual Review</span>
          {totalNeedingReview > 0 && (
            <span className="text-[11px] font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-100">
              {totalNeedingReview} items need review
            </span>
          )}
        </div>
      </header>

      <main className="flex-1 px-8 py-8 overflow-y-auto">
        <div className="max-w-6xl w-full mx-auto">
          <div className="flex items-end justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Review Queue</h2>
              <p className="text-sm text-gray-500">
                Orders with photos that failed automated processing and need manual intervention.
              </p>
            </div>
            <div className="relative shrink-0 w-56">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input type="text" placeholder="Search orders…" value={query}
                onChange={e => setQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 placeholder:text-gray-400 transition-all" />
            </div>
          </div>

          {reviewOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                <Check size={24} className="text-emerald-500" />
              </div>
              <p className="text-sm font-semibold text-gray-600">No items need review</p>
              <p className="text-xs text-gray-400">All processed photos passed the AI pipeline.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filtered.length === 0 && (
                <div className="col-span-full py-12 text-center text-sm text-gray-400">
                  No orders match &ldquo;{query}&rdquo;
                </div>
              )}
              {filtered.map(order => {
                const reviewCount = progress[order.id]?.manual_review ?? 0
                const isUrgent = order.deadline && (() => {
                  const diff = new Date(order.deadline).getTime() - Date.now()
                  return diff > 0 && diff < 24 * 60 * 60 * 1000
                })()

                return (
                  <div key={order.id}
                    className={cn(
                      'group bg-white rounded-2xl border shadow-sm hover:shadow-md transition-all duration-200 p-5 flex flex-col justify-between',
                      isUrgent ? 'border-red-100 hover:border-red-200' : 'border-gray-100 hover:border-blue-200',
                    )}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span className="text-[11px] font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                            #{order.id}
                          </span>
                          <span className="text-[10px] font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                            {order.batch_name}
                          </span>
                          {isUrgent && (
                            <span className="flex items-center gap-1 text-[10px] font-semibold text-red-600 bg-red-50 border border-red-100 px-2 py-0.5 rounded-full uppercase tracking-wide">
                              <AlertTriangle size={9} />Urgent
                            </span>
                          )}
                        </div>
                        <h3 className="text-base font-semibold text-gray-900 mb-1">{order.school_name}</h3>
                        <div className="flex items-center gap-4 text-[12px] text-gray-400 mb-3">
                          <span className="flex items-center gap-1"><Users size={11} />{order.student_count.toLocaleString()} students</span>
                          {order.deadline && (
                            <span className="flex items-center gap-1">
                              <Clock size={11} />
                              {new Date(order.deadline).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-gray-50 flex items-center justify-between gap-3 mt-2">
                      <span className="flex items-center gap-1.5 text-[12px] font-semibold text-red-600">
                        <AlertTriangle size={12} />{reviewCount} photo{reviewCount !== 1 ? 's' : ''} need review
                      </span>
                      <button
                        onClick={() => onSelect(order)}
                        className={cn(
                          'shrink-0 flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl transition-all shadow-sm group-hover:scale-105 duration-200',
                          isUrgent
                            ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-200'
                            : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200',
                        )}>
                        Start Review <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}