import React, { useState, useEffect } from "react";
import { Table, InputGroup, FormControl } from "react-bootstrap";
import { Link } from "react-router-dom";
import app from "../firebase";
import { getOrderAge } from "./utils";

export default function UserList(props) {
  const [orderList, setOrderList] = useState([]);
  const [initOrderList, setInitOrderList] = useState([]);
  const [loading, setLoading] = useState(false);
  //   const [error, setError] = useState("")

  function handleSearch(e) {
    console.log(e.target.value);
    let value = e.target.value;
    if (value === null || value.length < 4) {
      setOrderList([]);
    } else {
      const newArray = initOrderList.filter((o) => {
        return Object.keys(o).some((k) => {
          let val = o[k];
          return (
            k.toLocaleLowerCase() === "orderid" &&
            String(val).toLowerCase().includes(value.toLowerCase())
          );
        });
      });
      //   console.log("newArray:", newArray)
      setOrderList([...newArray]);
    }
  }

  //REALTIME GET FUNCTION
  function getOrders() {
    setLoading(true);
    //.where('owner', '==', currentUserId)
    //.where('title', '==', 'School1') // does not need index
    //.where('score', '<=', 10)    // needs index
    //.orderBy('owner', 'asc')
    //.limit(3)
    app
      .firestore()
      .collection("orders")
      .orderBy("orderId", "desc")
      .onSnapshot((querySnapshot) => {
        const items = [];
        querySnapshot.forEach((doc) => {
          let _item = doc.data();
          _item.id = doc.id;
          items.push(_item);
        });
        // setOrderList(items);
        setInitOrderList(items);
        setLoading(false);
      });
  }

  function getOrdersByOrderType(filter) {
    let _filter = filter.split("=");
    app
      .firestore()
      .collection("orders")
      .where(_filter[0], "==", decodeURIComponent(_filter[1]))
      .orderBy("orderId", "desc")
      .onSnapshot((querySnapshot) => {
        const items = [];
        querySnapshot.forEach((doc) => {
          let _item = doc.data();
          _item.id = doc.id;
          items.push(_item);
        });
        //   setOrderList(items);
        setInitOrderList(items);
        setLoading(false);
      });
  }

  useEffect(() => {
    console.log(props.match.params);
    Object.keys(props.match.params).length > 0
      ? getOrdersByOrderType(props.match.params.filter)
      : getOrders();
    // eslint-disable-next-line
  }, []);

  return (
    <div>
      <InputGroup className="mb-3">
        <InputGroup.Prepend>
          <InputGroup.Text>Search:</InputGroup.Text>
        </InputGroup.Prepend>
        <FormControl placeholder="" aria-label="" onChange={handleSearch} />
      </InputGroup>
      {loading && <div>Loading...</div>}
      <Table striped bordered hover variant="dark" size="sm">
        <thead>
          <tr>
            <th>OrderId</th>
            <th>PartyId</th>
            <th>Date</th>
            <th>Order Age</th>
            <th>Last Updated On Date</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {orderList.map((order) => {
            if (order.orderStatus !== "Order Close")
              return (
                <tr key={order.id}>
                  <td>
                    <Link to={`/detail/${order.id}`}>{order.orderId}</Link>
                  </td>
                  <td>{order.partyId}</td>
                  <td>{order.orderDate}</td>
                  <td>{getOrderAge(order)}</td>
                  <td>
                    {
                      order.orderHistory[order.orderHistory.length - 1]
                        .updateDate
                    }
                  </td>
                  <td>{order.orderStatus}</td>
                </tr>
              );
            else return null;
          })}
        </tbody>
      </Table>
    </div>
  );
}
