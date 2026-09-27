import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import api, { refreshAccessToken } from '../utils/api';
import { clearAccessToken, getAccessToken, getRefreshToken, isTokenExpired } from '../utils/jwt';

const MAX_AUTH_RETRIES = 3;

interface OrderContextType {
  orders: any[];
  progress: Record<number, { processed: number; manual_review: number; total: number }>;
  addOrder: (order: any) => void;
  updateOrder: (order: any) => void;
  updateStatus: (id: number, status: string) => void;
  connectOrderSocket: (orderId: number) => void;
  clearOrders: () => void;
  currentStage: Record<number, string>
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

// Ensures we have a valid access token, refreshing if needed. The socket
// handshake authenticates via query param, so it can't rely on the axios
// interceptor and has to renew the token itself.
const getValidAccessToken = async (): Promise<string | null> => {
  const accessToken = getAccessToken();
  if (accessToken && !isTokenExpired(accessToken)) {
    return accessToken;
  }

  if (!getRefreshToken()) return null;

  try {
    return await refreshAccessToken();
  } catch {
    console.error('Failed to refresh access token');
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
  const [currentStage, setCurrentStage] = useState<Record<number, string>>({});

  const orderSockets = useRef<Record<number, WebSocket>>({});
  const authRetries = useRef<Record<number, number>>({});

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

      // A delivered message proves the token was accepted, so clear the
      // auth-failure budget.
      authRetries.current[orderId] = 0;

      if (data.action === 'stage_update') {
        setCurrentStage(prev => ({...prev, [orderId]: data.stage}))
      }

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
      // revoked mid-flight. Force a renewal and retry, but only a few times:
      // if the server keeps rejecting a genuinely refreshed token (revoked
      // user, changed permissions) retrying forever is a hot loop.
      if (event.code === 4001) {
        const attempts = (authRetries.current[orderId] ?? 0) + 1;
        authRetries.current[orderId] = attempts;

        if (attempts > MAX_AUTH_RETRIES) {
          console.error(
            `Giving up on order ${orderId} socket after ${MAX_AUTH_RETRIES} auth failures`,
          );
          return;
        }

        console.warn(
          `Auth failed for order ${orderId} socket, retrying with fresh token (${attempts}/${MAX_AUTH_RETRIES})`,
        );
        setTimeout(async () => {
          // Evict the cached access token so getValidAccessToken must renew.
          // The refresh token stays — the session is still recoverable.
          clearAccessToken();
          await connectOrderSocket(orderId);
        }, 500);
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
    authRetries.current = {};
    setOrders([]);
    setProgress({});
    setCurrentStage({});
  };

  return (
    <OrderContext.Provider value={{
      orders,
      progress,
      currentStage,
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