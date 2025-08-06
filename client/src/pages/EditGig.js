import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../utils/api";
import { AiOutlineLoading3Quarters } from "react-icons/ai";

const EditGig = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    price: "",
    deliveryTime: "",
    images: [],
  });

  const token = localStorage.getItem("token");

  // ✅ Fetch gig details
  useEffect(() => {
    const fetchGig = async () => {
      try {
        const res = await API.get(`/gigs/${id}`);
        setFormData({
          title: res.data.title,
          description: res.data.description,
          category: res.data.category,
          price: res.data.price,
          deliveryTime: res.data.deliveryTime,
          images: res.data.images || [],
        });
      } catch (err) {
        console.error(err);
        alert("Failed to fetch gig.");
        navigate("/dashboard");
      } finally {
        setLoading(false);
      }
    };

    fetchGig();
  }, [id, navigate]);

  // ✅ Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ✅ Handle update
  const handleUpdate = async (e) => {
    e.preventDefault();
    setUpdating(true);
    try {
      await API.put(`/gigs/${id}`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      alert("✅ Gig updated successfully!");
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      alert("❌ Update failed.");
    } finally {
      setUpdating(false);
    }
  };

  // ✅ Loading UI
  if (loading)
    return (
      <div className="flex justify-center items-center h-screen">
        <AiOutlineLoading3Quarters className="text-blue-600 animate-spin text-4xl" />
        <span className="ml-3 text-blue-700 font-semibold text-lg">
          Loading gig details...
        </span>
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex justify-center items-center p-6">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl p-8 border border-blue-100">
        {/* ✅ Header */}
        <h2 className="text-4xl font-extrabold text-center text-blue-900 mb-6">
          Edit Your <span className="bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">Gig</span>
        </h2>
        <p className="text-center text-blue-600 mb-8 text-sm">
          Update your gig details and keep your offerings up-to-date.
        </p>

        {/* ✅ Form */}
        <form onSubmit={handleUpdate} className="space-y-5">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-slate-700">Title</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Enter gig title"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-700">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe your gig in detail"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none h-28 resize-none"
              required
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-slate-700">Category</label>
            <input
              type="text"
              name="category"
              value={formData.category}
              onChange={handleChange}
              placeholder="e.g. Web Development"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* Price & Delivery Time (2 Columns) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Price ($)</label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                placeholder="Enter price"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Delivery Time (days)</label>
              <input
                type="number"
                name="deliveryTime"
                value={formData.deliveryTime}
                onChange={handleChange}
                placeholder="e.g. 3"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                required
              />
            </div>
          </div>

          {/* Images */}
          <div>
            <label className="block text-sm font-medium text-slate-700">Image URLs (comma separated)</label>
            <input
              type="text"
              name="images"
              value={formData.images.join(", ")}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  images: e.target.value.split(",").map((url) => url.trim()),
                }))
              }
              placeholder="https://example.com/img1.jpg, https://example.com/img2.jpg"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* ✅ Update Button */}
          <button
            type="submit"
            disabled={updating}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white py-3 rounded-lg flex justify-center items-center gap-2 font-semibold text-lg transition duration-200"
          >
            {updating ? (
              <>
                <AiOutlineLoading3Quarters className="animate-spin" />
                Updating...
              </>
            ) : (
              "Update Gig"
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default EditGig;
