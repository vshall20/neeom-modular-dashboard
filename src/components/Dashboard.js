import React, { useState, useEffect } from "react"
import { Card, Button, Alert } from "react-bootstrap"
import { useAuth } from "../contexts/AuthContext"
import app from '../firebase';
// import _ from "underscore";
let _ = require('underscore');

export default function Dashboard() {
    const [pendingOrders, setPendingOrders] = useState([]);
    const [initOrderList, setInitOrderList] = useState([]);
    const [loading, setLoading] = useState(false);
  const [error, setError] = useState("")
  const { currentUser, logout } = useAuth()


  function getOrders() {
    setLoading(true);
          //.where('owner', '==', currentUserId)
      //.where('orderStatus', '!=', 'Order Close') // does not need index
      //.where('score', '<=', 10)    // needs index
      //.orderBy('owner', 'asc')
      //.limit(3)
    app.firestore().collection('orders').onSnapshot((querySnapshot) => {
        const items = [];
        querySnapshot.forEach((doc) => {
            let _item = doc.data();
            _item.id = doc.id;
            items.push(_item);
        });
        if(items.length > 0) {
            setInitOrderList(items);
            calculate();
            setLoading(false);
        }
      });
  }

  useEffect(() => {
    getOrders();
    // eslint-disable-next-line
  }, []);


  function calculate() {
      let filteredOrders = initOrderList.filter(order => order.orderStatus !== 'Order Close' && order.orderStatus !== 'Dispatch' && order.orderStatus !== 'Packed')
      let orders = _.countBy(filteredOrders, 'orderType')
      setPendingOrders(orders)
      console.log("Orders:::",Object.entries(orders), initOrderList.length);
  }

  return (
    <div>
        {error && <Alert variant="danger">{error}</Alert>}
      <Card>
        <Card.Body>
          <h2 className="text-center mb-4">Pending Orders</h2>
        </Card.Body>
      </Card>
      <div className="d-flex flex-wrap justify-content-around">
      {Object.entries(pendingOrders).map(order => (
          <Card className="">
              <Card.Header>{order[0]}</Card.Header>
              <Card.Body>{order[1]}</Card.Body>
          </Card>
      ))}
      </div>
    </div>
  )
}