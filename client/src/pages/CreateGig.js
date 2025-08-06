import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import API from "../utils/api";
import { useNavigate } from "react-router-dom";
import { AiOutlineLoading3Quarters } from "react-icons/ai";

const gigSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  category: z.string().min(3, "Category is required"),
  price: z
    .number({ invalid_type_error: "Price must be a number" })
    .min(1, "Price must be at least $1"),
  deliveryTime: z
    .number({ invalid_type_error: "Delivery time must be a number" })
    .min(1, "Must deliver in at least 1 day"),
  images: z
    .string()
    .url("Image URL must be valid")
    .array()
    .nonempty("At least one image is required"),
});

const CreateGig = () => {
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(gigSchema),
    defaultValues: {
      images: [],
    },
  });

  const onSubmit = async (data) => {
    try {
      const token = localStorage.getItem("token");
      await API.post("/gigs", data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      alert("✅ Gig created successfully!");
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "❌ Failed to create gig");
    }
  };

  // Handle images input
  const handleImageChange = (e) => {
    const urls = e.target.value.split(",").map((url) => url.trim());
    setValue("images", urls);
  };

  return (
    <div className="h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center px-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl p-6 border border-blue-100 flex flex-col h-[90vh]">
        {/* Header */}
        <div className="text-center mb-4">
          <h2 className="text-3xl font-extrabold text-blue-900">
            Create a{" "}
            <span className="bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
              NovaBridge
            </span>{" "}
            Gig
          </h2>
          <p className="text-blue-600 text-sm mt-2">
            Fill in the details below to publish your gig.
          </p>
        </div>

        {/* Scrollable Form */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex-1 overflow-y-auto space-y-4 pr-1"
        >
          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-slate-700">
              Title
            </label>
            <input
              {...register("title")}
              placeholder="Enter your gig title"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            />
            <p className="text-red-500 text-xs mt-1">{errors.title?.message}</p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-slate-700">
              Description
            </label>
            <textarea
              {...register("description")}
              placeholder="Describe your gig in detail"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm h-20 resize-none"
            />
            <p className="text-red-500 text-xs mt-1">
              {errors.description?.message}
            </p>
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-medium text-slate-700">
              Category
            </label>
            <input
              {...register("category")}
              placeholder="e.g. Web Development"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            />
            <p className="text-red-500 text-xs mt-1">
              {errors.category?.message}
            </p>
          </div>

          {/* Price */}
          <div>
            <label className="block text-xs font-medium text-slate-700">
              Price ($)
            </label>
            <input
              {...register("price", { valueAsNumber: true })}
              type="number"
              placeholder="Enter price"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            />
            <p className="text-red-500 text-xs mt-1">{errors.price?.message}</p>
          </div>

          {/* Delivery Time */}
          <div>
            <label className="block text-xs font-medium text-slate-700">
              Delivery Time (in days)
            </label>
            <input
              {...register("deliveryTime", { valueAsNumber: true })}
              type="number"
              placeholder="e.g. 3"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            />
            <p className="text-red-500 text-xs mt-1">
              {errors.deliveryTime?.message}
            </p>
          </div>

          {/* Images */}
          <div>
            <label className="block text-xs font-medium text-slate-700">
              Image URLs (comma separated)
            </label>
            <input
              {...register("images")}
              placeholder="https://example.com/img1.jpg, https://example.com/img2.jpg"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              onBlur={handleImageChange}
            />
            <p className="text-red-500 text-xs mt-1">
              {errors.images?.message}
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white py-2.5 rounded-lg flex justify-center items-center gap-2 font-semibold text-base transition duration-200"
          >
            {isSubmitting ? (
              <>
                <AiOutlineLoading3Quarters className="animate-spin" />
                Creating Gig...
              </>
            ) : (
              "Create Gig"
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateGig;
