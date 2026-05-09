import React, { useState, useEffect } from "react";
import { Button } from "react-bootstrap";
import { useHistory } from "react-router-dom";
import app from "../firebase";
import { useAuth } from "../contexts/AuthContext";
import { useOrders } from "../contexts/OrdersContext";
import { getStatusType } from "./utils/configCache";
import { getStatusClass } from "./utils";
import {
  ACTIVE_COLLECTION,
  CLOSED_COLLECTION,
  archiveOrder,
  loadOrderFromEither,
  deleteFromCollection,
  shouldArchive,
} from "./utils/archive";

function getToday() {
  const date = new Date();
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  return `${dd}-${mm}-${date.getFullYear()}`;
}

export default function Detail(props) {
  const orderDocId = props.match.params.orderId;
  const { orders: contextOrders } = useOrders();
  const cached = contextOrders.find((o) => o.id === orderDocId);
  const [order, setOrder] = useState(cached || {});
  const [source, setSource] = useState(cached ? ACTIVE_COLLECTION : null);
  const [allStatus, setAllStatus] = useState(null);
  const [loading, setLoading] = useState(!cached);
  const [saving, setSaving] = useState(false);
  const [referenceInput, setReferenceInput] = useState("");
  const [referenceSaving, setReferenceSaving] = useState(false);
  const history = useHistory();
  const { currentUser, isAdmin } = useAuth();
  const isClosed = source === CLOSED_COLLECTION;

  async function loadAllStatus() {
    const status = await getStatusType();
    setAllStatus(status);
  }

  async function loadOrder() {
    if (!cached) setLoading(true);
    try {
      const result = await loadOrderFromEither(orderDocId);
      if (!result) {
        history.push("/");
        return;
      }
      setOrder(result.data);
      setSource(result.source);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  }

  useEffect(() => {
    if (cached) {
      setOrder(cached);
      setSource(ACTIVE_COLLECTION);
      setLoading(false);
    } else {
      loadOrder();
    }
    loadAllStatus();
    // eslint-disable-next-line
  }, [orderDocId]);

  useEffect(() => {
    setReferenceInput(order.reference || "");
  }, [order.reference]);

  async function saveReference() {
    if (referenceSaving || !source) return;
    const trimmed = referenceInput.trim();
    if (trimmed === (order.reference || "")) return;
    setReferenceSaving(true);
    try {
      await app
        .firestore()
        .collection(source)
        .doc(orderDocId)
        .update({ reference: trimmed });
      setOrder({ ...order, reference: trimmed });
    } catch (err) {
      console.error("Save reference failed:", err);
    }
    setReferenceSaving(false);
  }

  async function deleteOrder(cb) {
    try {
      await deleteFromCollection(source || ACTIVE_COLLECTION, orderDocId);
      cb();
    } catch (err) {
      console.error(err);
    }
  }

  async function persistAdvance(updatedOrder) {
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

    try {
      if (shouldArchive(updatedOrder.orderStatus)) {
        await archiveOrder(orderDocId, updatedOrder);
        setOrder(updatedOrder);
        setSource(CLOSED_COLLECTION);
      } else {
        await app
          .firestore()
          .collection(ACTIVE_COLLECTION)
          .doc(orderDocId)
          .update(updatedOrder);
        setOrder(updatedOrder);
      }
    } catch (err) {
      console.error(err);
    }
    setSaving(false);
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
            {isClosed && (
              <span className="muted" style={{ marginLeft: 8, fontSize: 12 }}>
                (archived)
              </span>
            )}
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
            <div className="detail-field-label">Reference</div>
            <div className="detail-field-value">
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <input
                  type="text"
                  value={referenceInput}
                  onChange={(e) => setReferenceInput(e.target.value)}
                  placeholder="e.g. Vishal, Acme office"
                  disabled={referenceSaving}
                  style={{
                    flex: 1,
                    minWidth: 0,
                    padding: "4px 8px",
                    fontSize: 14,
                    border: "1px solid var(--border)",
                    borderRadius: 4,
                  }}
                />
                <Button
                  variant="primary"
                  className="btn-app btn-primary"
                  style={{ padding: "4px 10px", fontSize: 13 }}
                  onClick={saveReference}
                  disabled={
                    referenceSaving ||
                    referenceInput.trim() === (order.reference || "")
                  }
                >
                  {referenceSaving ? "Saving…" : "Save"}
                </Button>
              </div>
            </div>
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
