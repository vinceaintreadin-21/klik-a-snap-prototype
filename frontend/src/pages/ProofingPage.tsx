/**
 * ProofingPage — operator proofing workspace.
 * Views: OrderQueue → OrderDetail → RevisionEditor
 * Visual design: QUEUEBITS_UI/ProofingView.tsx
 */

import { useState, useCallback, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import OrderQueue from "../components/proofing/OrderQueue";
import OrderDetail from "../components/proofing/OrderDetail";
import RevisionEditor from "../components/proofing/RevisionEditor";
import { useOrders } from "../context/OrderContext";
import type { OperatorOrder } from "../components/proofing/proofingTypes";

type View =
    | { kind: "queue" }
    | { kind: "detail"; order: OperatorOrder }
    | { kind: "revisions"; order: OperatorOrder };

export default function ProofingPage() {
    const location = useLocation();
    const { orders } = useOrders();
    const [view, setView] = useState<View>({ kind: "queue" });
    const autoOpenedRef = useRef(false);

    // Auto-open a specific order when navigated here with state (e.g. from dashboard "Proof" button)
    useEffect(() => {
        if (autoOpenedRef.current) return;
        const orderId = (location.state as { orderId?: number } | null)?.orderId;
        if (!orderId || orders.length === 0) return;
        const match = (orders as OperatorOrder[]).find(o => o.id === orderId);
        if (match) {
            autoOpenedRef.current = true;
            setView({ kind: "detail", order: match });
        }
    }, [orders, location.state]);

    const handleSelectOrder = useCallback((order: OperatorOrder) => {
        setView({ kind: "detail", order });
    }, []);

    const handleBack = useCallback(() => {
        setView({ kind: "queue" });
    }, []);

    const handleOpenRevisions = useCallback((order: OperatorOrder) => {
        setView({ kind: "revisions", order });
    }, []);

    const handleBackFromRevisions = useCallback((order: OperatorOrder) => {
        setView({ kind: "detail", order });
    }, []);

    if (view.kind === "revisions") {
        return (
            <div className="h-[calc(100vh-60px)] flex flex-col">
                <RevisionEditor
                    order={view.order}
                    onBack={() => handleBackFromRevisions(view.order)}
                />
            </div>
        );
    }

    if (view.kind === "detail") {
        return (
            <div className="h-[calc(100vh-60px)] flex flex-col overflow-hidden">
                <OrderDetail
                    order={view.order}
                    onBack={handleBack}
                    onOpenRevisions={() => handleOpenRevisions(view.order)}
                />
            </div>
        );
    }

    return (
        <div className="h-[calc(100vh-60px)] overflow-hidden">
            <OrderQueue onSelect={handleSelectOrder} />
        </div>
    );
}
