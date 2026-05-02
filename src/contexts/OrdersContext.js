import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import app from "../firebase";
import { useAuth } from "./AuthContext";

export function isClosedStatus(status) {
  return String(status || "").toLowerCase().includes("close");
}

const OrdersContext = createContext({
  orders: [],
  activeOrders: [],
  loading: true,
});

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
      .orderBy("orderId", "desc")
      .onSnapshot(
        (snap) => {
          const items = [];
          snap.forEach((doc) => {
            const item = doc.data();
            item.id = doc.id;
            items.push(item);
          });
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

  const activeOrders = useMemo(
    () => orders.filter((o) => !isClosedStatus(o.orderStatus)),
    [orders]
  );

  return (
    <OrdersContext.Provider value={{ orders, activeOrders, loading }}>
      {children}
    </OrdersContext.Provider>
  );
}
