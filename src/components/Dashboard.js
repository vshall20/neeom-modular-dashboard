import React, { useState, useEffect } from "react";
import { Alert } from "react-bootstrap";
import { Link } from "react-router-dom";
import app from "../firebase";
import { getStatusClass } from "./utils";
import { useOrders } from "../contexts/OrdersContext";
const _ = require("underscore");

function getToday() {
  const date = new Date();
  return `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}`;
}

function getDateFromString(_date) {
  const date = new Date(_date);
  return `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}`;
}

function toIsoDateInputValue(date) {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

function dmyToDate(dmy) {
  if (!dmy) return new Date();
  const [d, m, y] = dmy.split("-").map((n) => parseInt(n, 10));
  return new Date(y, m - 1, d);
}

export default function Dashboard() {
  const { orders: initOrderList, loading: loadingOrders } = useOrders();
  const [pendingOrders, setPendingOrders] = useState({});
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);
  const [statusOrders, setStatusOrders] = useState({});
  const [statusOrdersSum, setStatusOrdersSum] = useState({});
  const [initOrderHistoryList, setInitOrderHistoryList] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [date, setDate] = useState(getToday());
  const [error] = useState("");
  const [showMore, setShowMore] = useState("");
  const [orderDetailsForDate, setOrderDetailsForDate] = useState({});

  function getOrderHistoryForDate(targetDate) {
    setLoadingHistory(true);
    return app
      .firestore()
      .collection("orderHistory")
      .where("updateDate", "==", targetDate)
      .get()
      .then((querySnapshot) => handleHistorySnapshotData(querySnapshot))
      .catch((e) => {
        console.error(e);
        setLoadingHistory(false);
      });
  }

  function handleHistorySnapshotData(querySnapshot) {
    const items = [];
    querySnapshot.forEach((doc) => {
      const _item = doc.data();
      if (_item.updatedTo === "Order Close") return;
      _item.id = doc.id;
      items.push(_item);
    });
    setInitOrderHistoryList(items);
    setLoadingHistory(false);
  }

  useEffect(() => {
    getOrderHistoryForDate(getToday());
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    calculate();
    calculateSum(date);
    // eslint-disable-next-line
  }, [initOrderHistoryList, initOrderList]);

  function handleDateChange(e) {
    const newDate = getDateFromString(e.target.value);
    setDate(newDate);
    getOrderHistoryForDate(newDate);
  }

  function calculateSum(currentDate) {
    const orderByStatus = _.groupBy(initOrderHistoryList, "updatedTo");
    const statusSum = {};
    const orderDetails = {};
    Object.keys(orderByStatus).forEach((status) => {
      const sumSqft = orderByStatus[status].reduce((sum, o) => {
        if (o.updateDate === currentDate) {
          const details = orderDetails[status] || [];
          orderDetails[status] = [...details, { orderId: o.orderId, id: o.id }];
          return sum + (parseFloat(o.orderSqFt) || 0);
        }
        return sum;
      }, 0);
      statusSum[status] = sumSqft;
    });
    setOrderDetailsForDate(orderDetails);
    setStatusOrdersSum(statusSum);
  }

  function calculate() {
    const filteredOrders = initOrderList.filter(
      (order) =>
        order.orderStatus !== "Order Close" &&
        order.orderStatus !== "Dispatch" &&
        order.orderStatus !== "Packed"
    );
    setPendingOrdersCount(filteredOrders.length);
    setPendingOrders(_.countBy(filteredOrders, "orderType"));
    setStatusOrders(_.countBy(initOrderList, "orderStatus"));
  }

  const totalActive = initOrderList.length;
  const packedCount = statusOrders["Packed"] || 0;
  const dispatchCount = statusOrders["Dispatch"] || 0;
  const totalDailySqFt = Object.values(statusOrdersSum).reduce(
    (a, b) => a + (Number(b) || 0),
    0
  );
  const dailyEntries = Object.entries(statusOrdersSum).filter(([, v]) => Number(v) > 0);
  const isToday = date === getToday();

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <div className="page-subtitle">
            Live overview of active orders and today's production.
          </div>
        </div>
        {(loadingOrders || loadingHistory) && (
          <span className="spinner-inline">Refreshing…</span>
        )}
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      <div className="kpi-grid" style={{ marginBottom: 8 }}>
        <div className="kpi-tile kpi-summary">
          <span className="kpi-label">Pending Orders</span>
          <span className="kpi-value">{pendingOrdersCount}</span>
          <span className="kpi-sub">
            Not yet packed, dispatched, or closed
          </span>
        </div>
        <div className="kpi-tile">
          <span className="kpi-label">Active Total</span>
          <span className="kpi-value">{totalActive}</span>
          <span className="kpi-sub">All open orders</span>
        </div>
        <div className="kpi-tile">
          <span className="kpi-label">Packed</span>
          <span className="kpi-value">{packedCount}</span>
          <span className="kpi-sub">Awaiting dispatch</span>
        </div>
        <div className="kpi-tile">
          <span className="kpi-label">Ready to Ship</span>
          <span className="kpi-value">{dispatchCount}</span>
          <span className="kpi-sub">Dispatch stage</span>
        </div>
      </div>

      <div className="section-title">
        Pending by Order Type
        <span className="section-title-count">{Object.keys(pendingOrders).length}</span>
      </div>
      {Object.keys(pendingOrders).length === 0 ? (
        <div className="empty-state">No pending orders. </div>
      ) : (
        <div className="kpi-grid">
          {Object.entries(pendingOrders)
            .sort((a, b) => b[1] - a[1])
            .map(([type, count]) => (
              <Link
                key={type}
                to={`/list/orderType=${encodeURIComponent(type)}`}
                className="kpi-tile"
              >
                <span className="kpi-label">{type}</span>
                <span className="kpi-value">{count}</span>
                <span className="kpi-sub">View orders →</span>
              </Link>
            ))}
        </div>
      )}

      <div className="section-title">
        Orders by Status
        <span className="section-title-count">{Object.keys(statusOrders).length}</span>
      </div>
      {Object.keys(statusOrders).length === 0 ? (
        <div className="empty-state">No active orders.</div>
      ) : (
        <div className="kpi-grid">
          {Object.entries(statusOrders)
            .sort((a, b) => b[1] - a[1])
            .map(([status, count]) => (
              <Link
                key={status}
                to={`/list/orderStatus=${encodeURIComponent(status)}`}
                className="kpi-tile"
              >
                <span className="kpi-label">
                  <span className={`status-pill ${getStatusClass(status)}`}>{status}</span>
                </span>
                <span className="kpi-value">{count}</span>
                <span className="kpi-sub">View orders →</span>
              </Link>
            ))}
        </div>
      )}

      <div className="section-title">Daily Work</div>
      <div className="daily-work-bar">
        <div>
          <input
            type="date"
            className="form-control"
            defaultValue={toIsoDateInputValue(dmyToDate(date))}
            onChange={handleDateChange}
          />
          <span style={{ marginLeft: 12, fontSize: 13, color: "var(--text-muted)" }}>
            {isToday ? "Today" : date}
          </span>
        </div>
        <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
          Total: <strong>{totalDailySqFt.toFixed(2)} SqFt</strong>
        </div>
      </div>

      {loadingHistory ? (
        <div className="empty-state">
          <span className="spinner-inline">Loading daily work…</span>
        </div>
      ) : dailyEntries.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-title">No work logged on {date}</div>
          <div>Pick a different date to see throughput.</div>
        </div>
      ) : (
        <div className="kpi-grid">
          {dailyEntries
            .sort((a, b) => b[1] - a[1])
            .map(([status, sqft]) => {
              const open = showMore === status;
              const orders = orderDetailsForDate[status] || [];
              return (
                <div key={status} className="kpi-tile" style={{ cursor: "default" }}>
                  <span className="kpi-label">
                    <span className={`status-pill ${getStatusClass(status)}`}>{status}</span>
                  </span>
                  <span className="kpi-value">{Number(sqft).toFixed(2)}</span>
                  <span className="kpi-sub">SqFt · {orders.length} order{orders.length === 1 ? "" : "s"}</span>
                  {orders.length > 0 && (
                    <button
                      type="button"
                      className="btn btn-app btn-outline-secondary"
                      style={{ marginTop: 10, alignSelf: "flex-start", padding: "4px 10px", fontSize: 12 }}
                      onClick={() => setShowMore(open ? "" : status)}
                    >
                      {open ? "Hide" : "Show"} orders
                    </button>
                  )}
                  {open && (
                    <div style={{ marginTop: 10, fontSize: 13, color: "var(--text-secondary)", display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {orders.map((od) => (
                        <Link
                          key={od.id}
                          to={`/detail/${od.id}`}
                          className="status-pill status-bom"
                          style={{ textDecoration: "none" }}
                        >
                          {od.orderId}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}
