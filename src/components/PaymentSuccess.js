// frontend/src/pages/PaymentSuccess.js

import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

const PaymentSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const orderData = location.state;

  if (!orderData) {
    return (
      <div className="text-center mt-10 text-red-600 text-lg">
        ❌ Payment session expired or no order data found.
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto mt-10 p-6 bg-white shadow-md rounded-lg text-gray-800">
      <h1 className="text-3xl font-bold text-green-700 mb-4 text-center">
        🎉 Thank You for Your Order!
      </h1>
      <p className="text-center text-gray-600 mb-6">
        Your order has been placed successfully using <strong>{orderData.method}</strong>.
      </p>

      <div className="border rounded p-4 bg-gray-50">
        <h2 className="text-xl font-semibold mb-2">📦 Order Summary</h2>
        <p><strong>Customer Phone:</strong> {orderData.customerPhone}</p>
        <p><strong>Delivery Location:</strong> {orderData.deliveryLocation}</p>
        <p><strong>Delivery Date:</strong> {orderData.deliveryDate}</p>
        <p><strong>Delivery Time:</strong> {orderData.deliveryTime}</p>
        <p><strong>Total Amount:</strong> ₹{orderData.totalAmount}</p>
        {orderData.method === "COD" && (
          <p><strong>COD Charge:</strong> ₹{orderData.codCharge?.toFixed(2)}</p>
        )}
      </div>

      <div className="text-center mt-8">
        <p className="text-gray-600">We'll deliver your fresh meat at the scheduled time.</p>
        <button
          onClick={() => navigate("/")}
          className="mt-4 bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700"
        >
          🏠 Back to Home
        </button>
      </div>
    </div>
  );
};

export default PaymentSuccess;
