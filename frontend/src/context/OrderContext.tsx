import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import api from '../utils/api';

interface OrderContextType {
  orders: any[];
  progress: Record<number, { processed: number; manual_review: number; total: number }>;
  addOrder: (order: any) => void;
  updateOrder: (order: any) => void;
  updateStatus: (id: number, status: string) => void;
  connectOrderSocket: (orderId: number) => void;
  clearOrders: () => void;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

// Decode a JWT's exp claim without verifying signature (client-side check only)
const isTokenExpired = (token: string, skewSeconds = 10): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const nowSeconds = Date.now() / 1000;
    return payload.exp < nowSeconds + skewSeconds; // treat as expired slightly early
  } catch {
    return true; // unparseable token = treat as expired
  }
};

// Ensures we have a valid access token, refreshing if needed
const getValidAccessToken = async (): Promise<string | null> => {
  const accessToken = localStorage.getItem('access_token');
  const refreshToken = localStorage.getItem('refresh_token');

  if (accessToken && !isTokenExpired(accessToken)) {
    return accessToken;
  }

  if (!refreshToken) return null;

  try {
    const res = await api.post('/token/refresh/', { refresh: refreshToken });
    const newAccessToken = res.data.access;
    localStorage.setItem('access_token', newAccessToken);
    return newAccessToken;
  } catch (err) {
    console.error('Failed to refresh access token', err);
    return null;
  }
};

export const OrderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [orders, setOrders] = useState<any[]>([]);
  const [progress, setProgress] = useState<Record<number, {
    processed: number;
    manual_review: number;
    total: number;
  }>>({});

  const orderSockets = useRef<Record<number, WebSocket>>({});

  const connectOrderSocket = async (orderId: number) => {
    if (orderSockets.current[orderId]) {
      orderSockets.current[orderId].close();
    }

    const token = await getValidAccessToken();
    if (!token) {
      console.error(`No valid token available, cannot open socket for order ${orderId}`);
      return;
    }

    const WS_BASE = import.meta.env.VITE_WS_URL ?? 'ws://127.0.0.1:8000';
    const socket = new WebSocket(`${WS_BASE}/ws/orders/${orderId}/?token=${token}`);

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.action === 'status_update') {
        updateOrder({ id: data.id, status: data.status });

        if (data.status === 'PROOFING' && data.processed !== undefined) {
          setProgress(prev => ({
            ...prev,
            [orderId]: {
              processed: data.processed,
              manual_review: data.manual_review,
              total: data.total,
            },
          }));
        }
      }

      if (data.action === 'progress_update') {
        setProgress(prev => ({
          ...prev,
          [orderId]: {
            processed: data.processed,
            manual_review: data.manual_review,
            total: data.total,
          },
        }));
      }
    };

    socket.onclose = (event) => {
      delete orderSockets.current[orderId];

      // Auth failure — token was invalid/expired despite our check, or got
      // revoked mid-flight. Refresh and retry immediately, once.
      if (event.code === 4001) {
        console.warn(`Auth failed for order ${orderId} socket, retrying with fresh token`);
        setTimeout(() => connectOrderSocket(orderId), 500);
        return;
      }

      setOrders(prev => {
        const order = prev.find(o => o.id === orderId);
        if (order?.status === 'PROCESSING') {
          setTimeout(() => connectOrderSocket(orderId), 1000);
        }
        return prev;
      });
    };

    socket.onerror = (err) => {
      console.error(`WS error order ${orderId}:`, err);
      socket.close();
    };

    orderSockets.current[orderId] = socket;
  };

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await api.get('/orders/');
        const fetchedOrders: any[] = response.data;
        setOrders(fetchedOrders);

        // Restore progress for PROOFING orders from the student API,
        // since the WebSocket only pushes progress during active processing.
        // Without this, the "Needs Review" button is invisible after a refresh.
        for (const order of fetchedOrders) {
          if (order.status === 'PROOFING') {
            try {
              const studentsRes = await api.get(`/orders/${order.id}/students/`);
              const students: any[] = studentsRes.data;
              const manual_review = students.filter(
                s => s.photo_status === 'MANUAL_REVIEW' ||
                     (s.photo_status === 'PENDING' && !s.original_photo_url)
              ).length;
              const processed = students.filter(s => s.photo_status === 'PROCESSED').length;
              const total = students.length;
              setProgress(prev => ({
                ...prev,
                [order.id]: { processed, manual_review, total },
              }));
            } catch {
              // non-fatal: progress just stays empty for this order
            }
          }

          // Reconnect socket for any order still actively processing
          if (order.status === 'PROCESSING') {
            connectOrderSocket(order.id);
          }
        }
      } catch (err) {
        console.error('Could not load orders');
      }
    };
    fetchOrders();
  }, []);

  useEffect(() => {
    return () => {
      Object.values(orderSockets.current).forEach(ws => ws.close());
    };
  }, []);

  const addOrder = (order: any) => {
    setOrders(prev => [order, ...prev]);
  };

  const updateOrder = (order: Partial<any> & { id: number }) => {
    setOrders(prev =>
      prev.map(o => o.id === order.id ? { ...o, ...order } : o)
    );
  };

  const updateStatus = (id: number, status: string) => {
    updateOrder({ id, status });
  };

  const clearOrders = () => {
    Object.values(orderSockets.current).forEach(ws => ws.close());
    orderSockets.current = {};
    setOrders([]);
    setProgress({});
  };

  return (
    <OrderContext.Provider value={{
      orders,
      progress,
      addOrder,
      updateOrder,
      updateStatus,
      clearOrders,
      connectOrderSocket,
    }}>
      {children}
    </OrderContext.Provider>
  );
};

export const useOrders = () => {
  const context = useContext(OrderContext);
  if (!context) throw new Error('useOrders must be used within OrderProvider');
  return context;
};