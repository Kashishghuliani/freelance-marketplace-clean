// src/pages/ReviewPage.js
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import ReviewForm from "../components/ReviewForm";
import API from "../utils/api";

const ReviewPage = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);

  useEffect(() => {
    const fetchOrder = async () => {
      const token = localStorage.getItem("token");
      const res = await API.get(`/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrder(res.data);
    };

    fetchOrder();
  }, [orderId]);

  if (!order) return <p>Loading...</p>;

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-4">Leave a Review for: {order.gigId?.title}</h1>
      <ReviewForm gigId={order.gigId?._id} orderId={order._id} />

    </div>
  );
};

export default ReviewPage;
