import React, { useState } from "react";
import { Link, NavLink, useHistory } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function Header() {
  const { currentUser, isAdmin, isManager, logout } = useAuth();
  const history = useHistory();
  const [open, setOpen] = useState(false);

  async function handleLogout() {
    try {
      await logout();
      history.push("/login");
    } catch {
      // swallow; auth listener will handle state
    }
  }

  return (
    <header className="app-header">
      <div className="app-header-inner">
        <Link to="/" className="app-brand" onClick={() => setOpen(false)}>
          <img src="/logo192.png" alt="Neeom Modular" />
          <div className="app-brand-text">
            <span className="app-brand-name">Neeom Modular</span>
            <span className="app-brand-tag">Order Tracker</span>
          </div>
        </Link>

        {currentUser && (
          <>
            <button
              className="nav-toggle"
              aria-label="Toggle navigation"
              onClick={() => setOpen((o) => !o)}
            >
              <span></span>
              <span></span>
              <span></span>
            </button>

            <nav className={`app-nav${open ? " open" : ""}`}>
              {isAdmin && (
                <NavLink
                  to="/"
                  exact
                  className="nav-link"
                  activeClassName="active"
                  onClick={() => setOpen(false)}
                >
                  Orders
                </NavLink>
              )}
              {isAdmin && (
                <NavLink
                  to="/add"
                  className="nav-link"
                  activeClassName="active"
                  onClick={() => setOpen(false)}
                >
                  Add
                </NavLink>
              )}
              {(isAdmin || isManager) && (
                <NavLink
                  to="/dashboard"
                  className="nav-link"
                  activeClassName="active"
                  onClick={() => setOpen(false)}
                >
                  Dashboard
                </NavLink>
              )}
              {isAdmin && (
                <NavLink
                  to="/closed"
                  className="nav-link"
                  activeClassName="active"
                  onClick={() => setOpen(false)}
                >
                  Closed Orders
                </NavLink>
              )}
              {!isAdmin && !isManager && (
                <NavLink
                  to="/records"
                  className="nav-link"
                  activeClassName="active"
                  onClick={() => setOpen(false)}
                >
                  Lookup
                </NavLink>
              )}
              <button
                type="button"
                className="nav-link logout"
                onClick={() => {
                  setOpen(false);
                  handleLogout();
                }}
                style={{ background: "none", border: "none", cursor: "pointer" }}
              >
                Logout
              </button>
            </nav>
          </>
        )}
      </div>
    </header>
  );
}
