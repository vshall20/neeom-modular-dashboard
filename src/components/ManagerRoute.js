import React from "react"
import { Route, Redirect } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"

export default function AdminRoute({ component: Component, ...rest }) {
  const { currentUser, isManager, isAdmin } = useAuth()

  return (
    <Route
      {...rest}
      render={props => {
          let normalUserComponent = (currentUser && (!isManager && !isAdmin)) ? <Redirect to="/records" /> : <Redirect to="/login" />;
        return currentUser && (isManager || isAdmin) ? <Component {...props} /> : normalUserComponent
      }}
    ></Route>
  )
}