const stripe = require("../config/stripe");
const Gig = require("../models/Gig");
const Order = require("../models/Order");

// ✅ 1. Create Stripe Checkout Session
exports.createStripeSession = async (req, res) => {
  try {
    const gig = await Gig.findById(req.body.gigId).populate("sellerId");
    if (!gig) return res.status(404).json({ message: "Gig not found" });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: gig.title,
              description: gig.description,
            },
            unit_amount: gig.price * 100, // Stripe expects amount in cents
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.CLIENT_URL}/success?session_id={CHECKOUT_SESSION_ID}&gigId=${gig._id}`,
      cancel_url: `${process.env.CLIENT_URL}/gigs/${gig._id}`,
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error("Stripe session error:", err);
    res.status(500).json({ message: "Stripe session error" });
  }
};

// ✅ 2. Create Order
exports.createOrder = async (req, res) => {
  try {
    console.log("Incoming order request body:", req.body);
    console.log("Decoded user from token:", req.user);

    const buyerId = req.user.id;
    const { sellerId, gigId, price } = req.body;

    const order = await Order.create({
      buyerId,
      sellerId,
      gigId,
      price,
      status: "Pending",
    });

    res.status(201).json(order);
  } catch (err) {
    console.error("❌ Order creation error:", err);
    res.status(500).json({ message: "Failed to create order" });
  }
};

// ✅ 3. Get Orders Based on Role
exports.getOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;

    let orders;

    if (role === "client") {
      orders = await Order.find({ buyerId: userId })
        .populate("gigId")
        .populate("sellerId")
        .populate("review"); // ✅ Add this line
    } else if (role === "freelancer") {
      orders = await Order.find({ sellerId: userId })
        .populate("gigId")
        .populate("buyerId")
        .populate("review"); // ✅ Add this line
    } else {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json(orders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch orders" });
  }
};

// ✅ 4. Cancel Order
exports.cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    if (order.buyerId.toString() !== req.user.id)
      return res.status(403).json({ message: "Not authorized to cancel this order" });

    order.status = "Cancelled";
    await order.save();

    res.status(200).json({ message: "Order cancelled successfully", order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to cancel order" });
  }
};

// ✅ 5. Complete Order
exports.completeOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    // ✅ Only seller can mark order as complete
    if (order.sellerId.toString() !== req.user.id)
      return res.status(403).json({ message: "Unauthorized" });

    order.status = "Completed";
    await order.save();

    res.status(200).json({ message: "Order marked as completed", order });
  } catch (err) {
    console.error("❌ Complete Order Error:", err);
    res.status(500).json({ message: "Failed to complete order" });
  }
};
