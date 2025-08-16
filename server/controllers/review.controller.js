const Review = require("../models/Review");
const Gig = require("../models/Gig");
const Order = require("../models/Order"); 

exports.createReview = async (req, res) => {
  try {
    const { gigId, desc, star, orderId } = req.body;
    const userId = req.user.id; // ✅ Use req.user.id instead of req.userId

    // ✅ Validate order
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    if (order.buyerId.toString() !== userId) {
      return res.status(403).json({ message: "You are not allowed to review this order" });
    }

    if (order.status !== "Completed") {
      return res.status(400).json({ message: "You can only review completed orders" });
    }

    // ✅ Check if review already exists
    const existingReview = await Review.findOne({ gigId, userId, orderId });
    if (existingReview) {
      return res.status(400).json({ message: "You have already reviewed this order." });
    }

    // ✅ Create review
    const newReview = new Review({ gigId, userId, orderId, desc, star });
    await newReview.save();

    // ✅ Link review to order
    order.review = newReview._id;
    await order.save();

    // ✅ Update gig rating
    await Gig.findByIdAndUpdate(gigId, {
      $inc: { totalStars: star, starNumber: 1 },
    });

    res.status(201).json({ message: "Review submitted successfully", review: newReview });
  } catch (err) {
    console.error("❌ Review Error:", err);
    res.status(500).json({ message: "Error submitting review", error: err.message });
  }
};


exports.getGigReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ gigId: req.params.gigId }).populate("userId", "username");
    res.status(200).json(reviews);
  } catch (err) {
    res.status(500).json(err.message);
  }
};

exports.hasUserReviewedGig = async (req, res) => {
  try {
    const review = await Review.findOne({
      gigId: req.params.gigId,
      userId: req.user.id,
    });

    res.status(200).json({ reviewed: !!review });
  } catch (err) {
    res.status(500).json(err.message);
  }
};
