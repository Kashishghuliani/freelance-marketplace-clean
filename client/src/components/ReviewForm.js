import React, { useState } from "react";
import axios from "axios";
import { FaStar } from "react-icons/fa";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const ReviewForm = ({ gigId, orderId }) => {
  const [desc, setDesc] = useState("");
  const [star, setStar] = useState(0);
  const [hover, setHover] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // 🔍 Debug logs
    console.log("API_URL:", API_URL);
    console.log("Submitting Review Payload:", { gigId, orderId, desc, star });

    if (!gigId || !orderId) {
      alert("❌ gigId or orderId is missing! Check component props.");
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("❌ No auth token found in localStorage.");
        setLoading(false);
        return;
      }

      await axios.post(
        `${API_URL}/reviews`,
        { gigId, desc, star, orderId }, // ✅ sending gigId inside body
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setSubmitted(true);
      setDesc("");
      setStar(0);
      setHover(0);
    } catch (err) {
      console.error("Review Submit Error:", err.response || err);
      alert(err.response?.data?.message || "Error submitting review");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-lg mx-auto p-6 bg-white shadow-md rounded-lg space-y-4"
    >
      <h2 className="text-xl font-semibold text-gray-800">Leave a Review</h2>

      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((value) => (
          <FaStar
            key={value}
            size={24}
            className={`cursor-pointer transition ${
              (hover || star) >= value ? "text-yellow-400" : "text-gray-300"
            }`}
            onClick={() => setStar(value)}
            onMouseEnter={() => setHover(value)}
            onMouseLeave={() => setHover(0)}
          />
        ))}
      </div>

      <textarea
        value={desc}
        onChange={(e) => setDesc(e.target.value)}
        placeholder="Write your review..."
        required
        rows={4}
        className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
      />

      <button
        type="submit"
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
      >
        {loading ? "Submitting..." : "Submit Review"}
      </button>

      {submitted && (
        <p className="text-green-600 mt-2">✅ Review submitted successfully!</p>
      )}
    </form>
  );
};

export default ReviewForm;
