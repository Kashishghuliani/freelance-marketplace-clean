import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../utils/api";
import { AiOutlineLoading3Quarters } from "react-icons/ai";

const GigsPage = () => {
  const [gigs, setGigs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGigs = async () => {
      try {
        const res = await API.get("/gigs");
        setGigs(res.data);
      } catch (err) {
        console.error("Error fetching gigs:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchGigs();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="text-center mb-10">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-blue-900">
          Explore Gigs on{" "}
          <span className="bg-gradient-to-r from-blue-500 to-blue-700 bg-clip-text text-transparent">
            NovaBridge
          </span>
        </h1>
        <p className="text-gray-600 mt-2 text-sm sm:text-base">
          Find top freelancers and unique services tailored for your projects.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-16">
          <AiOutlineLoading3Quarters className="text-blue-600 animate-spin text-3xl" />
          <span className="ml-3 text-blue-700 font-medium">Loading gigs...</span>
        </div>
      ) : gigs.length === 0 ? (
        <p className="text-center text-gray-500 text-lg">
          No gigs available at the moment. Please check back later.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {gigs.map((gig) => (
            <div
              key={gig._id}
              className="bg-white rounded-xl shadow hover:shadow-lg transition p-4 border border-gray-100 flex flex-col"
            >
              <img
                src={gig.images?.[0] || "https://via.placeholder.com/400"}
                alt={gig.title}
                className="w-full h-48 object-cover rounded-lg mb-4"
              />
              <h2 className="text-lg font-bold text-blue-800 mb-1">{gig.title}</h2>
              <p className="text-gray-600 text-sm mb-2">
                {gig.description.slice(0, 80)}...
              </p>
              <p className="text-xs text-gray-500">
                Delivery in <span className="font-medium">{gig.deliveryTime}</span> day(s)
              </p>
              <div className="flex items-center justify-between mt-3">
                <p className="text-blue-600 font-semibold text-lg">${gig.price}</p>
                <Link
                  to={`/gigs/${gig._id}`}
                  className="text-sm text-blue-600 font-medium hover:underline"
                >
                  View Details →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GigsPage;
