import React from "react"
// import Signup from "./Signup"
import { Container } from "react-bootstrap"
import { AuthProvider } from "../contexts/AuthContext"
import { BrowserRouter as Router, Switch, Route } from "react-router-dom"
import Dashboard from "./Dashboard"
import Add from "./Add"
import List from "./List"
import UserList from "./UserList"
import Login from "./Login"
import Header from "./Header"
import PrivateRoute from "./PrivateRoute"
import Detail from "./Detail"
import AdminRoute from "./AdminRoute"
// import ForgotPassword from "./ForgotPassword"
// import UpdateProfile from "./UpdateProfile"

function App() {
  return (
    <Container
      className="d-flex align-items-center justify-content-center"
      style={{ minHeight: "100vh" }}
    >
      <div className="w-100"
      style={{ minHeight: "100vh" }}
      >
        <Router>
          <AuthProvider>
            <Header></Header>
            <Switch>
              <AdminRoute exact path="/" component={List} />
              <PrivateRoute exact path="/list/:filter" component={List} />
              <AdminRoute exact path="/dashboard" component={Dashboard} />
              <AdminRoute exact path="/add" component={Add} />
              <PrivateRoute exact path="/records" component={UserList} />
              <PrivateRoute path="/detail/:orderId" component={Detail} />
              {/* <Route path="/signup" component={Signup} /> */}
              <Route path="/login" component={Login} />
              {/* <Route path="/forgot-password" component={ForgotPassword} /> */}
            </Switch>
          </AuthProvider>
        </Router>
      </div>
    </Container>
  )
}

export default App