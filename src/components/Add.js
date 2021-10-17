  import React, { useState, useEffect } from "react"
  import { Form, Button, Container, Row } from "react-bootstrap";
  import app from '../firebase';
  import {
    useAuth
  } from "../contexts/AuthContext"
  
  
  export default function Add() {
    
    const {
      currentUser,
      isAdmin
    } = useAuth()

  const [allType, setAllType] = useState([]);
  const [allAreas, setAllAreas] = useState([]);
  const [data, setData] = useState({})
  const [selectedType, setSelectedType] = useState("");
  const [selectedArea, setSelectedArea] = useState("");
  const orderStatus = 'BOM'


  function getDateFromString(_date) {
    let date = new Date(_date);
    return `${date.getDate()}-${date.getMonth()+1}-${date.getFullYear()}`
  }

  async function handleSave(e) {
    e.preventDefault();
    if(!isAdmin){
      return;
    }
    console.log(data);
    console.log(orderStatus);
    console.log("SelectedType:: ",selectedType);
    console.log("SelectedArea::", selectedArea);
    console.log("CurrentUser::", currentUser.email);

    app.firestore().collection("orders")
      .add({
        orderId: data.formOrderId,
        partyId: data.formPartyId,
        orderType: selectedType,
        orderQuantity: data.formOrderQuantity,
        orderDate: data.formOrderDate,
        orderStatus: orderStatus,
        nextOrderStatus: 0,
        createdBy: currentUser.email
      })
      .then(function() {
        console.log("Document successfully written!");
      })
      .catch(e => {
        console.error(e);
      })
  }

  function handleOnChange(e) {
    let {id, value} = e.target
    if(id === 'formOrderDate') {
      setData({...data, [id]:getDateFromString(value)});
    } else {
      setData({...data, [id]:value});
    }
  }

  function handleSelect(e) {
    setSelectedType(e.target.value);
  }

  function handleAreaSelect(e) {
    setSelectedArea(e.target.value);
  }

  useEffect(() => {
    getAllOrderType();
    getAreas();
    // eslint-disable-next-line
  }, []);

    async function getAllOrderType() {
      const snapshot = await app.firestore().collection("orderType").get();
        let allTypes = snapshot.docs.map(doc => doc.data());
        let types = [];
        allTypes.map(type => types.push(type.value));
        setAllType([...types]);
        setSelectedType(types[0]);
    }

    async function getAreas() {
      const snapshot = await app.firestore().collection("areas").get();
        let allAreas = snapshot.docs.map(doc => doc.data());
        setAllAreas(allAreas[0].areas);
        setSelectedArea(allAreas[0].areas[0]);
    }

    
  return (
    <div>
      <Container>
        <Form>
          <Form.Group as={Row} controlId="formOrderId">
            <Form.Label sm="2">Order Id</Form.Label>
            <Form.Control sm="10" className="pl-3" defaultValue={" "} onChange={handleOnChange}>
            </Form.Control>
          </Form.Group>

          <Form.Group as={Row} controlId="formPartyId">
            <Form.Label sm="2">Party Id</Form.Label>
            <Form.Control sm="10" className="pl-3" defaultValue={" "} onChange={handleOnChange}>

            </Form.Control>
          </Form.Group>
          
          <Form.Group as={Row} controlId="formOrderArea">
            <Form.Label sm="2">Area</Form.Label>
            {/* <Form.Control sm="10" className="pl-3" defaultValue={" "} onChange={handleOnChange}>
            </Form.Control> */}
            <Form.Control as='select' sm="10" className="pl-3" onChange={handleAreaSelect} defaultValue={selectedArea}>
              {allAreas.map((a) => <option key={a} type={a}>{a}</option>)}
            </Form.Control>
          </Form.Group>

          <Form.Group as={Row} controlId="formOrderType">
            <Form.Label sm="2">Order Type</Form.Label>
            <Form.Control as='select' sm="10" className="pl-3" onChange={handleSelect} defaultValue={selectedType}>
              {allType.map((t) => <option key={t} type={t}>{t}</option>)}
            </Form.Control>
          </Form.Group>

          <Form.Group as={Row} controlId="formOrderQuantity">
            <Form.Label sm="2">Order Quantity</Form.Label>
            <Form.Control sm="10" className="pl-3" defaultValue={" "} onChange={handleOnChange}>

            </Form.Control>
          </Form.Group>

          <Form.Group as={Row} controlId="formOrderSqFt">
            <Form.Label sm="2">SqFt</Form.Label>
            <Form.Control sm="10" className="pl-3" defaultValue={" "} onChange={handleOnChange}>
            </Form.Control>
          </Form.Group>



          <Form.Group as={Row} controlId="formOrderDate">
            <Form.Label sm="2">Order Date</Form.Label>
            <Form.Control type="date" sm="10" className="pl-3" data-date-format='dd-mm-yyyy' onChange={handleOnChange}>

            </Form.Control>
          </Form.Group>


          <Form.Group
            className="d-flex justify-content-between"
            controlId="formOrderCurrentStatus"
          >
            <Button variant="primary" onClick={handleSave}>
              Save
            </Button>
            
          </Form.Group>
        </Form>
      </Container>
    </div>
  );
  }
