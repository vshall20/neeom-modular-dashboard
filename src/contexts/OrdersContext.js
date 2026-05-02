import React, { createContext, useContext, useEffect, useState } from "react";
import app from "../firebase";
import { useAuth } from "./AuthContext";

const OrdersContext = createContext({ orders: [], loading: true });

export function useOrders() {
  return useContext(OrdersContext);
}

export function OrdersProvider({ children }) {
  const { currentUser } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) {
      setOrders([]);
      setLoading(false);
      return undefined;
    }
    setLoading(true);
    const unsubscribe = app
      .firestore()
      .collection("orders")
      .where("orderStatus", "!=", "Order Close")
      .orderBy("orderStatus")
      .orderBy("orderId", "desc")
      .onSnapshot(
        (snap) => {
          const items = [];
          snap.forEach((doc) => {
            const item = doc.data();
            const status = String(item.orderStatus || "").toLowerCase();
            if (status.includes("close")) return;
            item.id = doc.id;
            items.push(item);
          });
          items.sort((a, b) =>
            String(b.orderId || "").localeCompare(String(a.orderId || ""))
          );
          setOrders(items);
          setLoading(false);
        },
        (err) => {
          console.error("OrdersContext snapshot error:", err);
          setLoading(false);
        }
      );
    return () => unsubscribe();
  }, [currentUser]);

  return (
    <OrdersContext.Provider value={{ orders, loading }}>
      {children}
    </OrdersContext.Provider>
  );
}
