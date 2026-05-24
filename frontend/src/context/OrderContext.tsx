import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

interface OrderContextType {
  orders: any[];
  progress: Record<number, { processed: number; manual_review: number; total: number }>;
  addOrder: (order: any) => void;
  updateStatus: (id: number, status: string) => void;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export const OrderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [orders, setOrders] = useState<any[]>([]);
  const [progress, setProgress] = useState<Record<number, {
    processed: number;
    manual_review: number;
    total: number;
  }>>({});

  // 1. INITIAL FETCH (Persistence Fix)
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await api.get('/orders/');
        setOrders(response.data);
      } catch (err) {
        console.error("Could not load orders");
      }
    };
    fetchOrders();
  }, []);

  // 2. WebSocket listener (Module 3)
  useEffect(() => {
    let socket: WebSocket;
    let retryTimeout: ReturnType<typeof setTimeout>;
    let retryDelay = 1000;
    let destroyed = false;
    const MAX_DELAY = 30000;

    const connect = () => {
      const token = localStorage.getItem('access_token');
      const WS_BASE = import.meta.env.VITE_WS_URL ?? 'ws://127.0.0.1:8000';
      socket = new WebSocket(`${WS_BASE}/ws/posts/?token=${token}`);

      socket.onopen = () => {
        retryDelay = 1000;
      };

      socket.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.action === 'status_update') {
          updateStatus(data.id, data.status);
        }
        if (data.action === 'progress_update') {
          setProgress(prev => ({
            ...prev,
            [data.order_id]: {
              processed: data.processed,
              manual_review: data.manual_review,
              total: data.total,
            }
          }));
        }
        if (data.action === 'order_created') {
          addOrder(data.order);
        }
      };

      socket.onclose = () => {
        if (destroyed) return;
        retryTimeout = setTimeout(() => {
          retryDelay = Math.min(retryDelay * 2, MAX_DELAY);
          connect();
        }, retryDelay);
      };

      socket.onerror = (err) => {
        console.error("WebSocket error:", err);
        socket.close();
      };
    };

    connect();

    return () => {
      destroyed = true;
      clearTimeout(retryTimeout);
      socket?.close();
    };
  }, []);

  const addOrder = (order: any) => setOrders((prev) => [order, ...prev]);

  const updateStatus = (id: number, status: string) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
  };

  return (
    <OrderContext.Provider value={{ orders, progress, addOrder, updateStatus }}>
      {children}
    </OrderContext.Provider>
  );
};

export const useOrders = () => {
  const context = useContext(OrderContext);
  if (!context) throw new Error("useOrders must be used within OrderProvider");
  return context;
};