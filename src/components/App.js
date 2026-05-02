import React from "react"
import { AuthProvider } from "../contexts/AuthContext"
import { BrowserRouter as Router, Switch, Route, useLocation } from "react-router-dom"
import Dashboard from "./Dashboard"
import Add from "./Add"
import List from "./List"
import UserList from "./UserList"
import Login from "./Login"
import Header from "./Header"
import PrivateRoute from "./PrivateRoute"
import Detail from "./Detail"
import AdminRoute from "./AdminRoute"
import ManagerRoute from "./ManagerRoute"

function Shell() {
  const location = useLocation()
  const isAuth = location.pathname.startsWith("/login")
  return (
    <div className="app-shell">
      {!isAuth && <Header />}
      <Switch>
        <AdminRoute exact path="/" component={List} />
        <PrivateRoute exact path="/list/:filter" component={List} />
        <ManagerRoute exact path="/dashboard" component={Dashboard} />
        <AdminRoute exact path="/add" component={Add} />
        <PrivateRoute exact path="/records" component={UserList} />
        <PrivateRoute path="/detail/:orderId" component={Detail} />
        <Route path="/login" component={Login} />
      </Switch>
    </div>
  )
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <Shell />
      </AuthProvider>
    </Router>
  )
}

export default App