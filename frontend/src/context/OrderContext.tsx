import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import api from '../utils/api';

interface OrderContextType {
  orders: any[];
  progress: Record<number, { processed: number; manual_review: number; total: number }>;
  addOrder: (order: any) => void;
  updateStatus: (id: number, status: string) => void;
  connectOrderSocket: (orderId: number) => void
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export const OrderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [orders, setOrders] = useState<any[]>([]);
  const [progress, setProgress] = useState<Record<number, {
    processed: number;
    manual_review: number;
    total: number;
  }>>({});

  const orderSockets = useRef<Record<number, WebSocket>>({})

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

  const connectOrderSocket = (orderId: number) => {
    if (orderSockets.current[orderId]) {
      orderSockets.current[orderId].close()
    }

    const token = localStorage.getItem('access_token')
    const WS_BASE = import.meta.env.VITE_WS_URL ?? 'ws://127.0.0.1:8000'
    const socket = new WebSocket(`${WS_BASE}/ws/orders/${orderId}/?token=${token}`)
  
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data)
      if (data.action === 'status_update') {
        updateStatus(data.id, data.status)
        
        if (data.status === 'PROOFING' && data.processed !== undefined) {
            setProgress(prev => ({
                ...prev,
                [orderId]: {
                    processed: data.processed,
                    manual_review: data.manual_review,
                    total: data.total,
                }
            }))
        }
      }
      if (data.action === 'progress_update') {
        setProgress(prev => ({
          ...prev,
          [orderId]: {
            processed: data.processed,
            manual_review: data.manual_review,
            total: data.total,
          }
        }))
      }
    }

    socket.onclose = () => { 
      delete orderSockets.current[orderId] 
      setOrders(prev => {
        const order = prev.find(o => o.id === orderId)
        if (order?.status === 'PROCESSING') {
            setTimeout(() => connectOrderSocket(orderId), 1000)
        }
        return prev
      })
    }
    socket.onerror = (err) => { console.error(`WS error order ${orderId}:`, err); socket.close() }

    orderSockets.current[orderId] = socket
  }

  useEffect(() => {
    return () => {
      Object.values(orderSockets.current).forEach(ws => ws.close())
    }
  }, [])

  const addOrder = (order: any) => setOrders((prev) => [order, ...prev]);

  const updateStatus = (id: number, status: string) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
  };

  return (
    <OrderContext.Provider value={{ orders, progress, addOrder, updateStatus, connectOrderSocket }}>
      {children}
    </OrderContext.Provider>
  );
};

export const useOrders = () => {
  const context = useContext(OrderContext)
  if (!context) throw new Error("useOrders must be used within OrderProvider");
  return context
}

