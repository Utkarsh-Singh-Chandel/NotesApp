import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Home from "./pages/Home/Home";
import Login from "./pages/Login/Login";
import Signup from "./pages/Signup/Signup";
import { isAuthenticated } from "../utils/auth";
const routes = (
  <Router>
    <Routes>
      <Route path="/dashboard"  element={<Home />} />
   
      <Route path="/" element={isAuthenticated()?<Navigate to="/dashboard"/>:<Login />} />
      <Route path="/login" exact element={<Login />} />
      <Route path="/signup" exact element={<Signup />} />
    </Routes>
  </Router>
);
const App = () => {

  return <div>{routes}</div>;
};

export default App;
