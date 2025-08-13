const express = require("express");
const { verifyToken } = require("../middleware/jwt");
const {
  createReview,
  getGigReviews,
  hasUserReviewedGig,
} = require("../controllers/review.controller");

const Review = require("../models/Review");

const router = express.Router();

// ✅ 1. Create a review (POST) — must be above param routes
router.post("/", verifyToken, createReview);

// ✅ 2. Check if user has reviewed a gig
router.get("/check/:gigId", verifyToken, hasUserReviewedGig);

// ✅ 3. Get all reviews for a specific gig
router.get("/:gigId", getGigReviews);

// ✅ 4. Get all reviews by logged-in user (for dashboard)
router.get("/", verifyToken, async (req, res) => {
  try {
    const reviews = await Review.find({ userId: req.user.id }); // ensure matches verifyToken
    res.status(200).json(reviews);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
