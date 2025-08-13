const express = require("express");
const router = express.Router();
const {
  createStripeSession,
  createOrder,
  getOrders,
  cancelOrder,
  completeOrder,
} = require("../controllers/orderController");
const { verifyToken } = require("../middleware/authMiddleware");


router.post("/create", verifyToken, createOrder);

// ✅ Stripe checkout
router.post("/create-checkout-session", verifyToken, createStripeSession);

// ✅ Fetch orders
router.get("/", verifyToken, getOrders);
// In orderRoutes.js
router.put("/cancel/:id", verifyToken, cancelOrder);
router.put("/completed/:id", verifyToken, completeOrder);



module.exports = router;
