import React, { useState, useEffect } from "react"
import { Card, Button, Alert } from "react-bootstrap"
import { useAuth } from "../contexts/AuthContext"
import app from '../firebase';

export default function Dashboard() {
    const [orderList, setOrderList] = useState([]);
    const [loading, setLoading] = useState(false);
  const [error, setError] = useState("")
  const { currentUser, logout } = useAuth()

  return (
    <div>
      <Card>
        <Card.Body>
          <h2 className="text-center mb-4">Profile</h2>
          {error && <Alert variant="danger">{error}</Alert>}
          <strong>Email:</strong> {currentUser.email}
        </Card.Body>
      </Card>
    </div>
  )
}