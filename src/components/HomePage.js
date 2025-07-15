import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API =  process.env.REACT_APP_BACKEND_URL +"/api/meats";

const HomePage = ({ cartItems, setCartItems, phone, setPhone }) => {
  const [meats, setMeats] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [quantityMap, setQuantityMap] = useState({});
  const [specsMap, setSpecsMap] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get(API)
      .then((res) => setMeats(res.data))
      .catch((err) => console.error("Failed to fetch meats", err));
  }, []);

  const handleAddToCart = (meatId) => {
    if (!phone.match(/^\d{10}$/)) {
      alert("Please enter a valid 10-digit phone number.");
      return;
    }

    const meat = meats.find((m) => m._id === meatId);
    const quantity = parseFloat(quantityMap[meatId]);
    const selectedSpecs = specsMap[meatId] || [];

    if (!quantity || quantity < 0.25 || quantity % 0.25 !== 0) {
      alert("Quantity must be in multiples of 0.25 kg.");
      return;
    }

    const item = { ...meat, quantity, selectedSpecs };
    setCartItems((prev) => [...prev, item]);
    alert(`${meat.name} added to cart`);
  };

  const handleSpecChange = (meatId, spec) => {
    const current = specsMap[meatId] || [];
    const updated = current.includes(spec)
      ? current.filter((s) => s !== spec)
      : [...current, spec];
    setSpecsMap({ ...specsMap, [meatId]: updated });
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      {/* 🔻 Header */}
      <header className="flex justify-between items-center px-6 py-4 shadow bg-white">
        <h1 className="text-3xl font-bold text-red-600">🥩 FreshFlesh</h1>

        <div className="flex items-center gap-4">
          {/* 📞 Phone input */}
          <input
            type="text"
            maxLength={10}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="border px-3 py-2 rounded"
            placeholder="Enter phone number"
          />

          {/* 🛒 Cart */}
          <button
            onClick={() => navigate("/cart")}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            🛒 Cart ({cartItems.length})
          </button>

          {/* 👤 Dropdown */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300"
            >
              👤 Account
            </button>
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 bg-white border rounded shadow z-10 w-44">
                <a
                  href="/admin/login"
                  className="block px-4 py-2 hover:bg-gray-100 text-sm"
                >
                  🔐 Admin Login
                </a>
                <a
                  href="/butcher/signup"
                  className="block px-4 py-2 hover:bg-gray-100 text-sm"
                >
                  🪓 Butcher Signup
                </a>
                <a
                  href="/butcher/login"
                  className="block px-4 py-2 hover:bg-gray-100 text-sm"
                >
                  🔑 Butcher Login
                </a>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 🧺 Meat Cards */}
      <main className="p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {meats.map((meat) => (
          <div
            key={meat._id}
            className="bg-white rounded-xl shadow-md p-4 hover:shadow-lg border"
          >
            {meat.image ? (
              <img
                src={meat.image}
                alt={meat.name}
                className="w-full h-48 object-cover rounded mb-3"
              />
            ) : (
              <div className="w-full h-48 bg-gray-200 flex items-center justify-center text-gray-500 rounded mb-3">
                No Image Available
              </div>
            )}
            <h3 className="text-xl font-bold">{meat.name}</h3>
            <p className="text-gray-600 text-sm mb-2">₹{meat.pricePerKg}/kg</p>

            {/* Specs */}
            {meat.specs?.length > 0 && (
              <div className="mb-2 text-sm text-gray-700">
                {meat.specs.map((spec) => (
                  <label key={spec} className="mr-3 inline-flex items-center">
                    <input
                      type="checkbox"
                      onChange={() => handleSpecChange(meat._id, spec)}
                      checked={(specsMap[meat._id] || []).includes(spec)}
                      className="mr-1"
                    />
                    {spec}
                  </label>
                ))}
              </div>
            )}

            {/* Quantity */}
            <input
              type="number"
              step="0.25"
              min="0.25"
              placeholder="kg"
              value={quantityMap[meat._id] || ""}
              onChange={(e) =>
                setQuantityMap({ ...quantityMap, [meat._id]: e.target.value })
              }
              className="border px-2 py-1 rounded w-full mb-2"
            />

            {/* Add to Cart */}
            <button
              onClick={() => handleAddToCart(meat._id)}
              className="bg-green-600 w-full text-white py-2 rounded hover:bg-green-700"
            >
              ➕ Add to Cart
            </button>
          </div>
        ))}
      </main>
    </div>
  );
};

export default HomePage;
