import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import XLSX from "xlsx";
import { getOrderAge, getStatusClass } from "./utils";
import { useOrders } from "../contexts/OrdersContext";

function decodeFilterLabel(filter) {
  if (!filter) return null;
  const [key, val] = filter.split("=");
  const decoded = decodeURIComponent(val || "");
  if (key === "orderType") return `Order Type · ${decoded}`;
  if (key === "orderStatus") return `Status · ${decoded}`;
  return decoded;
}

export default function List(props) {
  const { orders, loading } = useOrders();
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    let result = orders.filter(
      (o) => !String(o.orderStatus || "").toLowerCase().includes("close")
    );
    const filter = props.match.params.filter;
    if (filter) {
      const [key, rawVal] = filter.split("=");
      const val = decodeURIComponent(rawVal || "");
      result = result.filter((o) => String(o[key]) === val);
    }
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((o) =>
        Object.keys(o).some((k) => String(o[k]).toLowerCase().includes(q))
      );
    }
    return result;
  }, [orders, props.match.params.filter, search]);

  function downloadToCSV() {
    const _orders = [];
    filtered.forEach((o) => {
      if (o.orderStatus.includes("Close")) return;
      _orders.push({
        orderDate: o.orderDate,
        orderId: o.orderId,
        partyId: o.partyId,
        orderType: o.orderType,
        orderQuantity: o.orderQuantity,
        orderStatus: o.orderStatus,
        orderAge: getOrderAge(o),
        lastUpdateDate:
          o.orderHistory && o.orderHistory.length
            ? o.orderHistory[o.orderHistory.length - 1].updateDate
            : "",
        orderSqFt: o.orderSqFt,
        orderArea: o.orderArea,
      });
    });
    const ws = XLSX.utils.json_to_sheet(_orders);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Orders");
    XLSX.writeFile(wb, "orderList.xlsx");
  }

  const filterLabel = decodeFilterLabel(props.match.params.filter);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Orders</h1>
          <div className="page-subtitle">
            {filterLabel ? (
              <>Filtered by {filterLabel} · {filtered.length} match{filtered.length === 1 ? "" : "es"}</>
            ) : (
              <>{filtered.length} active order{filtered.length === 1 ? "" : "s"}</>
            )}
          </div>
        </div>
        <button
          type="button"
          className="btn btn-app btn-outline-secondary"
          onClick={downloadToCSV}
          disabled={!filtered.length}
        >
          Download Excel
        </button>
      </div>

      <div className="toolbar">
        <label className="toolbar-search">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="search"
            placeholder="Search by order id, party, status…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
      </div>

      {loading && !orders.length && (
        <div className="empty-state">
          <span className="spinner-inline">Loading orders…</span>
        </div>
      )}

      {!loading && !filtered.length && (
        <div className="empty-state">
          <div className="empty-state-title">No orders found</div>
          <div>{search ? "Try a different search." : "There are no active orders right now."}</div>
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
                  <th>Last Updated</th>
                  <th>Age</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((order) => (
                  <tr key={order.id}>
                    <td data-label="Order ID">
                      <Link to={`/detail/${order.id}`} className="order-id-link">
                        {order.orderId}
                      </Link>
                    </td>
                    <td data-label="Party">{order.partyId}</td>
                    <td data-label="Type" className="muted">{order.orderType}</td>
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
