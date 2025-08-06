import React from "react";
import { Navigate } from "react-router-dom";

const RequireFreelancer = ({ children }) => {
  const token = localStorage.getItem("token");

  if (!token) return <Navigate to="/login" />;

  const decoded = JSON.parse(atob(token.split('.')[1])); // decode payload

  if (decoded.role !== "freelancer") {
    return <Navigate to="/unauthorized" />; // you can create this page later
  }

  return children;
};

export default RequireFreelancer;
