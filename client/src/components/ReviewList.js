import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaStar } from "react-icons/fa";

const ReviewList = ({ gigId }) => {
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const res = await axios.get(`/api/reviews/${gigId}`);
        setReviews(res.data);
      } catch (err) {
        console.error("Failed to load reviews:", err.response?.data || err);
      }
    };

    fetchReviews();
  }, [gigId]);

  return (
    <div className="max-w-2xl mx-auto my-6 p-4 bg-gray-50 rounded-lg shadow">
      <h3 className="text-xl font-bold text-gray-800 mb-4">⭐ User Reviews</h3>

      {reviews.length === 0 ? (
        <p className="text-gray-500 italic">No reviews yet. Be the first!</p>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div
              key={review._id}
              className="p-4 border rounded bg-white shadow-sm"
            >
              <div className="flex items-center gap-2 mb-2">
                {[1, 2, 3, 4, 5].map((val) => (
                  <FaStar
                    key={val}
                    size={18}
                    className={
                      review.star >= val ? "text-yellow-400" : "text-gray-300"
                    }
                  />
                ))}
                <span className="ml-2 text-sm text-gray-600">
                  {review.star} / 5
                </span>
              </div>
              <p className="text-gray-800">{review.desc}</p>
              {review.userId && (
                <p className="mt-1 text-sm text-gray-500">
                  – {review.userId.username || "User"}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReviewList;
