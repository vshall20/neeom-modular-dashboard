import React, { useState, useEffect } from "react";
import { Table, InputGroup, FormControl, Button } from "react-bootstrap";
import { Link } from "react-router-dom";
import app from "../firebase";
import XLSX from "xlsx";
import { getOrderAge } from "./utils";

export default function List(props) {
  const [orderList, setOrderList] = useState([]);
  const [initOrderList, setInitOrderList] = useState([]);
  const [loading, setLoading] = useState(false);
  //   const [error, setError] = useState("")

  function handleSearch(e) {
    console.log(e.target.value);
    let value = e.target.value;
    if (value === null || value === "") {
      setOrderList(initOrderList);
    } else {
      const newArray = initOrderList.filter((o) => {
        return Object.keys(o).some((k) => {
          let val = o[k];
          return String(val).toLowerCase().includes(value.toLowerCase());
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
          // if(_item.orderStatus.includes('Close')) { //&& _item.orderId.includes('Test')
          //   app.firestore().collection("ordersClosed")
          //   .doc(doc.id)
          //   .set({ ..._item })
          //   .then(() => {
          //     app.firestore().collection('orders').doc(doc.id).delete()
          //   })
          // }
          _item.id = doc.id;
          items.push(_item);
        });
        setOrderList(items);
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
        setOrderList(items);
        setInitOrderList(items);
        setLoading(false);
      });
  }

  function downloadToCSV() {
    console.log("DownloadToCSV", orderList[0]);
    let _orders = [];
    orderList.map((o) => {
      let order = {};
      if (!o.orderStatus.includes("Close")) {
        order.orderDate = o.orderDate;
        order.orderId = o.orderId;
        order.partyId = o.partyId;
        order.orderType = o.orderType;
        order.orderQuantity = o.orderQuantity;
        order.orderStatus = o.orderStatus;
        order.orderAge = getOrderAge(o);
        order.lastUpdateDate =
          o.orderHistory[o.orderHistory.length - 1].updateDate;
        order.orderSqFt = o.orderSqFt;
        order.orderArea = o.orderArea;
        _orders.push(order);
      }
    });
    var ws = XLSX.utils.json_to_sheet(_orders);
    var wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Orders");
    const wbout = XLSX.write(wb, {
      type: "base64",
      bookType: "xlsx",
    });
    XLSX.writeFile(wb, "orderList.xlsx");
    // const uri = FileSystem.cacheDirectory + 'Orders.xlsx';
    // console.log(`Writing to ${JSON.stringify(uri)} with text: ${wbout}`);
    // await FileSystem.writeAsStringAsync(uri, wbout, {
    //   encoding: FileSystem.EncodingType.Base64
    // });
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
        <InputGroup.Append>
          <Button variant="outline-secondary" onClick={downloadToCSV}>
            Download
          </Button>
        </InputGroup.Append>
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
            else {
              // moveOrderToClose(order)
              return null;
            }
          })}
        </tbody>
      </Table>
    </div>
  );
}
