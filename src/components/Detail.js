import React from 'react'

export default function Detail(props) {
    console.log(props);
    return (
        <div style={{background:'red'}}>
            {props.match.params.orderId}
        </div>
    )
}
