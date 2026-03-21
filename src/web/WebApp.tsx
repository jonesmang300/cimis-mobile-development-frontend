import React from "react";
import { BrowserRouter as Router, Route, Switch, Redirect, NavLink } from "react-router-dom";
import Home from "./pages/Home";
import UserList from "./pages/UserList";
import UserDetails from "./pages/UserDetails";
import ResetPassword from "./pages/ResetPassword";
import "./web.css";

const Nav: React.FC = () => (
  <header className="topbar">
    <div className="brand">CIMIS Admin</div>
    <nav className="nav-links">
      <NavLink exact to="/" activeClassName="active">
        Overview
      </NavLink>
      <NavLink to="/users" activeClassName="active">
        Users
      </NavLink>
    </nav>
  </header>
);

const WebApp: React.FC = () => {
  return (
    <Router>
      <Switch>
        <Route exact path="/reset-password" component={ResetPassword} />
        <Route
          path="/"
          render={() => (
            <>
              <Nav />
              <Switch>
                <Route exact path="/" component={Home} />
                <Route exact path="/users" component={UserList} />
                <Route exact path="/users/:id" component={UserDetails} />
                <Redirect to="/" />
              </Switch>
            </>
          )}
        />
        <Redirect to="/" />
      </Switch>
    </Router>
  );
};

export default WebApp;
