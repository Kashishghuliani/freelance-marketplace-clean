import React, { useState } from "react";
import axios from "axios";
import { FaStar } from "react-icons/fa"; // Make sure to install react-icons

const ReviewForm = ({ gigId, orderId }) => {
  const [desc, setDesc] = useState("");
  const [star, setStar] = useState(5);
  const [hover, setHover] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
await axios.post(
  "/api/reviews",
  { gigId, desc, star, orderId },
  {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }
);

      setSubmitted(true);
      setDesc("");
      setStar(5);
      setHover(0);
    } catch (err) {
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
