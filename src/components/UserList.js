import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getOrderAge, getStatusClass } from "./utils";
import { useOrders } from "../contexts/OrdersContext";

export default function UserList() {
  const { activeOrders, loading } = useOrders();
  const [search, setSearch] = useState("");

  const visible = useMemo(() => {
    if (!search || search.length < 4) return [];
    const q = search.toLowerCase();
    return activeOrders.filter(
      (o) =>
        String(o.orderId || "").toLowerCase().includes(q) ||
        String(o.reference || "").toLowerCase().includes(q)
    );
  }, [activeOrders, search]);

  const showHint = !search || search.length < 4;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Order Lookup</h1>
          <div className="page-subtitle">
            Type at least 4 characters of an order ID or reference to search.
          </div>
        </div>
      </div>

      <div className="toolbar">
        <label className="toolbar-search">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="search"
            placeholder="Search order ID or reference…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
      </div>

      {loading && !activeOrders.length && (
        <div className="empty-state">
          <span className="spinner-inline">Loading orders…</span>
        </div>
      )}

      {!loading && showHint && (
        <div className="empty-state">
          <div className="empty-state-title">Search to find an order</div>
          <div>Type at least 4 characters of the order ID to see results.</div>
        </div>
      )}

      {!loading && !showHint && !visible.length && (
        <div className="empty-state">
          <div className="empty-state-title">No matches</div>
          <div>No active order matches "{search}". Closed orders are not shown.</div>
        </div>
      )}

      {!!visible.length && (
        <div className="table-card">
          <div className="table-scroll">
            <table className="table app-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Party</th>
                  <th>Order Date</th>
                  <th>Last Updated</th>
                  <th>Age</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((order) => (
                  <tr key={order.id}>
                    <td data-label="Order ID">
                      <Link to={`/detail/${order.id}`} className="order-id-link">
                        {order.orderId}
                      </Link>
                    </td>
                    <td data-label="Party">{order.partyId}</td>
                    <td data-label="Order Date" className="text-tnum">{order.orderDate}</td>
                    <td data-label="Last Updated" className="text-tnum muted">
                      {order.orderHistory && order.orderHistory.length
                        ? order.orderHistory[order.orderHistory.length - 1].updateDate
                        : "—"}
                    </td>
                    <td data-label="Age" className="text-tnum muted">{getOrderAge(order)}</td>
                    <td data-label="Status">
                      <span className={`status-pill ${getStatusClass(order.orderStatus)}`}>
                        {order.orderStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
