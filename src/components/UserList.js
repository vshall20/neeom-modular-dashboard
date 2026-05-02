import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import app from "../firebase";
import { getOrderAge, getStatusClass } from "./utils";

export default function UserList(props) {
  const [orderList, setOrderList] = useState([]);
  const [initOrderList, setInitOrderList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  function handleSearch(e) {
    const value = e.target.value;
    setSearch(value);
    if (!value || value.length < 4) {
      setOrderList([]);
      return;
    }
    const newArray = initOrderList.filter((o) =>
      String(o.orderId || "").toLowerCase().includes(value.toLowerCase())
    );
    setOrderList([...newArray]);
  }

  function getOrders() {
    setLoading(true);
    return app
      .firestore()
      .collection("orders")
      .where("orderStatus", "!=", "Order Close")
      .orderBy("orderStatus")
      .orderBy("orderId", "desc")
      .onSnapshot((querySnapshot) => {
        const items = [];
        querySnapshot.forEach((doc) => {
          let _item = doc.data();
          _item.id = doc.id;
          items.push(_item);
        });
        setInitOrderList(items);
        setLoading(false);
      });
  }

  function getOrdersByOrderType(filter) {
    let _filter = filter.split("=");
    let q = app
      .firestore()
      .collection("orders")
      .where(_filter[0], "==", decodeURIComponent(_filter[1]));
    if (_filter[0] !== "orderStatus") {
      q = q.where("orderStatus", "!=", "Order Close").orderBy("orderStatus");
    }
    return q
      .orderBy("orderId", "desc")
      .onSnapshot((querySnapshot) => {
        const items = [];
        querySnapshot.forEach((doc) => {
          let _item = doc.data();
          _item.id = doc.id;
          items.push(_item);
        });
        setInitOrderList(items);
        setLoading(false);
      });
  }

  useEffect(() => {
    const unsubscribe =
      Object.keys(props.match.params).length > 0
        ? getOrdersByOrderType(props.match.params.filter)
        : getOrders();
    return () => unsubscribe && unsubscribe();
    // eslint-disable-next-line
  }, []);

  const visible = orderList.filter((o) => o.orderStatus !== "Order Close");
  const showHint = !search || search.length < 4;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Order Lookup</h1>
          <div className="page-subtitle">
            Type at least 4 characters of an order ID to search.
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
            placeholder="Search order ID…"
            value={search}
            onChange={handleSearch}
          />
        </label>
      </div>

      {loading && (
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
          <div>No active order matches "{search}".</div>
        </div>
      )}

      {!loading && !!visible.length && (
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
