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
  const [statusOrdersSum, setStatusOrdersSum] = useState([]);
  const [initOrderList, setInitOrderList] = useState([]);
  const [initOrderHistoryList, setInitOrderHistoryList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState(getToday());
  const [error, setError] = useState("")
  const {
    currentUser,
    isAdmin,
    logout
  } = useAuth()


  function getDateFromString(_date) {
    let date = new Date(_date);
    return `${date.getDate()}-${date.getMonth()+1}-${date.getFullYear()}`
  }

  function getToday() {
    let date = new Date();
    return `${date.getDate()}-${date.getMonth()+1}-${date.getFullYear()}`
  }

  function getOrders() {
    setLoading(true);
    //.where('owner', '==', currentUserId)
    //.where('orderStatus', '!=', 'Order Close') // does not need index
    //.where('score', '<=', 10)    // needs index
    //.orderBy('owner', 'asc')
    //.limit(3)
    app.firestore().collection('orders').where('orderStatus', '!=', 'Order Close').onSnapshot((querySnapshot) => handleSnapshotData(querySnapshot));
  }

  function getOrderHistory() {
    setLoading(true);
    //.where('owner', '==', currentUserId)
    //.where('orderStatus', '!=', 'Order Close') // does not need index
    //.where('score', '<=', 10)    // needs index
    //.orderBy('owner', 'asc')
    //.limit(3)
    app.firestore().collection('orderHistory').where('updatedTo', '!=', 'Order Close').onSnapshot((querySnapshot) => handleHistorySnapshotData(querySnapshot));
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

  function handleHistorySnapshotData(querySnapshot) {
    const items = [];
      querySnapshot.forEach((doc) => {
        let _item = doc.data();
        _item.id = doc.id;
        items.push(_item);
      });
      console.log("Dashboard:: Item Length:", items.length);
      if (items.length > 0) {
        setInitOrderHistoryList(items);
        console.log("ssetting itm and calling calculate::: ", items.length, initOrderHistoryList.length);
        setLoading(false);
      }
  }


  useEffect(() => {
    console.log(getToday());
    getOrders();
    getOrderHistory();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    calculate();
    calculateSum(getDateFromString(new Date()));
  }, [initOrderHistoryList]);

  function handleDateChange(e) {
    let date = getDateFromString(e.target.value);
    setDate(date);
    calculateSum(date);
  }

  function calculateSum(date) {
    let orderByStatus = _.groupBy(initOrderHistoryList, 'updatedTo');
    let statusSum = {};
    console.log(orderByStatus);
    Object.keys(orderByStatus).map(status => {
      let sumSqft = orderByStatus[status].reduce((sum, o) => {
        let orderDate = o.updateDate;
        console.log(o.orderId,o.orderSqFt, orderDate);
        if(orderDate === date) {
          return sum + (parseFloat(o.orderSqFt) || 0)
        } else {
          return sum + 0;
        }
      }, 0)
      statusSum[status] = sumSqft;
    })
    setStatusOrdersSum(statusSum)
  }

  function calculate() {
    console.log("Init orderlist length::", initOrderList.length);
    let filteredOrders = initOrderList.filter(order => order.orderStatus !== 'Order Close' && order.orderStatus !== 'Dispatch' && order.orderStatus !== 'Packed')
    let orders = _.countBy(filteredOrders, 'orderType')
    let statusOrders = _.countBy(initOrderList, 'orderStatus');
    let orderByStatus = _.groupBy(initOrderList, 'orderStatus');
    setPendingOrders(orders)
    setStatusOrders(statusOrders)
    console.log("Orders:::", Object.entries(orders), initOrderList.length);
  }

  return (
    <div>
        {error && <Alert variant="danger">{error}</Alert>}
        {loading && <h1>Loading data....</h1>}

      <>
      <Card key="head-pending">
        <Card.Body>
          <h2 className="text-center mb-4">Pending Orders</h2>
        </Card.Body>
      </Card>
      <div className="d-flex flex-wrap justify-content-around flex-fill">
      {Object.entries(pendingOrders).map(order => (
          <Card className="mb-2 w-25" key={order.id}>
              <Card.Header><Link to={`/list/orderType=${encodeURIComponent(order[0])}`}>{order[0]}</Link></Card.Header>
              <Card.Body>{order[1]}</Card.Body>
          </Card>
      ))}
      </div>
      </>

      <>
      <Card key="head-pending">
        <Card.Body>
          <h2 className="text-center mb-4">Orders By Status</h2>
        </Card.Body>
      </Card>
      <div className="d-flex flex-wrap justify-content-around flex-fill">
      {Object.entries(statusOrders).map(order => (
          <Card className="mb-2 w-25" key={order.id}>
              <Card.Header><Link to={`/list/orderStatus=${order[0]}`}>{order[0]}</Link></Card.Header>
              <Card.Body>{order[1]}</Card.Body>
          </Card>
      ))}
      </div>
      </>

      <>
      <Card key="head-pending">
        <Card.Body>
          <h2 className="text-center mb-4">Daily Work</h2>
          <input type="date" defaultValue={getToday} onChange={handleDateChange}/>
          <span> Date: {date}</span>
        </Card.Body>
      </Card>
      <div className="d-flex flex-wrap justify-content-around flex-fill">
      {Object.entries(statusOrdersSum).map(order => (
          <Card className="mb-2 w-25" key={order.id}>
              <Card.Header><Link to={`/list/orderStatus=${order[0]}`}>{order[0]}</Link></Card.Header>
              <Card.Body>{order[1]}</Card.Body>
          </Card>
      ))}
      </div>
      </>

    </div>
  )
}