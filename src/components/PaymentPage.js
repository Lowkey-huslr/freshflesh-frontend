import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";

const PaymentPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const orderData = location.state;

  const [upiPaid, setUpiPaid] = useState(false);
  const [showWaiting, setShowWaiting] = useState(false);
  const [statusText, setStatusText] = useState("Waiting for admin to confirm...");
  const [pollTries, setPollTries] = useState(0);

  const codCharge = (orderData.totalAmount * 1.5) / 100;
  const codTotal = Math.round(orderData.totalAmount + codCharge);

  const handleCODConfirm = async () => {
    try {
      await axios.post( process.env.REACT_APP_BACKEND_URL +"/api/order/new", {
        ...orderData,
        paymentMethod: "COD",
        paymentStatus: "Paid",
      });

      navigate("/payment-success", {
        state: {
          ...orderData,
          method: "COD",
          codCharge,
        },
      });
    } catch (err) {
      console.error("❌ COD order failed:", err);
      alert("❌ Failed to place COD order.");
    }
  };

  const handleUPIConfirm = async () => {
    setUpiPaid(true);
    setShowWaiting(true);

    try {
      const response = await axios.post( process.env.REACT_APP_BACKEND_URL +"/api/order/new", {
        ...orderData,
        paymentMethod: "UPI",
        paymentStatus: "Pending",
      });

      console.log("✅ UPI order created:", response.data);
    } catch (err) {
      console.error("❌ Failed to create UPI order:", err.response?.data || err.message);
      alert("❌ Failed to create UPI order.");
      setShowWaiting(false);
      setUpiPaid(false);
    }
  };

  // 🔁 Poll for payment confirmation every 3s (max 2 minutes)
  useEffect(() => {
    let interval;
    if (upiPaid) {
      interval = setInterval(async () => {
        setPollTries((prev) => prev + 1);

        try {
          const res = await axios.get(
             process.env.REACT_APP_BACKEND_URL +`/api/order/payment-status/${orderData.customerPhone}`
          );

          if (res.data?.isPaid) {
            clearInterval(interval);
            console.log("✅ Payment confirmed by admin.");
            navigate("/payment-success", {
              state: {
                ...orderData,
                method: "UPI",
              },
            });
          } else if (pollTries > 40) {
            // After 2 mins, show backup message
            setStatusText("⌛ Still waiting... Please contact support if this takes too long.");
          }
        } catch (err) {
          console.error("⚠️ Polling error:", err);
          setStatusText("⚠️ Error checking status. Retrying...");
        }
      }, 3000);
    }

    return () => clearInterval(interval);
  }, [upiPaid, navigate, orderData, pollTries]);

  if (!orderData) {
    return (
      <div className="text-center mt-10 text-red-600 text-lg">
        ❌ Payment session expired or invalid order.
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white text-gray-800">
      <h2 className="text-3xl font-bold mb-6">💳 Complete Your Payment</h2>

      <div className="border rounded p-4 mb-6">
        <h3 className="text-xl font-semibold mb-2">Total Amount (UPI): ₹{orderData.totalAmount}</h3>
        <p className="text-sm text-gray-600 mb-2">
          Choose your preferred payment method below.
        </p>

        <div className="space-y-6">
          {/* COD Option */}
          <div className="border rounded p-4">
            <h4 className="text-lg font-semibold mb-2">🚚 Cash on Delivery</h4>
            <p className="text-sm text-gray-700">
              Extra ₹{codCharge.toFixed(2)} (1.5% COD charge)
            </p>
            <p className="text-md mt-1 font-bold">Total: ₹{codTotal}</p>
            <button
              onClick={handleCODConfirm}
              className="bg-green-600 mt-3 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              ✅ Confirm COD Order
            </button>
          </div>

          {/* UPI Option */}
          <div className="border rounded p-4">
            <h4 className="text-lg font-semibold mb-2">📱 Pay via UPI</h4>
            <img
              src="/upi-qr.jpg"
              alt="Scan QR"
              className="w-64 h-auto mx-auto mb-4 border"
            />
            <p className="text-center text-sm text-gray-600 mb-2">
              Scan this QR code using any UPI app and pay ₹{orderData.totalAmount}
            </p>
            <button
              onClick={handleUPIConfirm}
              disabled={upiPaid}
              className={`${
                upiPaid ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
              } text-white px-4 py-2 rounded w-full`}
            >
              ✅ I Have Paid
            </button>

            {showWaiting && (
              <div className="mt-4 text-center text-orange-600 font-semibold">
                ⏳ {statusText}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;
