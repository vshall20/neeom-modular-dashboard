import React, { useState, useEffect } from 'react'
import app from '../firebase';
import { Form, Button, Container, Row, Col } from "react-bootstrap";

export default function Detail(props) {

    const [order, setOrder] = useState({});
    const [allStatus, setAllStatus] = useState({});
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    async function getAllStatus() {
        const snapshot = await app.firestore().collection("statusType").get();
        let allStatus = snapshot.docs.map(doc => doc.data());
        console.log(allStatus);
        setAllStatus(allStatus[0]);
      }

      function getOrder() {
        setLoading(true);
        //.where('owner', '==', currentUserId)
    //.where('title', '==', 'School1') // does not need index
    //.where('score', '<=', 10)    // needs index
    //.orderBy('owner', 'asc')
    //.limit(3)
    app.firestore().collection('orders').doc(props.match.params.orderId).onSnapshot((querySnapshot) => {
        setOrder(querySnapshot.data());
        setLoading(false);
        });
      }

      useEffect(() => {
        getOrder();
        getAllStatus();
        // eslint-disable-next-line
      }, []);

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
                    <Form.Check type="checkbox" label="Check me out" />
                </Form.Group>
                <Form.Group className="d-flex justify-content-between" controlId="formOrderCurrentStatus">
                <Button variant="primary" type="submit">
                    Save
                </Button>
                <Button variant="danger" type="submit">
                    Delete
                </Button>
                <Button variant="info" type="submit">
                    Close
                </Button>
                </Form.Group>
                </Form>
            </Container>
        </div>
    )
}
