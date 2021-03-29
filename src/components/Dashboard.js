import React, {
  useState,
  useEffect
} from "react"
import {
  Card,
  Button,
  Alert
} from "react-bootstrap"
import { Link } from "react-router-dom";
import {
  useAuth
} from "../contexts/AuthContext"
import app from '../firebase';
// import _ from "underscore";
let _ = require('underscore');

export default function Dashboard(props) {
  const [pendingOrders, setPendingOrders] = useState([]);
  const [statusOrders, setStatusOrders] = useState([]);
  const [initOrderList, setInitOrderList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("")
  const {
    currentUser,
    isAdmin,
    logout
  } = useAuth()


  function getOrders() {
    setLoading(true);
    //.where('owner', '==', currentUserId)
    //.where('orderStatus', '!=', 'Order Close') // does not need index
    //.where('score', '<=', 10)    // needs index
    //.orderBy('owner', 'asc')
    //.limit(3)
    app.firestore().collection('orders').where('orderStatus', '!=', 'Order Close').onSnapshot((querySnapshot) => handleSnapshotData(querySnapshot));
  }
  
  function handleSnapshotData(querySnapshot) {
    const items = [];
      querySnapshot.forEach((doc) => {
        let _item = doc.data();
        _item.id = doc.id;
        items.push(_item);
      });
      console.log("Dashboard:: Item Length:", items.length);
      if (items.length > 0) {
        setInitOrderList(items);
        console.log("ssetting itm and calling calculate::: ", items.length, initOrderList.length);
        setLoading(false);
      }
  }


  useEffect(() => {
    console.log(isAdmin);
    getOrders();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    calculate();
  }, [initOrderList]);

  function calculate() {
    console.log("Init orderlist length::", initOrderList.length);
    let filteredOrders = initOrderList.filter(order => order.orderStatus !== 'Order Close' && order.orderStatus !== 'Dispatch' && order.orderStatus !== 'Packed')
    let orders = _.countBy(filteredOrders, 'orderType')
    let statusOrders = _.countBy(initOrderList, 'orderStatus')
    setPendingOrders(orders)
    setStatusOrders(statusOrders)
    console.log("Orders:::", Object.entries(orders), initOrderList.length);
  }

  return (
    <div>
        {error && <Alert variant="danger">{error}</Alert>}
        {loading && <h1>Loading data....</h1>}
      <Card key="head-pending">
        <Card.Body>
          <h2 className="text-center mb-4">Pending Orders</h2>
        </Card.Body>
      </Card>
      <div className="d-flex flex-wrap justify-content-around flex-fill">
      {Object.entries(pendingOrders).map(order => (
          <Card className="" key={order.id}>
              <Card.Header><Link to={`/list/orderType=${encodeURIComponent(order[0])}`}>{order[0]}</Link></Card.Header>
              <Card.Body>{order[1]}</Card.Body>
          </Card>
      ))}
      </div>

      <Card key="head-status" className="mt-5">
        <Card.Body>
          <h2 className="text-center mb-4">Orders By Status</h2>
        </Card.Body>
      </Card>
      <div className="d-flex flex-wrap justify-content-around flex-fill">
      {Object.entries(statusOrders).map(order => (
          <Card className="" key={order.id}>
              <Card.Header><Link to={`/list/orderStatus=${order[0]}`}>{order[0]}</Link></Card.Header>
              <Card.Body>{order[1]}</Card.Body>
          </Card>
      ))}
      </div>
    </div>
  )
}