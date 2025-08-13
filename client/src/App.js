import { Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Register from "./pages/Register";
import Login from "./pages/Login";
import CreateGig from "./pages/CreateGig";
import RequireFreelancer from "./components/RequireFreelancer";
import GigDetail from "./pages/GigDetail";
import Dashboard from "./pages/Dashboard";
import Success from "./pages/Success";
import ChatPage from "./pages/ChatPage";
import GigsPage from "./pages/GigsPage";
import EditGig from "./pages/EditGig";
import ReviewPage from "./pages/ReviewPage";

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/create-gig"
          element={
            <RequireFreelancer>
              <CreateGig />
            </RequireFreelancer>
          }
        />
        <Route path="/gigs/:id" element={<GigDetail />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/success" element={<Success />} />
        <Route path="/chat/:userId" element={<ChatPage />} />
        <Route path="/gigs" element={<GigsPage />} />
        <Route path="/edit-gig/:id" element={<EditGig />} />
        <Route path="/review/:orderId" element={<ReviewPage />} />
      </Routes>

      {/* Toast Notifications */}
      <ToastContainer position="top-right" autoClose={3000} />
    </>
  );
}

export default App;
