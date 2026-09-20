import React, { createContext, useContext, useState, useEffect } from "react";
import { collection, onSnapshot, query, where, orderBy, doc, addDoc, updateDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";
import { useAuth } from "./AuthContext";

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  selectedColor?: string;
  selectedSize?: string;
}

export interface Order {
  id: string;
  date: string;
  status: string;
  paymentStatus?: string;
  trackingLink?: string;
  transactionId?: string;
  lastNumber?: string;
  total: number;
  deliveryFee?: number;
  serviceCharge?: number;
  items: OrderItem[];
  customerInfo: {
    name: string;
    phone: string;
    address: string;
    area?: string;
  };
  paymentMethod: string;
  userId?: string;
  createdAt?: any;
  // Steadfast Courier Fields
  steadfastConsignmentId?: number | string;
  steadfastTrackingCode?: string;
  steadfastStatus?: string;
  steadfastBookedAt?: string;
  steadfastNote?: string;
  // UddoktaPay Fields
  uddoktaPayInvoiceId?: string;
  uddoktaPayStatus?: string;
  paymentGatewayUrl?: string;
}

interface OrderContextType {
  orders: Order[];
  addOrder: (order: Omit<Order, 'id'>) => Promise<string>;
  updateOrderStatus: (orderId: string, status: Order["status"]) => Promise<void>;
  updateOrder: (orderId: string, data: Partial<Order>) => Promise<void>;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export const OrderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const { user, isAdmin, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      setOrders([]);
      return;
    }

    let q = query(collection(db, "orders"));
    
    // If not admin, only show own orders
    if (!isAdmin) {
      q = query(collection(db, "orders"), where("userId", "==", user.uid));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedOrders = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Order));
      // Sort client-side to avoid need for composite index
      fetchedOrders.sort((a, b) => {
        const timeA = a.createdAt?.seconds || new Date(a.date).getTime() || 0;
        const timeB = b.createdAt?.seconds || new Date(b.date).getTime() || 0;
        return timeB - timeA;
      });
      setOrders(fetchedOrders);
    }, (error) => handleFirestoreError(error, OperationType.LIST, "orders"));

    return () => unsubscribe();
  }, [user?.uid, isAdmin, loading]);

  const addOrder = async (orderData: Omit<Order, 'id'>) => {
    if (!user) throw new Error("User must be logged in to place an order");
    
    const id = `ORD-${Date.now()}`;
    const newOrder = {
      ...orderData,
      id,
      userId: user.uid,
      createdAt: serverTimestamp(),
    };
    try {
      await setDoc(doc(db, "orders", id), newOrder);
      return id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `orders/${id}`);
      throw error;
    }
  };

  const updateOrderStatus = async (orderId: string, status: Order["status"]) => {
    try {
      await updateDoc(doc(db, "orders", orderId), { status });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `orders/${orderId}`);
    }
  };

  const updateOrder = async (orderId: string, data: Partial<Order>) => {
    try {
      await updateDoc(doc(db, "orders", orderId), data as any);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `orders/${orderId}`);
    }
  };

  return (
    <OrderContext.Provider value={{ orders, addOrder, updateOrderStatus, updateOrder }}>
      {children}
    </OrderContext.Provider>
  );
};

export const useOrders = () => {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error("useOrders must be used within an OrderProvider");
  }
  return context;
};
