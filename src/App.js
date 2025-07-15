import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "./components/HomePage";
import CartPage from "./components/CartPage";
import ButcherSignup from "./components/ButcherSignup";
import AdminLogin from "./components/AdminLogin";
import AdminDashboard from "./components/AdminDashboard";
import ButcherLogin from "./components/ButcherLogin";
import PaymentPage from "./components/PaymentPage";
import PaymentSuccess from "./components/PaymentSuccess";
import ProtectedAdminRoute from "./components/ProtectedAdminRoute"; // add this import at the top


function App() {
  const [cartItems, setCartItems] = useState([]);
  const [phone, setPhone] = useState("");

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            <HomePage
              cartItems={cartItems}
              setCartItems={setCartItems}
              phone={phone}
              setPhone={setPhone}
            />
          }
        />
        <Route
          path="/cart"
          element={<CartPage cartItems={cartItems} setCartItems={setCartItems} phone={phone} />}
        />
        <Route path="/butcher/signup" element={<ButcherSignup />} />
        <Route path="/butcher/login" element={<ButcherLogin />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        
        <Route path="/payment" element={<PaymentPage />} />
        <Route path="/payment-success" element={<PaymentSuccess />} />
        <Route
  path="/admin/dashboard"
  element={
    <ProtectedAdminRoute>
      <AdminDashboard />
    </ProtectedAdminRoute>
  }
/>
      </Routes>
    </Router>
  );
}

export default App;
