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
  const [editingReference, setEditingReference] = useState(false);
  const [boxCountMode, setBoxCountMode] = useState(false);
  const [boxCountInput, setBoxCountInput] = useState("");
  const [boxCountError, setBoxCountError] = useState("");
  const [editingBoxAdmin, setEditingBoxAdmin] = useState(false);
  const [boxAdminInputs, setBoxAdminInputs] = useState({ packed: "", dispatch: "" });
  const [boxAdminSaving, setBoxAdminSaving] = useState(false);
  const [boxAdminError, setBoxAdminError] = useState("");
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
      setEditingReference(false);
    } catch (err) {
      console.error("Save reference failed:", err);
    }
    setReferenceSaving(false);
  }

  function startEditReference() {
    setReferenceInput(order.reference || "");
    setEditingReference(true);
  }

  function cancelEditReference() {
    setReferenceInput(order.reference || "");
    setEditingReference(false);
  }

  useEffect(() => {
    setBoxAdminInputs({
      packed: order.packedBoxCount != null ? String(order.packedBoxCount) : "",
      dispatch: order.dispatchBoxCount != null ? String(order.dispatchBoxCount) : "",
    });
  }, [order.packedBoxCount, order.dispatchBoxCount]);

  function startEditBoxAdmin() {
    setBoxAdminInputs({
      packed: order.packedBoxCount != null ? String(order.packedBoxCount) : "",
      dispatch: order.dispatchBoxCount != null ? String(order.dispatchBoxCount) : "",
    });
    setBoxAdminError("");
    setEditingBoxAdmin(true);
  }

  function cancelEditBoxAdmin() {
    setBoxAdminInputs({
      packed: order.packedBoxCount != null ? String(order.packedBoxCount) : "",
      dispatch: order.dispatchBoxCount != null ? String(order.dispatchBoxCount) : "",
    });
    setBoxAdminError("");
    setEditingBoxAdmin(false);
  }

  async function saveBoxAdmin() {
    if (!isAdmin) return;
    if (boxAdminSaving || !source) return;
    setBoxAdminError("");
    const update = {};
    const packedRaw = boxAdminInputs.packed.trim();
    const dispatchRaw = boxAdminInputs.dispatch.trim();
    if (packedRaw !== "") {
      const n = parseInt(packedRaw, 10);
      if (!Number.isFinite(n) || n <= 0) {
        setBoxAdminError("Box counts must be positive integers.");
        return;
      }
      if (n !== order.packedBoxCount) update.packedBoxCount = n;
    }
    if (dispatchRaw !== "") {
      const n = parseInt(dispatchRaw, 10);
      if (!Number.isFinite(n) || n <= 0) {
        setBoxAdminError("Box counts must be positive integers.");
        return;
      }
      if (n !== order.dispatchBoxCount) update.dispatchBoxCount = n;
    }
    if (Object.keys(update).length === 0) {
      setEditingBoxAdmin(false);
      return;
    }
    setBoxAdminSaving(true);
    try {
      await app.firestore().collection(source).doc(orderDocId).update(update);
      setOrder({ ...order, ...update });
      setEditingBoxAdmin(false);
    } catch (err) {
      console.error("Save box counts failed:", err);
    }
    setBoxAdminSaving(false);
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

  function handleAdvance(extras) {
    if (saving) return;
    if (!allStatus || !allStatus[order.orderType]) return;
    if (order.nextOrderStatus >= allStatus[order.orderType].length) return;
    const selectedStatus = allStatus[order.orderType][order.nextOrderStatus];
    const orderHistory = order.orderHistory || [];
    const orderField = (extras && extras.orderField) || {};
    const historyField = (extras && extras.historyField) || {};
    persistAdvance({
      ...order,
      ...orderField,
      orderStatus: selectedStatus,
      nextOrderStatus: order.nextOrderStatus + 1,
      orderHistory: [
        ...orderHistory,
        {
          updatedBy: currentUser.email,
          updatedTo: selectedStatus,
          updateDate: getToday(),
          ...historyField,
        },
      ],
    });
  }

  function onAdvanceClick() {
    if (saving) return;
    if (nextNeedsBoxCount) {
      setBoxCountInput("");
      setBoxCountError("");
      setBoxCountMode(true);
    } else {
      handleAdvance();
    }
  }

  function cancelBoxCount() {
    setBoxCountMode(false);
    setBoxCountInput("");
    setBoxCountError("");
  }

  function confirmBoxCount() {
    setBoxCountError("");
    const count = parseInt(boxCountInput, 10);
    if (!Number.isFinite(count) || count <= 0) {
      setBoxCountError("Enter a positive number of boxes.");
      return;
    }
    if (
      isDispatchTransition &&
      order.packedBoxCount != null &&
      order.packedBoxCount !== count
    ) {
      setBoxCountError("Box count mismatch. Cannot dispatch.");
      return;
    }
    const orderField = isPackTransition
      ? { packedBoxCount: count }
      : { dispatchBoxCount: count };
    handleAdvance({ orderField, historyField: { boxCount: count } });
    setBoxCountMode(false);
    setBoxCountInput("");
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
  const nextLower = (nextStageName || "").toLowerCase();
  const isPackTransition = nextLower.includes("pack");
  const isDispatchTransition = nextLower.includes("dispatch");
  const nextNeedsBoxCount = isPackTransition || isDispatchTransition;
  const dispatchWithoutPackedRecord =
    isDispatchTransition && order.packedBoxCount == null;
  const hasReachedPack = (order.orderHistory || []).some((h) =>
    String(h.updatedTo || "").toLowerCase().includes("pack")
  );
  const showAdminBoxTile = isAdmin && hasReachedPack;

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
          <div className="detail-field detail-field--wide">
            <div className="detail-field-label">Reference</div>
            <div className="detail-field-value">
              {order.reference && !editingReference ? (
                <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                  <span style={{ flex: 1, minWidth: 0 }}>{order.reference}</span>
                  <button
                    type="button"
                    onClick={startEditReference}
                    aria-label="Edit reference"
                    title="Edit reference"
                    style={{
                      background: "transparent",
                      border: "none",
                      padding: 4,
                      cursor: "pointer",
                      color: "var(--text-muted)",
                      lineHeight: 0,
                    }}
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M12 20h9" />
                      <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4Z" />
                    </svg>
                  </button>
                </div>
              ) : (
                <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                  <input
                    type="text"
                    value={referenceInput}
                    onChange={(e) => setReferenceInput(e.target.value)}
                    placeholder="e.g. Vishal, Acme office"
                    disabled={referenceSaving}
                    autoFocus={editingReference}
                    style={{
                      flex: "1 1 180px",
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
                  {editingReference && (
                    <Button
                      variant="outline-secondary"
                      className="btn-app btn-outline-secondary"
                      style={{ padding: "4px 10px", fontSize: 13 }}
                      onClick={cancelEditReference}
                      disabled={referenceSaving}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              )}
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
          {showAdminBoxTile && (
            <div className="detail-field detail-field--wide">
              <div className="detail-field-label">Box Counts (admin)</div>
              <div className="detail-field-value">
                {!editingBoxAdmin ? (
                  <div className="box-stats">
                    <div className="box-stat">
                      <div className="box-stat-label">Packed</div>
                      <div className="box-stat-value">
                        {order.packedBoxCount != null ? order.packedBoxCount : "—"}
                      </div>
                    </div>
                    <div className="box-stat">
                      <div className="box-stat-label">Dispatch</div>
                      <div className="box-stat-value">
                        {order.dispatchBoxCount != null ? order.dispatchBoxCount : "—"}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="icon-btn"
                      onClick={startEditBoxAdmin}
                      aria-label="Edit box counts"
                      title="Edit box counts"
                      style={{ marginLeft: "auto", alignSelf: "center" }}
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M12 20h9" />
                        <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4Z" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="box-stats">
                      <div className="box-stat">
                        <div className="box-stat-label">Packed</div>
                        <input
                          type="number"
                          min="1"
                          step="1"
                          inputMode="numeric"
                          value={boxAdminInputs.packed}
                          onChange={(e) => {
                            setBoxAdminInputs({ ...boxAdminInputs, packed: e.target.value });
                            if (boxAdminError) setBoxAdminError("");
                          }}
                          disabled={boxAdminSaving}
                          aria-label="Packed box count"
                        />
                      </div>
                      <div className="box-stat">
                        <div className="box-stat-label">Dispatch</div>
                        <input
                          type="number"
                          min="1"
                          step="1"
                          inputMode="numeric"
                          value={boxAdminInputs.dispatch}
                          onChange={(e) => {
                            setBoxAdminInputs({ ...boxAdminInputs, dispatch: e.target.value });
                            if (boxAdminError) setBoxAdminError("");
                          }}
                          disabled={boxAdminSaving}
                          aria-label="Dispatch box count"
                        />
                      </div>
                    </div>
                    {boxAdminError && (
                      <div className="box-count-prompt-error" style={{ marginTop: 12 }}>
                        {boxAdminError}
                      </div>
                    )}
                    <div className="box-stats-edit-actions">
                      <Button
                        variant="outline-secondary"
                        className="btn btn-app btn-outline-secondary"
                        onClick={cancelEditBoxAdmin}
                        disabled={boxAdminSaving}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="primary"
                        className="btn btn-app btn-primary"
                        onClick={saveBoxAdmin}
                        disabled={boxAdminSaving}
                      >
                        {boxAdminSaving ? "Saving…" : "Save"}
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="detail-section-heading">
          <span>Production Stages</span>
          {!isComplete && nextStageName && !boxCountMode && (
            <Button
              variant="primary"
              className="btn-app btn-primary"
              onClick={onAdvanceClick}
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

        {boxCountMode && (
          <div className="box-count-prompt">
            <div className="box-count-prompt-label">
              Boxes {isPackTransition ? "packed" : "dispatched"}
            </div>
            <div className="box-count-prompt-row">
              <input
                type="number"
                min="1"
                step="1"
                inputMode="numeric"
                value={boxCountInput}
                onChange={(e) => {
                  setBoxCountInput(e.target.value);
                  if (boxCountError) setBoxCountError("");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    confirmBoxCount();
                  }
                }}
                disabled={saving}
                autoFocus
                aria-label={`Boxes ${isPackTransition ? "packed" : "dispatched"}`}
              />
              <Button
                variant="primary"
                className="btn btn-app btn-primary"
                onClick={confirmBoxCount}
                disabled={saving || !boxCountInput.trim()}
              >
                {saving ? "Saving…" : "Confirm"}
              </Button>
              <Button
                variant="outline-secondary"
                className="btn btn-app btn-outline-secondary"
                onClick={cancelBoxCount}
                disabled={saving}
              >
                Cancel
              </Button>
            </div>
            {dispatchWithoutPackedRecord && !boxCountError && (
              <div className="box-count-prompt-notice">
                No packed count on record — saving dispatch count without tally check.
              </div>
            )}
            {boxCountError && (
              <div className="box-count-prompt-error">{boxCountError}</div>
            )}
          </div>
        )}

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
            {!isComplete && nextStageName && !boxCountMode && (
              <Button
                variant="primary"
                className="btn-app btn-primary"
                onClick={onAdvanceClick}
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
