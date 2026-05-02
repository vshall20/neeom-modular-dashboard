import React, { useState, useEffect } from "react";
import { Button } from "react-bootstrap";
import { useHistory } from "react-router-dom";
import app from "../firebase";
import { useAuth } from "../contexts/AuthContext";
import { getStatusType } from "./utils/configCache";
import { getStatusClass } from "./utils";

function getToday() {
  const date = new Date();
  return `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}`;
}

export default function Detail(props) {
  const [order, setOrder] = useState({});
  const [allStatus, setAllStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const history = useHistory();
  const { currentUser, isAdmin } = useAuth();

  async function loadAllStatus() {
    const status = await getStatusType();
    setAllStatus(status);
  }

  function loadOrder() {
    setLoading(true);
    app
      .firestore()
      .collection("orders")
      .doc(props.match.params.orderId)
      .get()
      .then((item) => {
        if (!item.exists) {
          history.push("/");
          return;
        }
        setOrder(item.data());
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }

  useEffect(() => {
    loadOrder();
    loadAllStatus();
    // eslint-disable-next-line
  }, []);

  function deleteOrder(cb) {
    app
      .firestore()
      .collection("orders")
      .doc(props.match.params.orderId)
      .delete()
      .then(() => cb())
      .catch((err) => console.error(err));
  }

  function persistAdvance(updatedOrder) {
    setSaving(true);
    const oh = updatedOrder.orderHistory[updatedOrder.orderHistory.length - 1];
    app
      .firestore()
      .collection("orderHistory")
      .add({
        orderId: updatedOrder.orderId,
        orderSqFt: updatedOrder.orderSqFt,
        ...oh,
      })
      .catch((e) => console.error(e));
    app
      .firestore()
      .collection("orders")
      .doc(props.match.params.orderId)
      .update(updatedOrder)
      .then(() => {
        loadOrder();
        setSaving(false);
      })
      .catch((err) => {
        console.error(err);
        setSaving(false);
      });
  }

  function handleAdvance() {
    if (saving) return;
    if (!allStatus || !allStatus[order.orderType]) return;
    if (order.nextOrderStatus >= allStatus[order.orderType].length) return;
    const selectedStatus = allStatus[order.orderType][order.nextOrderStatus];
    const orderHistory = order.orderHistory || [];
    persistAdvance({
      ...order,
      orderStatus: selectedStatus,
      nextOrderStatus: order.nextOrderStatus + 1,
      orderHistory: [
        ...orderHistory,
        {
          updatedBy: currentUser.email,
          updatedTo: selectedStatus,
          updateDate: getToday(),
        },
      ],
    });
  }

  function handleDelete() {
    if (window.confirm("Permanently delete this order?")) {
      deleteOrder(() => history.push("/"));
    }
  }

  if (loading) {
    return (
      <div className="page">
        <div className="empty-state">
          <span className="spinner-inline">Loading order…</span>
        </div>
      </div>
    );
  }

  const stages = allStatus && order.orderType ? allStatus[order.orderType] || [] : [];
  const allStages = ["BOM", ...stages];
  // BOM history is at orderHistory[0]; subsequent stage transitions at orderHistory[i+1]
  const nextStageIndex = order.nextOrderStatus !== undefined ? order.nextOrderStatus + 1 : 1;
  const isComplete = nextStageIndex >= allStages.length;
  const nextStageName = !isComplete ? allStages[nextStageIndex] : null;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">{order.orderId || "Order"}</h1>
          <div className="page-subtitle">
            {order.orderType} · Party {order.partyId}
            {" · "}
            <span className={`status-pill ${getStatusClass(order.orderStatus)}`} style={{ marginLeft: 6 }}>
              {order.orderStatus}
            </span>
          </div>
        </div>
        <Button
          variant="outline-secondary"
          className="btn-app btn-outline-secondary"
          onClick={() => history.push("/")}
        >
          Back
        </Button>
      </div>

      <div className="detail-card">
        <div className="detail-grid">
          <div className="detail-field">
            <div className="detail-field-label">Order ID</div>
            <div className="detail-field-value">{order.orderId}</div>
          </div>
          <div className="detail-field">
            <div className="detail-field-label">Party</div>
            <div className="detail-field-value">{order.partyId || "—"}</div>
          </div>
          <div className="detail-field">
            <div className="detail-field-label">Order Type</div>
            <div className="detail-field-value">{order.orderType}</div>
          </div>
          <div className="detail-field">
            <div className="detail-field-label">Quantity</div>
            <div className="detail-field-value">{order.orderQuantity || "—"}</div>
          </div>
          <div className="detail-field">
            <div className="detail-field-label">SqFt</div>
            <div className="detail-field-value">{order.orderSqFt || "—"}</div>
          </div>
          <div className="detail-field">
            <div className="detail-field-label">Area</div>
            <div className="detail-field-value">{order.orderArea || "—"}</div>
          </div>
          <div className="detail-field">
            <div className="detail-field-label">Order Date</div>
            <div className="detail-field-value">{order.orderDate}</div>
          </div>
          <div className="detail-field">
            <div className="detail-field-label">Created By</div>
            <div className="detail-field-value" style={{ fontSize: 13 }}>{order.createdBy}</div>
          </div>
        </div>

        <div className="detail-section-heading">
          <span>Production Stages</span>
          {!isComplete && nextStageName && (
            <Button
              variant="primary"
              className="btn-app btn-primary"
              onClick={handleAdvance}
              disabled={saving}
              style={{ padding: "6px 14px", fontSize: 13 }}
            >
              {saving ? "Saving…" : `Mark "${nextStageName}" complete`}
            </Button>
          )}
          {isComplete && (
            <span className="status-pill status-close">All stages complete</span>
          )}
        </div>

        <div className="timeline">
          {allStages.map((stage, i) => {
            const isDone = i < nextStageIndex;
            const isCurrent = !isDone && !isComplete && i === nextStageIndex;
            const historyEntry = order.orderHistory && order.orderHistory[i];
            const status = isDone ? "done" : isCurrent ? "current" : "upcoming";
            return (
              <div key={`${stage}-${i}`} className={`timeline-row ${status}`}>
                <div className={`timeline-marker ${status}`}>
                  {isDone ? "✓" : i + 1}
                </div>
                <div className="timeline-content">
                  <div className="timeline-label">{stage}</div>
                  {historyEntry && (
                    <div className="timeline-meta">
                      <span>{historyEntry.updateDate}</span>
                      <span className="muted">by {historyEntry.updatedBy}</span>
                    </div>
                  )}
                  {!historyEntry && isCurrent && (
                    <div className="timeline-meta">Next stage</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="form-actions split" style={{ marginTop: 24 }}>
          {isAdmin ? (
            <Button
              variant="danger"
              className="btn-app btn-danger"
              onClick={handleDelete}
            >
              Delete Order
            </Button>
          ) : <span />}
          <div style={{ display: "flex", gap: 8 }}>
            <Button
              variant="outline-secondary"
              className="btn-app btn-outline-secondary"
              onClick={() => history.push("/")}
            >
              Close
            </Button>
            {!isComplete && nextStageName && (
              <Button
                variant="primary"
                className="btn-app btn-primary"
                onClick={handleAdvance}
                disabled={saving}
              >
                {saving ? "Saving…" : "Save & Advance"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
