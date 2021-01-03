import React, { useState, useEffect } from 'react'
import app from '../firebase';
import { Form, Button, Container, Row, Col } from "react-bootstrap";
import { useHistory } from 'react-router-dom';
import { useAuth } from "../contexts/AuthContext"


export default function Detail(props) {

    const [order, setOrder] = useState({});
    const [allStatus, setAllStatus] = useState(null);
    const [error, setError] = useState(null);
    const [isChecked, setIsChecked] = useState(false);
    const [loading, setLoading] = useState(false);
    const history = useHistory();
    const {currentUser} = useAuth();

    async function getAllStatus() {
        const snapshot = await app.firestore().collection("statusType").get();
        let allStatus = snapshot.docs.map(doc => doc.data());
        // console.log(allStatus);
        setAllStatus(allStatus[0]);
      }

      function getOrder() {
        setLoading(true);
        //.where('owner', '==', currentUserId)
    //.where('title', '==', 'School1') // does not need index
    //.where('score', '<=', 10)    // needs index
    //.orderBy('owner', 'asc')
    //.limit(3)
    app.firestore().collection('orders').doc(props.match.params.orderId).get().then((item) => {
        // console.log(item);
        const items = item.data();
        setOrder(items);
        setLoading(false);
        });
      }

      useEffect(() => {
        getOrder();
        getAllStatus();
        // eslint-disable-next-line
      }, []);
      

      function delteOrder(cb) {
        app.firestore().collection('orders')
          .doc(props.match.params.orderId)
          .delete().then(() => cb())
          .catch((err) => {
            console.error(err);
          });
      }
    
      // EDIT FUNCTION
      function editOrder(updatedOrder, cb) {
        setLoading();
        app.firestore().collection('orders')
          .doc(props.match.params.orderId)
          .update(updatedOrder).then(() => cb())
          .catch((err) => {
            console.error(err);
          });
      }

      function handleClose() {
          console.log("Close.....");
        history.push('/');
      }

      function getToday() {
        let date = new Date();
        return `${date.getDate()}-${date.getMonth()+1}-${date.getFullYear()}`
      }

      function handleSave() {
        let updatedOrder = order;
        let selectedStatus = allStatus[order.orderType][order.nextOrderStatus]
        let orderHistory = order.orderHistory || []
        updatedOrder = {
            ...updatedOrder,
                orderStatus: selectedStatus,
                nextOrderStatus: order.nextOrderStatus + 1,
                orderHistory: [...orderHistory, {updatedBy: currentUser.email, updatedTo:selectedStatus, updateDate: getToday()}]
        }
        // console.log(order, updatedOrder);
        editOrder(updatedOrder, handleClose);
      }

      function handleDelete() {
          let delete_order = window.confirm('Are you sure you want to Delete the Order?'); 
          if(delete_order) delteOrder(handleClose)
      }

    return (
        <div>
            <Container>
            <Form>
                <Form.Group as={Row} controlId="formOrderId">
                    <Form.Label sm="2">Order Id</Form.Label>
                    <Form.Text sm="10" className="text-muted pl-3">
                    {order.orderId}
                    </Form.Text>
                </Form.Group>

                <Form.Group as={Row}controlId="formPartyId">
                    <Form.Label sm="2">Party Id</Form.Label>
                    <Form.Text sm="10" className="text-muted pl-3">
                    {order.partyId}
                    </Form.Text>
                </Form.Group>

                <Form.Group as={Row}controlId="formOrderType">
                    <Form.Label sm="2">Order Type</Form.Label>
                    <Form.Text sm="10" className="text-muted pl-3">
                    {order.orderType}
                    </Form.Text>
                </Form.Group>

                <Form.Group as={Row}controlId="formOrderQuantity">
                    <Form.Label sm="2">Order Quantity</Form.Label>
                    <Form.Text sm="10" className="text-muted pl-3">
                    {order.orderQuantity}
                    </Form.Text>
                </Form.Group>

                <Form.Group as={Row}controlId="formOrderDate">
                    <Form.Label sm="2">Order Date</Form.Label>
                    <Form.Text sm="10" className="text-muted pl-3">
                    {order.orderDate}
                    </Form.Text>
                </Form.Group>

                <Form.Group as={Row}controlId="formOrderCreatedBy">
                    <Form.Label sm="2">Order Created By</Form.Label>
                    <Form.Text sm="10" className="text-muted pl-3">
                    {order.createdBy}
                    </Form.Text>
                </Form.Group>

                <Form.Group as={Row} controlId="formOrderCurrentStatus">
                    <Form.Label sm="2">Current Order Status</Form.Label>
                    <Form.Text sm="10" className="text-muted pl-3">
                    {order.orderStatus}
                    </Form.Text>
                </Form.Group>
                
                <Form.Group as={Row}controlId="formBasicCheckbox">
                    {/* <Form.Check type="checkbox" label="Check me out" /> */}

                    <Form.Check
                    label="BOM"
                    checked={true}
                    disabled={true}
                  ></Form.Check>
                  <Form.Group as={Col}>
                        <Form.Text>{order.createdBy}</Form.Text>
                        <Form.Text>{order.orderDate}</Form.Text>
                  </Form.Group>
                </Form.Group>

                {allStatus && allStatus[order.orderType].map((status, i) => {
                    return (
                        <Form.Group as={Row} controlId={`formBasicCheckbox-${i}`}>
                        <Form.Check
                    label={status}
                    defaultChecked={order.nextOrderStatus > i}
                    disabled={!(order.nextOrderStatus === i)}
                  ></Form.Check>
                  <Form.Group as={Col}>
                        <Form.Text>{order.orderHistory && order.orderHistory[i] ? order.orderHistory[i].updatedBy : ""}</Form.Text>
                        <Form.Text>{order.orderHistory && order.orderHistory[i] ? order.orderHistory[i].updateDate : ""}</Form.Text>
                  </Form.Group>
                  </Form.Group>
                    )
                })}
                
                <Form.Group className="d-flex justify-content-between" controlId="formOrderCurrentStatus">
                <Button variant="primary" onClick={handleSave}>
                    Save
                </Button>
                <Button variant="danger" onClick={handleDelete}>
                    Delete
                </Button>
                <Button variant="info" onClick={handleClose}>
                    Close
                </Button>
                </Form.Group>
                </Form>
            </Container>
        </div>
    )
}
