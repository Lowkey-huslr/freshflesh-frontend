import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const ButcherSignup = () => {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    password: "",
    shopLocation: "",
  });

  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await axios.post( process.env.REACT_APP_BACKEND_URL +"/api/butcher/signup", formData);
      alert("✅ Signup successful!");
      navigate("/butcher/login");
    } catch (err) {
      setError(err.response?.data?.msg || "Signup failed");
    }
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-gray-100">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4 text-center">🪓 Butcher Signup</h2>

        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

        <input
          type="text"
          name="name"
          placeholder="Full Name"
          value={formData.name}
          onChange={handleChange}
          required
          className="mb-3 w-full px-3 py-2 border rounded"
        />
        <input
          type="text"
          name="phone"
          placeholder="Phone (10 digits)"
          value={formData.phone}
          onChange={handleChange}
          required
          className="mb-3 w-full px-3 py-2 border rounded"
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          required
          className="mb-3 w-full px-3 py-2 border rounded"
        />
        <input
          type="text"
          name="shopLocation"
          placeholder="Shop Location"
          value={formData.shopLocation}
          onChange={handleChange}
          required
          className="mb-4 w-full px-3 py-2 border rounded"
        />

        <button type="submit" className="w-full bg-red-600 text-white py-2 rounded hover:bg-red-700">
          Signup
        </button>
      </form>
    </div>
  );
};

export default ButcherSignup;
