import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import app from "../firebase";
import { getStatusClass } from "./utils";

export default function ClosedOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const snap = await app
          .firestore()
          .collection("ordersClosed")
          .orderBy("orderId", "desc")
          .get();
        if (cancelled) return;
        const items = snap.docs.map((d) => ({ ...d.data(), id: d.id }));
        setOrders(items);
        setLoading(false);
      } catch (err) {
        if (cancelled) return;
        console.error(err);
        setError(err.message || "Failed to load closed orders");
        setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    if (!search) return orders;
    const q = search.toLowerCase();
    return orders.filter((o) =>
      Object.keys(o).some((k) => String(o[k]).toLowerCase().includes(q))
    );
  }, [orders, search]);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Closed Orders</h1>
          <div className="page-subtitle">
            Archived orders. {orders.length} total{search ? ` · ${filtered.length} match${filtered.length === 1 ? "" : "es"}` : ""}.
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
            placeholder="Search closed orders…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
      </div>

      {error && <div className="form-feedback error">{error}</div>}

      {loading && (
        <div className="empty-state">
          <span className="spinner-inline">Loading closed orders…</span>
        </div>
      )}

      {!loading && !filtered.length && (
        <div className="empty-state">
          <div className="empty-state-title">No closed orders found</div>
          <div>{search ? "Try a different search." : "Archive is empty."}</div>
        </div>
      )}

      {!!filtered.length && (
        <div className="table-card">
          <div className="table-scroll">
            <table className="table app-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Party</th>
                  <th>Type</th>
                  <th>Order Date</th>
                  <th>Closed On</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((order) => {
                  const lastEntry =
                    order.orderHistory && order.orderHistory.length
                      ? order.orderHistory[order.orderHistory.length - 1]
                      : null;
                  return (
                    <tr key={order.id}>
                      <td data-label="Order ID">
                        <Link to={`/detail/${order.id}`} className="order-id-link">
                          {order.orderId}
                        </Link>
                      </td>
                      <td data-label="Party">{order.partyId}</td>
                      <td data-label="Type" className="muted">{order.orderType}</td>
                      <td data-label="Order Date" className="text-tnum">{order.orderDate}</td>
                      <td data-label="Closed On" className="text-tnum muted">
                        {lastEntry ? lastEntry.updateDate : "—"}
                      </td>
                      <td data-label="Status">
                        <span className={`status-pill ${getStatusClass(order.orderStatus)}`}>
                          {order.orderStatus}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
