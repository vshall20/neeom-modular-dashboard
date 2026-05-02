import React, { useRef, useState } from "react";
import { Form, Button, Alert } from "react-bootstrap";
import { useAuth } from "../contexts/AuthContext";
import { useHistory } from "react-router-dom";

export default function Login() {
  const emailRef = useRef();
  const passwordRef = useRef();
  const { login } = useAuth();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const history = useHistory();

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      setError("");
      setLoading(true);
      await login(emailRef.current.value, passwordRef.current.value);
      history.push("/");
    } catch {
      setError("Failed to log in. Check your email and password.");
    }
    setLoading(false);
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-brand">
          <img src="/logo192.png" alt="Neeom Modular" />
          <h1>Neeom Modular</h1>
          <p>Order Tracker</p>
        </div>

        {error && (
          <Alert variant="danger" style={{ fontSize: 13 }}>
            {error}
          </Alert>
        )}

        <Form onSubmit={handleSubmit}>
          <Form.Group id="email">
            <Form.Label>Email</Form.Label>
            <Form.Control
              type="email"
              ref={emailRef}
              placeholder="you@neeommodular.com"
              required
              autoFocus
            />
          </Form.Group>
          <Form.Group id="password">
            <Form.Label>Password</Form.Label>
            <Form.Control type="password" ref={passwordRef} required />
          </Form.Group>
          <Button
            disabled={loading}
            className="w-100 btn-app btn-primary"
            type="submit"
          >
            {loading ? "Signing in…" : "Sign in"}
          </Button>
        </Form>

        <div className="auth-footer">
          Need an account? Contact your administrator.
        </div>
      </div>
    </div>
  );
}
