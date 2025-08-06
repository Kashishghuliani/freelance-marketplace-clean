import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import API from "../utils/api";

const Success = () => {
  const [searchParams] = useSearchParams();
  const gigId = searchParams.get("gigId");
  const sessionId = searchParams.get("session_id");
  const navigate = useNavigate();

  const [status, setStatus] = useState("Processing your order...");

  useEffect(() => {
    const createOrder = async () => {
      const token = localStorage.getItem("token");
      if (!token || !gigId || !sessionId) {
        setStatus("Invalid session or not logged in.");
        return;
      }

      try {
        const gigRes = await API.get(`/gigs/${gigId}`);
        const gig = gigRes.data;

        // Decode token to extract buyerId from payload (not sent to backend!)
        const payload = JSON.parse(atob(token.split(".")[1]));
        const buyerId = payload.id;

        const orderPayload = {
          sellerId: gig.sellerId._id,
          gigId,
          price: gig.price,
          // 👇 NOT required if backend pulls from token
          // buyerId,
        };

        // 👇 FIX this line
const res = await API.post("/orders/create", orderPayload, {

          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        console.log("✅ Order created:", res.data);

        setStatus("✅ Order created successfully! Redirecting...");
        setTimeout(() => navigate("/dashboard"), 2000);
      } catch (err) {
        console.error("❌ Error creating order:", err.response?.data || err.message || err);
        setStatus("❌ Failed to create order. Please try again.");
      }
    };

    createOrder();
  }, [gigId, sessionId, navigate]);

  return (
    <div className="text-center mt-10">
      <h1 className="text-3xl font-bold text-green-600">Payment Successful 🎉</h1>
      <p className="mt-4 text-lg">{status}</p>
      <button
        onClick={() => navigate("/dashboard")}
        className="mt-6 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Go to Dashboard
      </button>
    </div>
  );
};

export default Success;
