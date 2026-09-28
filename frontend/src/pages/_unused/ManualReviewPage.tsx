import { useState } from "react";
import { OrderQueue } from "../../components/operator/manual-review/OrderQueue";
import { ReviewInterface } from "../../components/operator/manual-review/ReviewInterface";

export default function ManualReviewPage() {
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null)

  if (selectedOrder) {
    return (
      <div className="h-[calc(100vh-60px)] flex flex-col">
        <ReviewInterface
          order={selectedOrder}
          onBack={() => setSelectedOrder(null)}
        />
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-60px)] overflow-hidden">
      <OrderQueue onSelect={setSelectedOrder} />
    </div>
  )
}