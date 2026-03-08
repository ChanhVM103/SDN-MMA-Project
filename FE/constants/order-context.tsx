import React, { createContext, useContext, useMemo, useState } from 'react';

export interface OrderedItem {
  id: string;
  name: string;
  price: number;
  emoji: string;
  qty: number;
  size?: string;
  toppings?: string[];
}

export interface OrderRecord {
  id: string;
  restaurantId?: string; // Add restaurantId for review
  hasReviewed?: boolean; // Track if order has been reviewed
  restaurantName: string;
  restaurantAddress: string;
  totalPrice: number;
  itemCount: number;
  status: 'ORDERED';
  createdAt: string;
  items: OrderedItem[];
}

interface OrderContextType {
  orders: OrderRecord[];
  addOrder: (order: OrderRecord) => void;
  markAsReviewed: (orderId: string) => void;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export function OrderProvider({ children }: { children: React.ReactNode }) {
  const [orders, setOrders] = useState<OrderRecord[]>([]);

  const addOrder = (order: OrderRecord) => {
    setOrders(prev => [order, ...prev]);
  };

  const markAsReviewed = (orderId: string) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, hasReviewed: true } : o));
  };

  const value = useMemo(() => ({ orders, addOrder, markAsReviewed }), [orders]);

  return <OrderContext.Provider value={value}>{children}</OrderContext.Provider>;
}

export function useOrder() {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrder must be used within an OrderProvider');
  }
  return context;
}
