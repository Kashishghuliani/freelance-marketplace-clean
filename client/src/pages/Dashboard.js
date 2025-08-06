import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FaPlus,
  FaSearch,
  FaTrashAlt,
  FaEdit,
  FaComments,
  FaEye,
  FaCheckCircle,
  FaTimesCircle,
} from "react-icons/fa";
import API from "../utils/api";
import ReviewForm from "../components/ReviewForm";
import ReviewList from "../components/ReviewList";

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [gigs, setGigs] = useState([]);
  const [orders, setOrders] = useState([]);
  const [reviews, setReviews] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return navigate("/login");

    const payload = JSON.parse(atob(token.split(".")[1]));
    setUser(payload);

    const fetchData = async () => {
      try {
        if (payload.role === "freelancer") {
          const res = await API.get("/gigs");
          const myGigs = res.data.filter(
            (gig) => gig.sellerId?._id === payload.id
          );
          setGigs(myGigs);
        }

        const orderRes = await API.get("/orders", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setOrders(orderRes.data);

        const reviewRes = await API.get("/reviews");
        setReviews(reviewRes.data);
      } catch (err) {
        console.error("❌ Dashboard load error:", err.response?.data || err.message);
      }
    };

    fetchData();
  }, [navigate]);

  // ✅ Cancel order for client
  const handleCancelOrder = async (orderId) => {
    if (!window.confirm("Cancel this order?")) return;
    try {
      const token = localStorage.getItem("token");
      await API.put(`/orders/cancel/${orderId}`, null, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders((prev) =>
        prev.map((order) =>
          order._id === orderId ? { ...order, status: "Cancelled" } : order
        )
      );
      alert("Order cancelled successfully.");
    } catch (err) {
      console.error("❌ Cancel order error:", err);
      alert("Failed to cancel order.");
    }
  };

  // ✅ Update order status (complete or reject)
  const handleUpdateOrderStatus = async (orderId, status) => {
    if (!window.confirm(`Are you sure you want to mark this order as ${status}?`)) return;
    try {
      const token = localStorage.getItem("token");

      let apiStatus = status;
      if (status === "Rejected") apiStatus = "Cancelled"; // Map rejected to Cancelled

      await API.put(`/orders/${apiStatus.toLowerCase()}/${orderId}`, null, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setOrders((prev) =>
        prev.map((order) =>
          order._id === orderId ? { ...order, status: apiStatus } : order
        )
      );
      alert(`Order marked as ${apiStatus}.`);
    } catch (err) {
      console.error("❌ Update order error:", err);
      alert("Failed to update order.");
    }
  };

  const handleDeleteGig = async (gigId) => {
    if (!window.confirm("Are you sure you want to delete this gig?")) return;
    try {
      const token = localStorage.getItem("token");
      await API.delete(`/gigs/${gigId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setGigs((prev) => prev.filter((gig) => gig._id !== gigId));
      alert("Gig deleted successfully.");
    } catch (err) {
      console.error("❌ Delete gig error:", err);
      alert("Failed to delete gig.");
    }
  };

  const hasReviewed = (orderId) => {
    return reviews.some((review) =>
      (review.orderId?._id || review.orderId)?.toString() === orderId
    );
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      {/* ✅ HEADER */}
      <header className="bg-gradient-to-r from-blue-950 to-blue-800 text-white py-8 shadow-xl">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-start sm:items-center">
          <div>
            <h1 className="text-4xl md:text-5xl font-black">
              Welcome,{" "}
              <span className="bg-gradient-to-r from-blue-300 to-blue-500 bg-clip-text text-transparent">
                {user.username}
              </span>
            </h1>
            <p className="mt-2 text-blue-100 text-lg font-light">
              Role: <span className="capitalize">{user.role}</span>
            </p>
          </div>
          {user.role === "client" && (
            <Link
              to="/gigs"
              className="mt-6 sm:mt-0 bg-white text-blue-700 font-semibold px-6 py-3 rounded-lg shadow-lg hover:bg-blue-50 transition flex items-center gap-2"
            >
              <FaSearch /> Browse Gigs
            </Link>
          )}
        </div>
      </header>

      {/* ✅ MAIN CONTENT */}
      <main className="max-w-7xl mx-auto p-6 space-y-16">

        {/* ✅ FREELANCER GIGS */}
        {user.role === "freelancer" && (
          <section>
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-extrabold text-blue-900">Your Gigs</h2>
              <Link
                to="/create-gig"
                className="hidden sm:flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white px-6 py-3 rounded-lg shadow-md transition"
              >
                <FaPlus /> Create Gig
              </Link>
            </div>

            {gigs.length > 0 ? (
              <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {gigs.map((gig) => (
                  <div key={gig._id} className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition overflow-hidden flex flex-col border border-blue-100">
                    {/* Gig Image */}
                    {gig.images?.length > 0 ? (
                      <img src={gig.images[0]} alt={gig.title} className="w-full h-44 object-cover" />
                    ) : (
                      <div className="w-full h-44 bg-blue-50 flex items-center justify-center text-blue-300">No Image</div>
                    )}

                    <div className="p-5 flex flex-col flex-grow">
                      <p className="font-semibold text-xl text-blue-900">{gig.title}</p>
                      <p className="text-blue-700 text-sm mt-2">${gig.price} • {gig.deliveryTime} day(s)</p>

                      <div className="flex gap-4 mt-4 text-lg justify-end border-t pt-3">
                        <Link to={`/gigs/${gig._id}`} className="text-blue-600 hover:text-blue-700" title="View Gig"><FaEye /></Link>
                        <Link to={`/edit-gig/${gig._id}`} className="text-yellow-500 hover:text-yellow-600" title="Edit Gig"><FaEdit /></Link>
                        <button onClick={() => handleDeleteGig(gig._id)} className="text-red-500 hover:text-red-600" title="Delete Gig"><FaTrashAlt /></button>
                      </div>

                      <div className="mt-5 border-t pt-4">
                        <h4 className="font-semibold text-blue-800 mb-3 text-sm uppercase">Client Reviews:</h4>
                        <ReviewList gigId={gig._id} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-blue-500 text-sm">You haven't created any gigs yet. Start by creating your first gig!</p>
            )}

            <Link to="/create-gig" className="fixed bottom-8 right-8 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white p-5 rounded-full shadow-xl sm:hidden transition hover:scale-105" title="Create Gig">
              <FaPlus size={22} />
            </Link>
          </section>
        )}

        {/* ✅ ORDERS SECTION */}
        <section>
          <h2 className="text-3xl font-extrabold text-blue-900 mb-6">Your Orders</h2>
          {orders.length > 0 ? (
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {orders.map((order) => (
                <div key={order._id} className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition p-6 border border-blue-100">
                  <p className="font-semibold text-blue-900 text-xl">{order.gigId?.title || "Deleted Gig"}</p>
                  <p className="text-blue-700 text-sm mt-2">Price: ${order.price}</p>
                  <p className="mt-3">
                    <strong>Status:</strong>{" "}
                    <span className={`inline-block px-2 py-1 text-xs rounded font-medium ${
                      order.status === "Cancelled"
                        ? "bg-red-100 text-red-600"
                        : order.status === "Completed"
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}>
                      {order.status}
                    </span>
                  </p>

                  <div className="mt-5 text-sm">
                    {user.role === "freelancer" ? (
                      <>
                        <p><strong>Client:</strong> {order.buyerId?.username || "N/A"}</p>
                        <div className="flex gap-4 mt-3 items-center">
                          <Link to={`/chat/${order.buyerId?._id}`} className="text-blue-600 flex items-center gap-1 hover:underline"><FaComments /> Message</Link>
                          {order.status === "Pending" && (
                            <div className="flex gap-3">
                              <button onClick={() => handleUpdateOrderStatus(order._id, "Completed")} className="text-green-600 hover:text-green-800 text-lg" title="Mark Completed"><FaCheckCircle /></button>
                              <button onClick={() => handleUpdateOrderStatus(order._id, "Rejected")} className="text-red-600 hover:text-red-800 text-lg" title="Reject Order"><FaTimesCircle /></button>
                            </div>
                          )}
                        </div>
                      </>
                    ) : (
                      <>
                        <p><strong>Seller:</strong> {order.sellerId?.username || "N/A"}</p>
                        <div className="flex gap-4 mt-3">
                          <Link to={`/chat/${order.sellerId?._id}`} className="text-blue-600 flex items-center gap-1 hover:underline"><FaComments /> Message</Link>
                          {order.status === "Pending" && (
                            <button onClick={() => handleCancelOrder(order._id)} className="text-red-600 hover:underline">Cancel Order</button>
                          )}
                        </div>

                        {/* ✅ Review Section for Client */}
                        {order.status === "Completed" && !hasReviewed(order._id) && (
                          <div className="mt-5 border-t pt-4">
                            <h4 className="text-lg font-semibold mb-3">Leave a Review</h4>
                            <ReviewForm gigId={order.gigId?._id} orderId={order._id} />
                          </div>
                        )}

                        {order.status === "Completed" && hasReviewed(order._id) && (
                          <p className="text-green-600 text-sm mt-3">⭐ You’ve submitted a review.</p>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-blue-500">No orders yet.</p>
          )}
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
