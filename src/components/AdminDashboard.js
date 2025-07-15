import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API =  process.env.REACT_APP_BACKEND_URL +"/api/meats";
const PAYMENT_API =  process.env.REACT_APP_BACKEND_URL +"/api/admin/payment-pending";
const CONFIRM_API =  process.env.REACT_APP_BACKEND_URL +"/api/admin/confirm-payment";
const ORDERS_API =  process.env.REACT_APP_BACKEND_URL +"/api/admin/orders";
const BUTCHERS_API =  process.env.REACT_APP_BACKEND_URL +"/api/admin/butchers";
const ASSIGN_API =  process.env.REACT_APP_BACKEND_URL +"/api/admin/assign-butcher";
const DELETE_BUTCHER_API =  process.env.REACT_APP_BACKEND_URL +"/api/admin/butcher"; // 👈 fixed path
const UPDATE_ORDER_API =  process.env.REACT_APP_BACKEND_URL +"/api/admin/order-status";
const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("meats");
  const [meats, setMeats] = useState([]);
  const [pendingPayments, setPendingPayments] = useState([]);
  const [orders, setOrders] = useState([]);
  const [butchers, setButchers] = useState([]);
  const [newMeat, setNewMeat] = useState({
    name: "",
    pricePerKg: "",
    image: "",
    specs: "",
  });

  const [dateFilter, setDateFilter] = useState({
    from: "",
    to: "",
  });

  
  useEffect(() => { 
    
    const isLoggedIn = localStorage.getItem("isAdminLoggedIn");
  if (!isLoggedIn) {
    navigate("/admin/login");
    return;
  }


    fetchMeats();
    fetchPendingPayments();
    fetchOrders();
    fetchButchers();
  }, [navigate]);

  const fetchMeats = async () => {
    const res = await axios.get(API);
    setMeats(res.data);
  };

  const fetchPendingPayments = async () => {
    const res = await axios.get(PAYMENT_API);
    setPendingPayments(res.data);
  };

  const fetchOrders = async () => {
    const res = await axios.get(ORDERS_API);
    setOrders(res.data);
  };

  const fetchButchers = async () => {
    const res = await axios.get(BUTCHERS_API);
    setButchers(res.data);
  };

  const handleLogout = () => {
    localStorage.removeItem("isAdminLoggedIn");
    navigate("/");
  };

  const handleConfirmPayment = async (phone) => {
    await axios.post(`${CONFIRM_API}/${phone}`);
    fetchPendingPayments();
    fetchOrders();
  };

  const handleAssignButcher = async (orderId, butcherId) => {
    await axios.post(ASSIGN_API, { orderId, butcherId });
    fetchOrders();
  };

  const handleAddMeat = async () => {
    const { name, pricePerKg, image, specs } = newMeat;
    if (!name || !pricePerKg) return alert("Name and price are required");

    await axios.post(API, {
      name,
      pricePerKg,
      image,
      specs: specs.split(",").map((s) => s.trim()),
      isAdmin: true,
    });

    setNewMeat({ name: "", pricePerKg: "", image: "", specs: "" });
    fetchMeats();
  };

  const handleDeleteMeat = async (id) => {
    if (window.confirm("Delete this meat item?")) {
      await axios.delete(`${API}/${id}`);
      fetchMeats();
    }
  };

  const handleDeleteButcher = async (butcherId) => {
  if (window.confirm("Remove this butcher?")) {
    await axios.delete(`${DELETE_BUTCHER_API}/${butcherId}`);
    fetchButchers();
  }
};


  const handleCheckboxChange = async (order, field) => {
  const payload = {};

  if (field === "paymentStatus") {
    payload.paymentStatus = order.paymentStatus === "Done" ? "Pending" : "Done";
  }

  if (field === "deliveryStatus") {
    payload.deliveryStatus = order.deliveryStatus === "Delivered" ? "Pending" : "Delivered";
  }

  try {
    await axios.patch(`${UPDATE_ORDER_API}/${order._id}`, payload);
    fetchOrders();
  } catch (err) {
    console.error("❌ Failed to update order status", err);
  }
};


  const filteredOrders = orders
    .filter((order) => {
      const orderDate = new Date(order.createdAt);
      const from = dateFilter.from ? new Date(dateFilter.from) : null;
      const to = dateFilter.to ? new Date(dateFilter.to) : null;

      return (!from || orderDate >= from) && (!to || orderDate <= to);
    })
    .sort((a, b) => {
      const aComplete =
        a.paymentStatus === "Done" && a.deliveryStatus === "Delivered";
      const bComplete =
        b.paymentStatus === "Done" && b.deliveryStatus === "Delivered";
      return aComplete - bComplete;
    });

  const renderDashboardTab = () => (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-red-600 mb-4">📊 Dashboard Summary</h2>
      <p>Total Orders: {orders.length}</p>
      <p>Total Meats: {meats.length}</p>
      <p>Total Butchers: {butchers.length}</p>
      <p>Pending Payments: {pendingPayments.length}</p>
    </div>
  );

  const renderButchersTab = () => (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-red-600 mb-4">👨‍🍳 Registered Butchers</h2>
      {butchers.length === 0 ? (
        <p className="text-gray-500">No butchers registered yet.</p>
      ) : (
        <ul className="space-y-3">
          {butchers.map((butcher) => (
            <li key={butcher._id} className="bg-white p-4 border rounded shadow flex justify-between items-center">
              <div>
                <p><strong>Name:</strong> {butcher.name}</p>
                <p><strong>Shop Location:</strong> {butcher.shopLocation}</p>
              </div>
              <button
                onClick={() => handleDeleteButcher(butcher._id)}
                className="bg-red-600 text-white px-4 py-1 rounded hover:bg-red-700"
              >
                ❌ Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  const renderOrdersTab = () => (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-red-600 mb-4">📦 Customer Orders</h2>

      <div className="mb-4 flex flex-wrap gap-4">
        <input
          type="date"
          value={dateFilter.from}
          onChange={(e) => setDateFilter({ ...dateFilter, from: e.target.value })}
          className="border p-2 rounded"
        />
        <input
          type="date"
          value={dateFilter.to}
          onChange={(e) => setDateFilter({ ...dateFilter, to: e.target.value })}
          className="border p-2 rounded"
        />
      </div>

      {filteredOrders.length === 0 ? (
        <p className="text-gray-500">No orders match the filter.</p>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <div key={order._id} className="bg-white p-4 border rounded shadow">
              <p><strong>📞 Phone:</strong> {order.customerPhone}</p>
              <p><strong>📍 Address:</strong> {order.customerAddress || "N/A"}</p>
              <p><strong>🕒 Ordered At:</strong> {new Date(order.createdAt).toLocaleString()}</p>
              <p><strong>🚚 Delivery:</strong> {order.deliveryDate} at {order.deliveryTime}</p>
              <p><strong>📦 Total:</strong> ₹{order.totalAmount}</p>
              <p><strong>💳 Payment:</strong> {order.paymentMethod}</p>
              <p><strong>Status:</strong> {order.paymentStatus}</p>
              <p><strong>🛒 Items:</strong></p>
              <ul className="list-disc pl-6 text-sm">
                {order.cart?.length > 0 ? (
                  order.cart.map((item, idx) => (
                    <li key={idx}>
                      {item.name} - {item.quantity}kg @ ₹{item.pricePerKg}/kg
                    </li>
                  ))
                ) : (
                  <li>No items in cart</li>
                )}
              </ul>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Assign Butcher:</label>
                  <select
                    className="border p-1 rounded w-full"
                    value={order.assignedButcher || ""}
                    onChange={(e) => handleAssignButcher(order._id, e.target.value)}
                  >
                    <option value="">-- Select Butcher --</option>
                    {butchers.map((b) => (
                      <option key={b._id} value={b._id}>{b.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={order.paymentStatus === "Done"}
                    onChange={() => handleCheckboxChange(order, "paymentStatus")}
                  />
                  <label>✅ Payment Done</label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={order.deliveryStatus === "Delivered"}
                    onChange={() => handleCheckboxChange(order, "deliveryStatus")}
                  />
                  <label>📦 Delivered</label>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderPaymentsTab = () => (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-red-600 mb-4">Pending UPI Payments</h2>
      <button onClick={fetchPendingPayments} className="mb-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">🔄 Refresh</button>

      {pendingPayments.length === 0 ? (
        <p className="text-gray-500">✅ No pending UPI payments.</p>
      ) : (
        <div className="space-y-4">
          {pendingPayments.map((order) => (
            <div key={order._id} className="p-4 bg-white border rounded shadow flex justify-between items-center">
              <div>
                <p><strong>📞 Phone:</strong> {order.customerPhone}</p>
                <p><strong>📍 Address:</strong> {order.customerAddress}</p>
                <p><strong>💰 Amount:</strong> ₹{order.grandTotal}</p>
                <p><strong>📦 Items:</strong> {order.items.length} items</p>
              </div>
              <button onClick={() => handleConfirmPayment(order.customerPhone)} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">✅ Confirm</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderMeatsTab = () => (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-red-600 mb-4">Manage Meats</h2>

      <div className="bg-white p-4 rounded-lg shadow border mb-6">
        <h3 className="text-lg font-semibold mb-2 text-gray-700">Add New Meat</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input type="text" placeholder="Meat Name" value={newMeat.name} onChange={(e) => setNewMeat({ ...newMeat, name: e.target.value })} className="border p-2 rounded" />
          <input type="number" placeholder="Price per Kg" value={newMeat.pricePerKg} onChange={(e) => setNewMeat({ ...newMeat, pricePerKg: e.target.value })} className="border p-2 rounded" />
          <input type="text" placeholder="Image URL (optional)" value={newMeat.image} onChange={(e) => setNewMeat({ ...newMeat, image: e.target.value })} className="border p-2 rounded" />
          <input type="text" placeholder="Specifications (comma-separated)" value={newMeat.specs} onChange={(e) => setNewMeat({ ...newMeat, specs: e.target.value })} className="border p-2 rounded" />
        </div>
        <button onClick={handleAddMeat} className="mt-4 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">➕ Add Meat</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {meats.map((meat) => (
          <div key={meat._id} className="bg-white p-4 rounded-xl shadow hover:shadow-md border border-gray-100">
            {meat.image && <img src={meat.image} alt={meat.name} className="w-full h-40 object-cover rounded mb-2" />}
            <h3 className="text-xl font-bold text-gray-800">{meat.name}</h3>
            <p className="text-sm text-gray-600">₹{meat.pricePerKg}/kg</p>
            {meat.specs?.length > 0 && (
              <ul className="mt-2 text-sm text-gray-500 list-disc pl-5">
                {meat.specs.map((s, idx) => (
                  <li key={idx}>{s}</li>
                ))}
              </ul>
            )}
            <button onClick={() => handleDeleteMeat(meat._id)} className="mt-4 bg-red-600 text-white w-full py-2 rounded hover:bg-red-700">❌ Delete</button>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="w-64 bg-white border-r shadow-sm">
        <div className="p-6 border-b">
          <h2 className="text-2xl font-extrabold text-red-600">FreshFlesh</h2>
          <p className="text-sm text-gray-400">Admin Panel</p>
        </div>
        <nav className="p-4 space-y-3">
          {[
            { key: "dashboard", label: "🏠 Dashboard" },
            { key: "meats", label: "🍖 Manage Meats" },
            { key: "butchers", label: "👨‍🍳 Manage Butchers" },
            { key: "orders", label: "📦 View Orders" },
            { key: "payments", label: "✅ Confirm Payments" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`w-full text-left py-2 px-4 rounded-xl ${
                activeTab === tab.key
                  ? "bg-red-100 text-red-700 font-semibold"
                  : "hover:bg-gray-100 text-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
          <button
            onClick={handleLogout}
            className="w-full text-left py-2 px-4 rounded-xl hover:bg-red-100 text-red-600 font-semibold"
          >
            🚪 Logout
          </button>
        </nav>
      </aside>

      <main className="flex-1 bg-gray-50">
        {activeTab === "dashboard"
          ? renderDashboardTab()
          : activeTab === "meats"
          ? renderMeatsTab()
          : activeTab === "butchers"
          ? renderButchersTab()
          : activeTab === "orders"
          ? renderOrdersTab()
          : activeTab === "payments"
          ? renderPaymentsTab()
          : <div className="p-6 text-gray-500">Other tabs coming soon.</div>}
      </main>
    </div>
  );
};

export default AdminDashboard;
