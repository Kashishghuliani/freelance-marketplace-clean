import React, { useEffect, useState } from "react";
import API from "../utils/api";
import { Link } from "react-router-dom";

const Home = () => {
  const [gigs, setGigs] = useState([]);
  const [allGigs, setAllGigs] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchGigs = async () => {
      try {
        const res = await API.get("/gigs");
        setGigs(res.data);
        setAllGigs(res.data); // Store original unfiltered data
      } catch (err) {
        console.error(err);
      }
    };
    fetchGigs();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setGigs(allGigs);
    } else {
      const filtered = allGigs.filter((gig) =>
        gig.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        gig.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setGigs(filtered);
    }
  }, [searchTerm, allGigs]);

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-3xl font-bold mb-6 text-center">Explore Gigs</h1>

      <div className="flex justify-center mb-6">
        <input
          type="text"
          placeholder="Search gigs by title or category..."
          className="w-full md:w-1/2 p-2 border border-gray-300 rounded"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {gigs.length > 0 ? (
          gigs.map((gig) => (
            <Link
              to={`/gigs/${gig._id}`}
              key={gig._id}
              className="bg-white rounded-lg shadow p-4 hover:shadow-lg transition"
            >
              <img
                src={gig.images[0] || "https://via.placeholder.com/300"}
                alt={gig.title}
                className="w-full h-40 object-cover rounded"
              />
              <h2 className="text-lg font-semibold mt-2">{gig.title}</h2>
              <p className="text-sm text-gray-600">{gig.category}</p>
              <p className="text-sm text-gray-600">By: {gig.sellerId?.username || "Freelancer"}</p>
              <p className="text-blue-600 font-bold mt-1">${gig.price}</p>
            </Link>
          ))
        ) : (
          <p className="text-center col-span-3">No gigs found.</p>
        )}
      </div>
    </div>
  );
};

export default Home;
