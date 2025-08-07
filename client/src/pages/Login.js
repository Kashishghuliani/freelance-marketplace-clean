// src/pages/Login.jsx

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import API from "../utils/api";

import { FaEye, FaEyeSlash, FaRocket, FaSignInAlt } from "react-icons/fa";
import { AiOutlineLoading3Quarters } from "react-icons/ai";

const schema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const Login = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (data) => {
    try {
      const res = await API.post("/api/auth/login", data);
      localStorage.setItem("token", res.data.token);
      toast.success("Login successful!");
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="h-screen flex flex-col md:flex-row overflow-hidden">
      {/* Left Panel (Login-specific) */}
      <div className="md:w-1/2 h-1/2 md:h-full flex items-center justify-center bg-gradient-to-br from-blue-950 to-blue-800 text-white p-8 md:p-20 relative">
        <div className="absolute top-0 left-0 h-full w-2 bg-gradient-to-b from-blue-400 to-blue-200 rounded-r-md" />
        <div className="w-full max-w-md space-y-8 relative z-10 animate-fade-in-up">
          <div className="text-center space-y-3">
            <h1 className="text-4xl sm:text-5xl font-black leading-tight tracking-tight">
              Welcome Back to{" "}
              <span className="bg-gradient-to-r from-blue-300 to-blue-500 bg-clip-text text-transparent">
                NovaBridge
              </span>
            </h1>
            <p className="text-blue-100 text-base sm:text-lg font-light">
              Login to manage your gigs, messages, and collaborations on the go.
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl shadow-xl p-5 space-y-3 border-l-4 border-blue-400 pl-4">
            <h3 className="text-md font-semibold text-blue-200 flex items-center gap-2">
              <FaRocket className="text-yellow-300" />
              NovaBridge Perks
            </h3>
            <ul className="space-y-2 text-sm text-blue-100">
              <li className="flex items-center gap-2">
                <FaSignInAlt className="text-green-300" />
                <span>Quick access to your freelancer dashboard</span>
              </li>
              <li className="flex items-center gap-2">
                <FaSignInAlt className="text-purple-300" />
                <span>Continue your conversations without missing a beat</span>
              </li>
              <li className="flex items-center gap-2">
                <FaSignInAlt className="text-pink-300" />
                <span>Track your projects, milestones, and reviews</span>
              </li>
            </ul>
          </div>

          <p className="text-center text-sm text-blue-200 italic">
            Sign in and keep building your freelance journey.
          </p>
        </div>
      </div>

      {/* Right Panel (Form) */}
      <div className="md:w-1/2 h-1/2 md:h-full bg-white px-6 md:px-10 flex items-center justify-center">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="w-full max-w-md space-y-5"
        >
          <div className="text-center mb-4">
            <h2 className="text-3xl md:text-4xl font-extrabold text-blue-800 leading-snug">
              Login to{" "}
              <span className="text-blue-600">NovaBridge</span>
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Enter your credentials to access your account.
            </p>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              {...register("email")}
              placeholder="you@novabridge.com"
              type="email"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <p className="text-xs text-red-500">{errors.email?.message}</p>
          </div>

          {/* Password */}
          <div className="relative">
            <label className="block text-sm font-medium text-slate-700">
              Password
            </label>
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

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-md flex justify-center items-center gap-2 font-semibold transition duration-200"
          >
            {isSubmitting ? (
              <>
                <AiOutlineLoading3Quarters className="animate-spin" />
                Logging in...
              </>
            ) : (
              "Login"
            )}
          </button>

          <p className="text-center text-sm text-slate-600">
            Don’t have an account?{" "}
            <a
              href="/register"
              className="text-blue-600 hover:underline font-medium"
            >
              Register here
            </a>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;
