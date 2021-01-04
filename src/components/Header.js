import React, {useState} from 'react'
import { Navbar, Nav } from "react-bootstrap";
import { Link, NavLink, useHistory } from "react-router-dom"


import { useAuth } from "../contexts/AuthContext"


export default function Header() {

    const [error, setError] = useState("")
    const { currentUser, logout } = useAuth()
    const history = useHistory()

    async function handleLogout() {
        setError("")
    
        try {
          await logout()
          history.push("/login")
        } catch {
          setError("Failed to log out")
        }
      }

    const handleSelect = (eventKey) => {
        // alert(`selected ${eventKey}`)
        handleLogout()
    };

    
    return (
        <div>
            <Navbar bg="light">
  {/* "Link" in brand component since just redirect is needed */}
  <Navbar.Brand as={Link} to='/'>Neeom Modular</Navbar.Brand>
  {
  currentUser && <Nav>
    {/* "NavLink" here since "active" class styling is needed */}
    {/* <Nav.Link as={NavLink} to='/' exact>Orders</Nav.Link> */}
    <Nav.Link as={NavLink} to='/dashboard'>Dashboard</Nav.Link>
    {/* <Nav.Link as={NavLink} to='/add'>Add</Nav.Link> */}
    {/* <Nav.Link as={NavLink} to='/scan'>Scan</Nav.Link> */}
    <Nav.Link as={Link} eventKey="logout" onSelect={handleSelect}>Logout</Nav.Link>
  </Nav>
}
</Navbar>
        </div>
    )
}
