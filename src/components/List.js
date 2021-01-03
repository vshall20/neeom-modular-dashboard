import React, { useState, useEffect } from "react"
import { Link, useHistory } from "react-router-dom"
import app from '../firebase';

export default function List() {
    const [orderList, setOrderList] = useState([]);
    const [loading, setLoading] = useState(false);
  const [error, setError] = useState("")


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
      
    </div>
  )
}