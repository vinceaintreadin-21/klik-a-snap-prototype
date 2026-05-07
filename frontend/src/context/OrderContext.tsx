import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

interface OrderContextType {
  orders: any[];
  addOrder: (order: any) => void;
  updateStatus: (id: number, status: string) => void;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export const OrderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [orders, setOrders] = useState<any[]>([]);

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
    const socket = new WebSocket('ws://127.0.0.1:8000/ws/posts/');
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.action === 'status_update') {
        updateStatus(data.id, data.status);
      }
      // Optional: If a new order is created by another user, 
      // you might want to handle data.action === 'created' here too
    };
    return () => socket.close();
  }, []);

  const addOrder = (order: any) => setOrders((prev) => [order, ...prev]);
  
  const updateStatus = (id: number, status: string) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
  };

  return (
    <OrderContext.Provider value={{ orders, addOrder, updateStatus }}>
      {children}
    </OrderContext.Provider>
  );
};

export const useOrders = () => {
  const context = useContext(OrderContext);
  if (!context) throw new Error("useOrders must be used within OrderProvider");
  return context;
};