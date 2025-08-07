// src/pages/Register.jsx

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import API from "../utils/api";

import {
  FaGlobe,
  FaComments,
  FaLock,
  FaChartLine,
  FaUserFriends,
  FaEye,
  FaEyeSlash,
} from "react-icons/fa";
import { HiLightBulb } from "react-icons/hi";
import { AiOutlineLoading3Quarters } from "react-icons/ai";

const schema = z
  .object({
    username: z.string().min(3, "Username must be at least 3 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
    role: z.enum(["freelancer", "client"], {
      required_error: "Please select a role",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

const Register = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
  } = useForm({ resolver: zodResolver(schema) });

  const selectedRole = watch("role");

  const onSubmit = async (data) => {
    try {
      const res = await API.post("/api/auth/register", data);
      localStorage.setItem("token", res.data.token);
      toast.success("Welcome to NovaBridge! Please verify your email.");
      navigate("/login");
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed");
    }
  };

  return (
    <div className="h-screen flex flex-col md:flex-row overflow-hidden">
      {/* Left Panel */}
      <div className="md:w-1/2 h-1/2 md:h-full flex items-center justify-center bg-gradient-to-br from-blue-950 to-blue-800 text-white p-8 md:p-20 relative">
        <div className="absolute top-0 left-0 h-full w-2 bg-gradient-to-b from-blue-400 to-blue-200 rounded-r-md" />
        <div className="w-full max-w-md space-y-8 relative z-10 animate-fade-in-up">
          <div className="text-center space-y-3">
            <h1 className="text-4xl sm:text-5xl font-black leading-tight tracking-tight">
              Welcome to{" "}
              <span className="bg-gradient-to-r from-blue-300 to-blue-500 bg-clip-text text-transparent">
                NovaBridge
              </span>
            </h1>
            <p className="text-blue-100 text-base sm:text-lg font-light">
              Your platform to discover talent, grow your skills, and deliver top-tier freelance services globally.
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl shadow-xl p-5 space-y-3 border-l-4 border-blue-400 pl-4">
            <h3 className="text-md font-semibold text-blue-200 flex items-center gap-2">
              <HiLightBulb className="text-yellow-300 text-xl" />
              Why NovaBridge?
            </h3>
            <ul className="space-y-2 text-sm text-blue-100">
              <li className="flex items-center gap-2">
                <FaGlobe className="text-blue-300" />
                <span>Connect with top global talent or clients instantly</span>
              </li>
              <li className="flex items-center gap-2">
                <FaComments className="text-green-300" />
                <span>Real-time, secure messaging for smooth collaboration</span>
              </li>
              <li className="flex items-center gap-2">
                <FaLock className="text-yellow-200" />
                <span>Payments with Stripe & escrow protection</span>
              </li>
              <li className="flex items-center gap-2">
                <FaChartLine className="text-purple-300" />
                <span>Track gigs, earnings, and reviews easily</span>
              </li>
              <li className="flex items-center gap-2">
                <FaUserFriends className="text-pink-300" />
                <span>Designed for freelancers & project owners</span>
              </li>
            </ul>
          </div>

          <p className="text-center text-sm text-blue-200 italic">
            Built for creators, dreamers, and remote teams everywhere.
          </p>
        </div>
      </div>

      {/* Right Panel */}
      <div className="md:w-1/2 h-1/2 md:h-full bg-white px-6 md:px-10 flex items-center justify-center relative">
        {selectedRole && (
          <div className="absolute top-6 right-6 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold shadow-sm">
            Role: {selectedRole}
          </div>
        )}

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="w-full max-w-md space-y-5"
        >
          <div className="text-center mb-4">
  <h2 className="text-3xl md:text-4xl font-extrabold text-blue-800 leading-snug">
    Create Your{" "}
    <span className="text-blue-600">NovaBridge</span> Account
  </h2>
            <p className="text-sm text-slate-500 mt-1">
              Join a platform built to connect, collaborate, and grow.
            </p>
          </div>

          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-slate-700">Username</label>
            <input
              {...register("username")}
              placeholder="e.g. nova_pro"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <p className="text-xs text-red-500">{errors.username?.message}</p>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-slate-700">Email</label>
            <input
              {...register("email")}
              type="email"
              placeholder="you@novabridge.com"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <p className="text-xs text-red-500">{errors.email?.message}</p>
          </div>

          {/* Password */}
          <div className="relative">
            <label className="block text-sm font-medium text-slate-700">Password</label>
            <input
              {...register("password")}
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <span
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-9 text-slate-500 cursor-pointer"
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
            <p className="text-xs text-slate-400">Minimum 6 characters</p>
            <p className="text-xs text-red-500">{errors.password?.message}</p>
          </div>

          {/* Confirm Password */}
          <div className="relative">
            <label className="block text-sm font-medium text-slate-700">Confirm Password</label>
            <input
              {...register("confirmPassword")}
              type={showConfirm ? "text" : "password"}
              placeholder="••••••••"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <span
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-4 top-9 text-slate-500 cursor-pointer"
            >
              {showConfirm ? <FaEyeSlash /> : <FaEye />}
            </span>
            <p className="text-xs text-red-500">{errors.confirmPassword?.message}</p>
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-slate-700">Your Role</label>
            <select
              {...register("role")}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">Choose a role</option>
              <option value="freelancer">Freelancer</option>
              <option value="client">Client</option>
            </select>
            <p className="text-xs text-red-500">{errors.role?.message}</p>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-md flex justify-center items-center gap-2 font-semibold transition duration-200"
          >
            {isSubmitting ? (
              <>
                <AiOutlineLoading3Quarters className="animate-spin" />
                Registering...
              </>
            ) : (
              "Register Now"
            )}
          </button>

          <p className="text-center text-sm text-slate-600">
            Already have an account?{" "}
            <a href="/login" className="text-blue-600 hover:underline font-medium">
              Login here
            </a>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Register;
