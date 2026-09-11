import { useState, useMemo } from "react";
import { ChevronRight, Users, Calendar, Search, AlertTriangle } from "lucide-react";
import { cn } from "../../lib/utils";
import { useOrders } from "../../context/OrderContext";
import { STATUS_CONFIG } from "./StatusConfig";
import type { OperatorOrder, OperatorOrderStatus } from "./proofingTypes";

interface OrderQueueProps {
    onSelect: (order: OperatorOrder) => void;
}

export default function OrderQueue({ onSelect }: OrderQueueProps) {
    const { orders, progress } = useOrders()
    const [search, setSearch] = useState("")

    const proofingOrders = useMemo(
        () => (orders as OperatorOrder[]).filter(o => ["PROOFING", "APPROVED", "PRINTING", "COMPLETED"].includes(o.status)),
        [orders],
    );

    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        if (!q) return proofingOrders;
        return proofingOrders.filter(
            o =>
                o.school_name.toLowerCase().includes(q) ||
                o.batch_name.toLowerCase().includes(q) ||
                String(o.id).includes(q),
        );
    }, [proofingOrders, search]);

    return (
        <div className="flex flex-col h-full">
            <header className="sticky top-0 bg-white border-b border-gray-100 shadow-sm z-10">
                <div className="flex items-center gap-4 px-8 py-3">
                    <h1 className="text-[15px] font-semibold text-gray-900">Proofing</h1>
                    <div className="relative ml-auto w-56 shrink-0">
                        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        <input
                            type="text"
                            placeholder="Search orders..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full pl-8 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 placeholder:text-gray-400 transition-all"
                        />
                    </div>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto px-8 py-7">
                <div className="max-w-3xl space-y-3">
                    {filtered.length === 0 && <div className="py-16 text-center text-sm text-gray-400">No orders in proofing</div>}

                    {filtered.map(order => {
                        const cfg = STATUS_CONFIG[order.status as OperatorOrderStatus] ?? STATUS_CONFIG.PROOFING;
                        const revisionCount = progress[order.id]?.manual_review ?? 0;
                        const needsRevision = revisionCount > 0;

                        return (
                            <div
                                key={order.id}
                                className={cn(
                                    "bg-white rounded-2xl border shadow-sm hover:shadow-md transition-all duration-200 p-5",
                                    needsRevision ? "border-red-100 hover:border-red-200" : "border-gray-100 hover:border-blue-100",
                                )}
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                                            <span className="text-[11px] font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                                                #{order.id}
                                            </span>
                                            <span className="text-[10px] font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                                                {order.batch_name}
                                            </span>
                                            <span className={cn("flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border", cfg.color, cfg.bg)}>
                                                <cfg.icon size={9} />
                                                {cfg.label}
                                            </span>
                                            {needsRevision && (
                                                <span className="text-[10px] font-semibold text-red-600">
                                                    {revisionCount} card{revisionCount > 1 ? "s" : ""} to fix
                                                </span>
                                            )}
                                        </div>

                                        <h3 className="text-base font-semibold text-gray-900 mb-1">{order.school_name}</h3>

                                        <div className="flex items-center gap-4 text-[12px] text-gray-400">
                                            <span className="flex items-center gap-1">
                                                <Users size={11} />
                                                {order.student_count.toLocaleString()} IDs
                                            </span>
                                            {order.deadline && (
                                                <span className="flex items-center gap-1">
                                                    <Calendar size={10} />
                                                    Due {new Date(order.deadline).toLocaleDateString()}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-end gap-2 shrink-0">
                                        {needsRevision && (
                                            <span className="flex items-center gap-1 text-[11px] font-semibold text-red-600">
                                                <AlertTriangle size={11} />
                                                Needs revision
                                            </span>
                                        )}
                                        <button
                                            onClick={() => onSelect(order)}
                                            className={cn(
                                                "flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl transition-all shadow-sm",
                                                needsRevision
                                                    ? "bg-red-600 hover:bg-red-700 text-white"
                                                    : "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200",
                                            )}
                                        >
                                            Open Proofing <ChevronRight size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </main>
        </div>
    );
}