import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const ORIGIN = { lat: 22.806794, lng: 86.217308 };

const CartPage = ({ cartItems, setCartItems, phone }) => {
  const [address, setAddress] = useState("");
  const [customerCoords, setCustomerCoords] = useState(null); // ✅ Added
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [distance, setDistance] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const navigate = useNavigate();

  const getDateOptions = () => {
    const today = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(today.getDate() + i);
      return d.toISOString().split("T")[0];
    });
  };

  const getTimeSlots = () => {
    const slots = [];
    for (let h = 7; h < 22; h++) slots.push(`${h}:00`);
    return slots;
  };

  const isToday = (selectedDate) =>
    new Date(selectedDate).toDateString() === new Date().toDateString();

  const getValidTimeSlots = () => {
    const now = new Date();
    const currentHour = now.getHours();
    return getTimeSlots().filter(
      (t) => !isToday(date) || parseInt(t) > currentHour
    );
  };

  const getDeliveryCharge = () => {
    const totalKg = cartItems.reduce((acc, item) => acc + item.quantity, 0);
    let charge = 0;

    if (distance <= 2.5) {
      if (totalKg > 3) charge += (totalKg - 3) * 5;
    } else if (distance <= 3) {
      charge = 20;
      if (totalKg > 3) charge += (totalKg - 3) * 8;
    } else {
      charge = 20 + Math.ceil(distance - 3) * 4;
      if (totalKg > 3) charge += (totalKg - 3) * 8;
    }

    return Math.round(charge);
  };

  const meatTotal = cartItems.reduce(
    (acc, item) => acc + item.pricePerKg * item.quantity,
    0
  );
  const deliveryCharge = getDeliveryCharge();
  const rawTotal = meatTotal + deliveryCharge;
  const codTotal = Math.round(rawTotal + rawTotal * 0.015);

  // ✅ Helper function to get full address from coordinates
  const getAddressFromCoords = async (lat, lng) => {
    const API_KEY = "https://maps.googleapis.com/maps/api/js?key=AIzaSyDiorZtSXDIL9EDAI-RLa0QX2_FHZMetOE"; // 🔁 Replace with real key
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${API_KEY}`;

    try {
      const response = await fetch(url);
      const data = await response.json();
      if (data.status === "OK" && data.results.length > 0) {
        return data.results[0].formatted_address;
      } else {
        return "Unknown Address";
      }
    } catch (err) {
      console.error("Failed to fetch address from coordinates", err);
      return "Unknown Address";
    }
  };

  const handleLocation = () => {
    if (!navigator.geolocation) return alert("Location not supported");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const userLoc = new window.google.maps.LatLng(latitude, longitude);
        setCustomerCoords({ lat: latitude, lng: longitude }); // ✅ Added

        const service = new window.google.maps.DistanceMatrixService();
        service.getDistanceMatrix(
          {
            origins: [ORIGIN],
            destinations: [userLoc],
            travelMode: "DRIVING",
          },
          async (res, status) => {
            if (status === "OK") {
              const dist = res.rows[0].elements[0].distance.text;
              setDistance(parseFloat(dist.replace(" km", "")));
              const fullAddress = await getAddressFromCoords(latitude, longitude);
              setAddress(fullAddress); // ✅ Updated
              updateMap({ lat: latitude, lng: longitude });
            }
          }
        );
      },
      () => alert("Permission denied")
    );
  };

  const updateMap = (coords) => {
    const map = new window.google.maps.Map(mapRef.current, {
      zoom: 14,
      center: coords,
    });

    if (markerRef.current) markerRef.current.setMap(null);

    const marker = new window.google.maps.Marker({
      position: coords,
      map: map,
      title: "Your Location",
    });

    markerRef.current = marker;
  };

  const handlePlaceOrder = async () => {
    if (!phone || !address || !date || !time) {
      return alert("Please fill all fields");
    }

    const orderDetails = {
      cart: cartItems,
      customerPhone: phone,
      customerAddress: address,           // ✅ Added
      customerCoords: customerCoords,     // ✅ Added
      deliveryDate: date,
      deliveryTime: time,
      deliveryDistance: distance,
      totalAmount: paymentMethod === "COD" ? codTotal : rawTotal,
      paymentMethod,
      paymentStatus: "Pending",
    };

    try {
      if (paymentMethod === "Online") {
        const res = await axios.post( process.env.REACT_APP_BACKEND_URL +"/api/order/new", orderDetails);
        if (res.status === 201) {
          navigate("/payment", { state: orderDetails });
        }
      } else {
        const res = await axios.post( process.env.REACT_APP_BACKEND_URL +"/api/order/new", orderDetails);
        if (res.status === 201) {
          navigate("/payment-success", {
            state: {
              ...orderDetails,
              method: "COD",
            },
          });
        }
      }
    } catch (err) {
      console.error("❌ Order failed:", err.response?.data || err.message);
      alert("❌ Order failed: " + (err.response?.data?.error || "Check backend logs"));
    }
  };

  const handleQuantityChange = (id, qty) => {
    if (qty < 0.25 || qty % 0.25 !== 0) return;
    setCartItems((prev) =>
      prev.map((item) =>
        item._id === id ? { ...item, quantity: parseFloat(qty) } : item
      )
    );
  };

  const handleDelete = (id) =>
    setCartItems((prev) => prev.filter((item) => item._id !== id));

  useEffect(() => {
    if (window.google) {
      const input = document.getElementById("autocomplete");
      const auto = new window.google.maps.places.Autocomplete(input);
      auto.addListener("place_changed", () => {
        const place = auto.getPlace();
        if (place.geometry) {
          const loc = place.geometry.location;
          const coords = { lat: loc.lat(), lng: loc.lng() };
          setCustomerCoords(coords); // ✅ Added
          setAddress(place.formatted_address);
          const service = new window.google.maps.DistanceMatrixService();
          service.getDistanceMatrix(
            {
              origins: [ORIGIN],
              destinations: [coords],
              travelMode: "DRIVING",
            },
            (res, status) => {
              if (status === "OK") {
                const dist = res.rows[0].elements[0].distance.text;
                setDistance(parseFloat(dist.replace(" km", "")));
                updateMap(coords);
              }
            }
          );
        }
      });
    }
  }, []);

  return (
    <div className="p-6 max-w-5xl mx-auto bg-white text-gray-800">
      <h2 className="text-3xl font-bold mb-6">🛒 Review Your Cart</h2>

      {cartItems.map((item) => (
        <div
          key={item._id}
          className="border p-4 rounded shadow mb-4 flex justify-between"
        >
          <div>
            <h3 className="text-xl font-semibold">{item.name}</h3>
            <p>₹{item.pricePerKg}/kg</p>
            <input
              type="number"
              min="0.25"
              step="0.25"
              value={item.quantity}
              onChange={(e) => handleQuantityChange(item._id, e.target.value)}
              className="border px-2 py-1 rounded mt-1 w-24"
            />
            {item.selectedSpecs?.length > 0 && (
              <p className="text-sm mt-1">
                Specs: {item.selectedSpecs.join(", ")}
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="text-lg font-bold">
              ₹{(item.pricePerKg * item.quantity).toFixed(2)}
            </p>
            <button
              onClick={() => handleDelete(item._id)}
              className="text-red-500 text-sm mt-2"
            >
              🗑️ Remove
            </button>
          </div>
        </div>
      ))}

      <input
        id="autocomplete"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        className="w-full border px-4 py-2 rounded mb-2"
        placeholder="Enter your delivery address"
      />

      <button
        onClick={handleLocation}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 mb-2"
      >
        📍 Use My Location
      </button>

      {distance > 0 && (
        <p className="text-green-600 text-sm mb-2">
          🚗 Distance: {distance.toFixed(2)} km
        </p>
      )}

      <div
        ref={mapRef}
        style={{ height: "300px", width: "100%", marginBottom: "20px" }}
      ></div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <select
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="border px-4 py-2 rounded"
        >
          <option value="">Select Delivery Date</option>
          {getDateOptions().map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>

        <select
          value={time}
          onChange={(e) => setTime(e.target.value)}
          className="border px-4 py-2 rounded"
        >
          <option value="">Select Time Slot</option>
          {getValidTimeSlots().map((t) => (
            <option key={t} value={t}>
              {t} - {parseInt(t) + 1}:00
            </option>
          ))}
        </select>
      </div>

      <div className="mb-4">
        <label className="mr-4">
          <input
            type="radio"
            name="pay"
            checked={paymentMethod === "COD"}
            onChange={() => setPaymentMethod("COD")}
          />{" "}
          Cash on Delivery
        </label>
        <label className="ml-4">
          <input
            type="radio"
            name="pay"
            checked={paymentMethod === "Online"}
            onChange={() => setPaymentMethod("Online")}
          />{" "}
          Pay Now 
        </label>
      </div>

      <div className="bg-gray-100 p-4 rounded text-sm mb-4">
        <p>Total Meat: ₹{meatTotal.toFixed(2)}</p>
        <p>Delivery: ₹{deliveryCharge}</p>
        <p className="font-bold text-lg mt-1">
          Total: ₹{paymentMethod === "COD" ? codTotal : rawTotal}
        </p>
      </div>

      <button
        onClick={handlePlaceOrder}
        className="bg-green-600 text-white w-full py-3 text-lg rounded hover:bg-green-700"
      >
        ✅ Place Order
      </button>
    </div>
  );
};

export default CartPage;
