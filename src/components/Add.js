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
  const [data, setData] = useState({});
  const [error, setError] = useState(null);
  const [selectedType, setSelectedType] = useState("");
  const [selectedArea, setSelectedArea] = useState("");
  const orderStatus = 'BOM'


  function getDateFromString(_date) {
    let date = new Date(_date);
    return `${("0" + date.getDate()).slice(-2)}-${("0" + (date.getMonth() + 1)).slice(-2)}-${date.getFullYear()}`
  }

  function resetForm() {
    setData({})
    document.getElementById('myForm').reset();
  }

  async function handleSave(e) {
    e.preventDefault();
    if(!isAdmin){
      setError("You do not have access.")
      setTimeout(() => {
        setError(null);
      }, 2000);
      return;
    }
    console.log(data);
    console.log(orderStatus);
    console.log("SelectedType:: ",selectedType);
    console.log("SelectedArea::", selectedArea);
    console.log("CurrentUser::", currentUser.email);

    let orderHistory = [{updatedBy: currentUser.email, updatedTo:orderStatus, updateDate: data.formOrderDate}]


    app.firestore().collection("orders").where('orderId',"==", data.formOrderId).get().then((doc) => {
      console.log(doc);
      console.log("Exists::",doc.empty);
      if(!doc.empty) {
        setError("Order with same orderId already exists")
        setTimeout(() => {
          setError(null);
        }, 2000);
        return;
      } else {
        console.log("Set");
        app.firestore().collection("orders")
      .add({
        orderId: data.formOrderId,
        partyId: data.formPartyId,
        orderType: selectedType,
        orderQuantity: data.formOrderQuantity,
        orderDate: data.formOrderDate,
        orderStatus: orderStatus,
        nextOrderStatus: 0,
        orderArea: selectedArea,
        orderSqFt: data.formOrderSqFt,
        createdBy: currentUser.email,
        orderHistory: orderHistory
      })
      .then(function() {
        console.log("Document successfully written!");
        setError('Data Saved Successfully')
        resetForm(data);
        setTimeout(() => {
          setError(null)
        }, 2000);
      })
      .catch(e => {
        console.error(e);
        setError('Something went wrong'+e.toString())
        resetForm(data);
        setTimeout(() => {
          setError(null)
        }, 2000);
      })
      let oh = orderHistory[0];
      app.firestore().collection("orderHistory")
        .add({
          orderId: data.formOrderId,
          orderSqFt: data.formOrderSqFt,
          ...oh,
        })
        .then(function () {
          console.log("Document successfully written to OrderHistory..!");
        })
        .catch(e => {
          console.error(e);
        })
      }
    }).catch((error) => {
      console.log("Error getting document:", error);
    });
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
        <Form id="myForm">
          <Form.Group as={Row} controlId="formOrderId">
            <Form.Label sm="2">Order Id</Form.Label>
            <Form.Control sm="10" className="pl-3" defaultValue={""} onChange={handleOnChange}>
            </Form.Control>
          </Form.Group>

          <Form.Group as={Row} controlId="formPartyId">
            <Form.Label sm="2">Party Id</Form.Label>
            <Form.Control sm="10" className="pl-3" defaultValue={""} onChange={handleOnChange}>

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
            <Form.Control sm="10" className="pl-3" defaultValue={""} onChange={handleOnChange}>

            </Form.Control>
          </Form.Group>

          <Form.Group as={Row} controlId="formOrderSqFt">
            <Form.Label sm="2">SqFt</Form.Label>
            <Form.Control sm="10" className="pl-3" defaultValue={""} onChange={handleOnChange}>
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
        {error && <h2>{error}</h2>}
      </Container>
    </div>
  );
  }
