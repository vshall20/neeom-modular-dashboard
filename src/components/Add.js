import React, { useState, useEffect } from "react";
import { Form, Button } from "react-bootstrap";
import { useHistory } from "react-router-dom";
import app from "../firebase";
import { useAuth } from "../contexts/AuthContext";
import { getOrderTypes, getAreas as getAreasCached } from "./utils/configCache";

export default function Add() {
  const { currentUser, isAdmin } = useAuth();
  const history = useHistory();

  const [allType, setAllType] = useState([]);
  const [allAreas, setAllAreas] = useState([]);
  const [data, setData] = useState({});
  const [feedback, setFeedback] = useState(null); // {type:'success'|'error', message}
  const [submitting, setSubmitting] = useState(false);
  const [selectedType, setSelectedType] = useState("");
  const [selectedArea, setSelectedArea] = useState("");
  const orderStatus = "BOM";

  function getDateFromString(_date) {
    const date = new Date(_date);
    if (Number.isNaN(date.getTime())) return "";
    const dd = String(date.getDate()).padStart(2, "0");
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    return `${dd}-${mm}-${date.getFullYear()}`;
  }

  function resetForm() {
    setData({});
    const f = document.getElementById("addOrderForm");
    if (f) f.reset();
  }

  function flashFeedback(type, message, ms = 2500) {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), ms);
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!isAdmin) {
      flashFeedback("error", "You do not have access.");
      return;
    }
    if (!data.formOrderId || !data.formOrderDate) {
      flashFeedback("error", "Order ID and Date are required.");
      return;
    }
    setSubmitting(true);
    const orderHistory = [
      { updatedBy: currentUser.email, updatedTo: orderStatus, updateDate: data.formOrderDate },
    ];
    try {
      const dupSnap = await app
        .firestore()
        .collection("orders")
        .where("orderId", "==", data.formOrderId)
        .get();
      if (!dupSnap.empty) {
        flashFeedback("error", "Order with same Order ID already exists.");
        setSubmitting(false);
        return;
      }
      await app.firestore().collection("orders").add({
        orderId: data.formOrderId,
        partyId: data.formPartyId,
        orderType: selectedType,
        orderQuantity: data.formOrderQuantity,
        orderDate: data.formOrderDate,
        orderStatus,
        nextOrderStatus: 0,
        orderArea: selectedArea,
        orderSqFt: data.formOrderSqFt,
        createdBy: currentUser.email,
        orderHistory,
      });
      app
        .firestore()
        .collection("orderHistory")
        .add({
          orderId: data.formOrderId,
          orderSqFt: data.formOrderSqFt,
          ...orderHistory[0],
        })
        .catch((err) => console.error(err));
      flashFeedback("success", "Order saved.");
      resetForm();
    } catch (err) {
      console.error(err);
      flashFeedback("error", `Save failed: ${err.message || err.toString()}`);
    }
    setSubmitting(false);
  }

  function handleOnChange(e) {
    const { id, value } = e.target;
    if (id === "formOrderDate") {
      setData({ ...data, [id]: getDateFromString(value) });
    } else {
      setData({ ...data, [id]: value });
    }
  }

  useEffect(() => {
    (async () => {
      const types = await getOrderTypes();
      setAllType([...types]);
      setSelectedType(types[0]);
      const areas = await getAreasCached();
      setAllAreas(areas);
      setSelectedArea(areas[0]);
    })();
  }, []);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">New Order</h1>
          <div className="page-subtitle">
            Create an order. It enters at the BOM stage.
          </div>
        </div>
      </div>

      <Form id="addOrderForm" className="form-card">
        <Form.Group controlId="formOrderId">
          <Form.Label>Order ID</Form.Label>
          <Form.Control
            placeholder="e.g. AF-0852"
            defaultValue=""
            onChange={handleOnChange}
            required
          />
        </Form.Group>

        <Form.Group controlId="formPartyId">
          <Form.Label>Party ID</Form.Label>
          <Form.Control
            placeholder="Customer / party reference"
            defaultValue=""
            onChange={handleOnChange}
          />
        </Form.Group>

        <Form.Group controlId="formOrderArea">
          <Form.Label>Area</Form.Label>
          <Form.Control
            as="select"
            onChange={(e) => setSelectedArea(e.target.value)}
            defaultValue={selectedArea}
          >
            {allAreas.map((a) => (
              <option key={a}>{a}</option>
            ))}
          </Form.Control>
        </Form.Group>

        <Form.Group controlId="formOrderType">
          <Form.Label>Order Type</Form.Label>
          <Form.Control
            as="select"
            onChange={(e) => setSelectedType(e.target.value)}
            defaultValue={selectedType}
          >
            {allType.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </Form.Control>
        </Form.Group>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Form.Group controlId="formOrderQuantity">
            <Form.Label>Quantity</Form.Label>
            <Form.Control
              type="number"
              placeholder="0"
              defaultValue=""
              onChange={handleOnChange}
            />
          </Form.Group>

          <Form.Group controlId="formOrderSqFt">
            <Form.Label>SqFt</Form.Label>
            <Form.Control
              type="number"
              step="0.01"
              placeholder="0.00"
              defaultValue=""
              onChange={handleOnChange}
            />
          </Form.Group>
        </div>

        <Form.Group controlId="formOrderDate">
          <Form.Label>Order Date</Form.Label>
          <Form.Control type="date" onChange={handleOnChange} required />
        </Form.Group>

        <div className="form-actions">
          <Button
            variant="outline-secondary"
            className="btn-app btn-outline-secondary"
            type="button"
            onClick={() => history.push("/")}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            className="btn-app btn-primary"
            onClick={handleSave}
            disabled={submitting}
          >
            {submitting ? "Saving…" : "Save Order"}
          </Button>
        </div>

        {feedback && (
          <div className={`form-feedback ${feedback.type}`}>{feedback.message}</div>
        )}
      </Form>
    </div>
  );
}
