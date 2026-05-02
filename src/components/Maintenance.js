import React, { useState } from "react";
import app from "../firebase";
import { padDateString } from "./utils";
import {
  ACTIVE_COLLECTION,
  CLOSED_COLLECTION,
  shouldArchive,
} from "./utils/archive";

const BATCH_SIZE = 400;

function StatusBlock({ task }) {
  if (!task) return null;
  if (task.phase === "running") {
    return (
      <div className="form-feedback" style={{ background: "#eef2ff", color: "#3730a3" }}>
        Scanned {task.scanned}/{task.total} · Wrote {task.written}
      </div>
    );
  }
  if (task.phase === "done") {
    return (
      <div className="form-feedback success">
        Done. Scanned {task.scanned}, wrote {task.written}.
      </div>
    );
  }
  if (task.phase === "error") {
    return <div className="form-feedback error">Failed: {task.error}</div>;
  }
  return null;
}

async function commitInBatches(db, ops, onProgress) {
  // ops: Array<{ ref, patch, kind: 'update' | 'set' | 'delete', data? }>
  let written = 0;
  for (let i = 0; i < ops.length; i += BATCH_SIZE) {
    const slice = ops.slice(i, i + BATCH_SIZE);
    const batch = db.batch();
    for (const op of slice) {
      if (op.kind === "update") batch.update(op.ref, op.patch);
      else if (op.kind === "set") batch.set(op.ref, op.data);
      else if (op.kind === "delete") batch.delete(op.ref);
    }
    await batch.commit();
    written += slice.length;
    onProgress?.(written);
  }
  return written;
}

function diffOrderDoc(doc) {
  const data = doc.data();
  const newOrderDate = padDateString(data.orderDate);
  const oldHistory = data.orderHistory || [];
  const newHistory = oldHistory.map((h) => ({
    ...h,
    updateDate: padDateString(h.updateDate),
  }));
  const orderDateChanged = newOrderDate !== data.orderDate;
  const historyChanged = oldHistory.some(
    (h, i) => h.updateDate !== newHistory[i].updateDate
  );
  if (!orderDateChanged && !historyChanged) return null;
  const patch = {};
  if (orderDateChanged) patch.orderDate = newOrderDate;
  if (historyChanged) patch.orderHistory = newHistory;
  return patch;
}

export default function Maintenance() {
  const [ordersTask, setOrdersTask] = useState(null);
  const [closedNormTask, setClosedNormTask] = useState(null);
  const [historyTask, setHistoryTask] = useState(null);
  const [archiveTask, setArchiveTask] = useState(null);

  async function normalizeCollection(collection, setTask) {
    setTask({ phase: "running", scanned: 0, total: 0, written: 0 });
    try {
      const db = app.firestore();
      const snap = await db.collection(collection).get();
      const total = snap.size;
      setTask({ phase: "running", scanned: total, total, written: 0 });

      const ops = [];
      snap.docs.forEach((doc) => {
        const patch = diffOrderDoc(doc);
        if (patch) ops.push({ ref: doc.ref, kind: "update", patch });
      });

      let written = 0;
      await commitInBatches(db, ops, (w) => {
        written = w;
        setTask({ phase: "running", scanned: total, total, written });
      });

      setTask({ phase: "done", scanned: total, total, written });
    } catch (err) {
      console.error(err);
      setTask({ phase: "error", error: err.message || String(err) });
    }
  }

  async function runNormalizeOrders() {
    const ok = window.confirm(
      "Pad orderDate + orderHistory entries inside the `orders` collection. Proceed?"
    );
    if (!ok) return;
    await normalizeCollection(ACTIVE_COLLECTION, setOrdersTask);
  }

  async function runNormalizeClosed() {
    const ok = window.confirm(
      "Pad orderDate + orderHistory entries inside the `ordersClosed` collection. Proceed?"
    );
    if (!ok) return;
    await normalizeCollection(CLOSED_COLLECTION, setClosedNormTask);
  }

  async function runNormalizeHistoryCollection() {
    const ok = window.confirm(
      "WARNING: This reads + writes the entire `orderHistory` collection (~140k docs). " +
        "Heavy on Firestore quota. Optional — going forward all new writes are already padded. " +
        "Skip unless you specifically need date-scrub queries to find old unpadded entries. Proceed?"
    );
    if (!ok) return;
    setHistoryTask({ phase: "running", scanned: 0, total: 0, written: 0 });
    try {
      const db = app.firestore();
      const snap = await db.collection("orderHistory").get();
      const total = snap.size;
      setHistoryTask({ phase: "running", scanned: total, total, written: 0 });
      const ops = [];
      snap.docs.forEach((doc) => {
        const data = doc.data();
        const newDate = padDateString(data.updateDate);
        if (newDate !== data.updateDate) {
          ops.push({ ref: doc.ref, kind: "update", patch: { updateDate: newDate } });
        }
      });
      let written = 0;
      await commitInBatches(db, ops, (w) => {
        written = w;
        setHistoryTask({ phase: "running", scanned: total, total, written });
      });
      setHistoryTask({ phase: "done", scanned: total, total, written });
    } catch (err) {
      console.error(err);
      setHistoryTask({ phase: "error", error: err.message || String(err) });
    }
  }

  async function runArchiveExistingClosed() {
    const ok = window.confirm(
      "Move every closed order from `orders` → `ordersClosed`. One-time migration. Proceed?"
    );
    if (!ok) return;
    setArchiveTask({ phase: "running", scanned: 0, total: 0, written: 0 });
    try {
      const db = app.firestore();
      const snap = await db.collection(ACTIVE_COLLECTION).get();
      const closedDocs = snap.docs.filter((d) => shouldArchive(d.data().orderStatus));
      const total = closedDocs.length;
      setArchiveTask({ phase: "running", scanned: snap.size, total, written: 0 });

      // Each archived doc = 1 set + 1 delete = 2 ops. Pack 200 docs per batch.
      const PACK = Math.floor(BATCH_SIZE / 2);
      let written = 0;
      for (let i = 0; i < closedDocs.length; i += PACK) {
        const slice = closedDocs.slice(i, i + PACK);
        const batch = db.batch();
        for (const doc of slice) {
          batch.set(db.collection(CLOSED_COLLECTION).doc(doc.id), doc.data());
          batch.delete(doc.ref);
        }
        await batch.commit();
        written += slice.length;
        setArchiveTask({ phase: "running", scanned: snap.size, total, written });
      }
      setArchiveTask({ phase: "done", scanned: snap.size, total, written });
    } catch (err) {
      console.error(err);
      setArchiveTask({ phase: "error", error: err.message || String(err) });
    }
  }

  const card = (title, body, action) => (
    <div className="form-card" style={{ marginTop: 16 }}>
      <div className="detail-section-heading"><span>{title}</span></div>
      {body}
      {action}
    </div>
  );

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Maintenance</h1>
          <div className="page-subtitle">
            One-time admin actions. Run only when explicitly needed.
          </div>
        </div>
      </div>

      {card(
        "Normalize Orders Dates",
        <p className="muted" style={{ fontSize: 13, marginBottom: 12 }}>
          Pads <code>orderDate</code> and <code>orderHistory[].updateDate</code> in the{" "}
          <code>orders</code> collection. Cheap (few hundred docs).
        </p>,
        <>
          <button
            type="button"
            className="btn btn-app btn-primary"
            disabled={ordersTask && ordersTask.phase === "running"}
            onClick={runNormalizeOrders}
          >
            {ordersTask && ordersTask.phase === "running"
              ? `Running… ${ordersTask.written} writes`
              : "Run on `orders`"}
          </button>
          <div style={{ marginTop: 12 }}><StatusBlock task={ordersTask} /></div>
        </>
      )}

      {card(
        "Normalize Closed Orders Dates",
        <p className="muted" style={{ fontSize: 13, marginBottom: 12 }}>
          Same pad logic against <code>ordersClosed</code>. Run after you've migrated closed orders.
        </p>,
        <>
          <button
            type="button"
            className="btn btn-app btn-primary"
            disabled={closedNormTask && closedNormTask.phase === "running"}
            onClick={runNormalizeClosed}
          >
            {closedNormTask && closedNormTask.phase === "running"
              ? `Running… ${closedNormTask.written} writes`
              : "Run on `ordersClosed`"}
          </button>
          <div style={{ marginTop: 12 }}><StatusBlock task={closedNormTask} /></div>
        </>
      )}

      {card(
        "Archive Existing Closed Orders",
        <p className="muted" style={{ fontSize: 13, marginBottom: 12 }}>
          Moves every order whose status contains "close" from <code>orders</code> →{" "}
          <code>ordersClosed</code>. Batched (200 orders per commit).
        </p>,
        <>
          <button
            type="button"
            className="btn btn-app btn-primary"
            disabled={archiveTask && archiveTask.phase === "running"}
            onClick={runArchiveExistingClosed}
          >
            {archiveTask && archiveTask.phase === "running"
              ? `Running… ${archiveTask.written}/${archiveTask.total}`
              : "Run Archive Migration"}
          </button>
          <div style={{ marginTop: 12 }}><StatusBlock task={archiveTask} /></div>
        </>
      )}

      {card(
        "Normalize orderHistory Collection (Optional)",
        <p className="muted" style={{ fontSize: 13, marginBottom: 12 }}>
          <strong style={{ color: "var(--danger)" }}>Heavy.</strong> Touches the entire flat{" "}
          <code>orderHistory</code> log (~140k docs). Burns ~140k reads + writes. Skip unless date
          scrub on past dates must find old unpadded entries. Going forward, new transitions
          already write padded form.
        </p>,
        <>
          <button
            type="button"
            className="btn btn-app btn-outline-secondary"
            disabled={historyTask && historyTask.phase === "running"}
            onClick={runNormalizeHistoryCollection}
          >
            {historyTask && historyTask.phase === "running"
              ? `Running… ${historyTask.written} writes`
              : "Run on `orderHistory` (optional)"}
          </button>
          <div style={{ marginTop: 12 }}><StatusBlock task={historyTask} /></div>
        </>
      )}
    </div>
  );
}
