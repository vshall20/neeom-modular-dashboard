import React, { useState, useEffect } from "react"
import { Card, Button, Alert } from "react-bootstrap"
import { useAuth } from "../contexts/AuthContext"
import app from '../firebase';

export default function Dashboard() {
    const [orderList, setOrderList] = useState([]);
    const [loading, setLoading] = useState(false);
  const [error, setError] = useState("")
  const { currentUser, logout } = useAuth()
  

  

  //REALTIME GET FUNCTION
  function getOrders() {
    setLoading(true);
          //.where('owner', '==', currentUserId)
      //.where('title', '==', 'School1') // does not need index
      //.where('score', '<=', 10)    // needs index
      //.orderBy('owner', 'asc')
      //.limit(3)
      console.log(app);
    app.firestore().collection('orders').onSnapshot((querySnapshot) => {
        const items = [];
        querySnapshot.forEach((doc) => {
          items.push(doc.data());
        });
        console.log(items)
        setOrderList(items);
        setLoading(false);
      });
  }

  useEffect(() => {
    getOrders();
    // eslint-disable-next-line
  }, []);

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