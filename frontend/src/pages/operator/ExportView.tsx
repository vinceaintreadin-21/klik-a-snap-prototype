import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import {
  type ExportOrder,
  isExportEnabled,
  getOrderStatus,
  getInstitutionName,
  getBatchRef,
} from "../../components/operator/exports/exportTypes";
import { fetchExportOrders } from "../../utils/exportApi";
import { OrderExportDetail } from "../../components/operator/exports/OrderExportDetail";
import { OrderCard } from "../../components/operator/exports/OrderCard";
import { cn } from "../../lib/utils";

type FilterKey = "all" | "export_ready" | "locked";

export function ExportView() {
  const [orders, setOrders] = useState<ExportOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedOrder, setSelectedOrder] = useState<ExportOrder | null>(null);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchExportOrders()
      .then((data) => setOrders(data || []))
      .catch((err) => setError(err.message || "Failed to fetch orders"))
      .finally(() => setLoading(false));
  }, []);

  if (selectedOrder) {
    return <OrderExportDetail order={selectedOrder} onBack={() => setSelectedOrder(null)} />;
  }

  const readyCount = orders.filter((o) => isExportEnabled(getOrderStatus(o))).length;
  const lockedCount = orders.length - readyCount;

  const FILTER_TABS: { key: FilterKey; label: string; count: number }[] = [
    { key: "all", label: "All Orders", count: orders.length },
    { key: "export_ready", label: "Export Ready", count: readyCount },
    { key: "locked", label: "Locked", count: lockedCount },
  ];

  const filteredOrders = orders.filter((o) => {
    const status = getOrderStatus(o);
    const enabled = isExportEnabled(status);
    if (filter === "export_ready" && !enabled) return false;
    if (filter === "locked" && enabled) return false;

    const q = search.toLowerCase().trim();
    if (!q) return true;

    const inst = getInstitutionName(o).toLowerCase();
    const idStr = String(o.id || "").toLowerCase();
    const ref = getBatchRef(o).toLowerCase();

    return inst.includes(q) || idStr.includes(q) || ref.includes(q);
  });

  return (
    <div className="flex flex-col h-screen bg-[#F7F8FA]">
      <header className="sticky top-0 bg-white border-b border-gray-100 shadow-sm z-10">
        <div className="flex items-center gap-4 px-8 py-3">
          <h1 className="text-[15px] font-semibold text-gray-900">Export</h1>
          <div className="flex items-center gap-1">
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors whitespace-nowrap",
                  filter === tab.key ? "bg-blue-50 text-blue-700 font-semibold" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                )}
              >
                {tab.label}
                <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded-full", filter === tab.key ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500")}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
          <div className="relative ml-auto w-52 shrink-0">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search orders…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 placeholder:text-gray-400 transition-all"
            />
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-8 py-7">
        <div className="max-w-6xl mx-auto w-full">
          {loading && <div className="py-16 text-center text-sm text-gray-400">Loading orders...</div>}
          {error && <div className="py-16 text-center text-sm text-red-500">{error}</div>}
          {!loading && !error && filteredOrders.length === 0 && (
            <div className="py-16 text-center text-sm text-gray-400">No orders found</div>
          )}

          {!loading && !error && filteredOrders.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredOrders.map((order) => (
                <OrderCard key={order.id} order={order} onSelect={setSelectedOrder} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}