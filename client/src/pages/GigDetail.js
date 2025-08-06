import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import API from "../utils/api";
import ReviewList from "../components/ReviewList";
import ReviewForm from "../components/ReviewForm";
import { AiOutlineLoading3Quarters } from "react-icons/ai";

const GigDetail = () => {
  const { id } = useParams();
  const [gig, setGig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [eligibleOrderId, setEligibleOrderId] = useState(null);
  const [hasReviewed, setHasReviewed] = useState(false);

  const token = localStorage.getItem("token");
  const payload = token ? JSON.parse(atob(token.split(".")[1])) : null;
  const isClient = payload?.role === "client";

  // ✅ Fetch gig details
  useEffect(() => {
    const fetchGig = async () => {
      try {
        const res = await API.get(`/gigs/${id}`);
        setGig(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchGig();
  }, [id]);

  // ✅ Fetch orders and check review eligibility
  useEffect(() => {
    const fetchOrdersAndReviewStatus = async () => {
      if (!isClient || !id) return;
      try {
        const res = await API.get("/orders", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const completedOrders = res.data.filter(
          (order) => order.gigId === id && order.status === "completed"
        );

        if (completedOrders.length > 0) {
          setEligibleOrderId(completedOrders[0]._id);
        }

        const reviewCheck = await API.get(`/reviews/has-reviewed/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setHasReviewed(reviewCheck.data.hasReviewed);
      } catch (err) {
        console.error(err);
      }
    };

    fetchOrdersAndReviewStatus();
  }, [id, isClient, token]);

  const handlePurchase = async () => {
    if (!isClient) {
      alert("Only clients can purchase gigs");
      return;
    }

    try {
      const res = await API.post(
        "/orders/create-checkout-session",
        { gigId: gig._id },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      window.location.href = res.data.url;
    } catch (err) {
      console.error(err);
      alert("Stripe checkout failed");
    }
  };

  // ✅ Loading State
  if (loading)
    return (
      <div className="flex justify-center items-center h-screen">
        <AiOutlineLoading3Quarters className="text-blue-600 animate-spin text-4xl" />
        <span className="ml-3 text-blue-700 font-semibold text-lg">
          Loading gig details...
        </span>
      </div>
    );

  // ✅ If no gig found
  if (!gig)
    return (
      <p className="text-center mt-10 text-gray-600 font-medium text-lg">
        Gig not found.
      </p>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white px-4 py-6 flex justify-center">
      <div className="w-full max-w-5xl bg-white shadow-xl rounded-2xl border border-blue-100 p-6 md:p-8">
        {/* ✅ Gig Image */}
        <div className="relative">
          <img
            src={gig.images[0] || "https://via.placeholder.com/600"}
            alt={gig.title}
            className="w-full h-56 sm:h-72 lg:h-96 object-cover rounded-xl"
          />
        </div>

        {/* ✅ Gig Info Section */}
        <div className="mt-6">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-blue-900">
            {gig.title}
          </h1>
          <p className="text-gray-500 mt-2 text-sm sm:text-base">
            Category:{" "}
            <span className="font-semibold text-blue-700">
              {gig.category}
            </span>
          </p>
          <p className="text-gray-700 mt-4 text-sm sm:text-base leading-relaxed">
            {gig.description}
          </p>
        </div>

        {/* ✅ Seller & Price Info */}
        <div className="mt-6 bg-blue-50 border border-blue-100 rounded-lg p-4 sm:p-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-6">
          <div>
            <p className="text-gray-700 text-sm sm:text-base">
              <strong>Seller:</strong>{" "}
              {gig.sellerId?.username || "Unknown"}
            </p>
            <p className="text-gray-700 text-sm sm:text-base">
              <strong>Delivery:</strong> {gig.deliveryTime} day(s)
            </p>
          </div>
          <div className="text-right">
            <p className="text-xl sm:text-2xl font-extrabold text-blue-600">
              ${gig.price}
            </p>
            {isClient && (
              <button
                onClick={handlePurchase}
                className="mt-3 sm:mt-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white px-6 py-2 rounded-lg font-semibold transition-all duration-200 shadow-md w-full sm:w-auto"
              >
                Purchase Now
              </button>
            )}
          </div>
        </div>

        {/* ✅ Reviews Section */}
        <div className="mt-10">
          <h2 className="text-xl sm:text-2xl font-bold text-blue-900 mb-4">
            Reviews
          </h2>
          <ReviewList gigId={gig._id} />
        </div>

        {/* ✅ Show review form if eligible */}
        {isClient && eligibleOrderId && !hasReviewed && (
          <div className="mt-8">
            <ReviewForm gigId={gig._id} orderId={eligibleOrderId} />
          </div>
        )}
      </div>
    </div>
  );
};

export default GigDetail;
