const express = require("express");
const { verifyToken } = require("../middleware/jwt");
const {
  createReview,
  getGigReviews,
  hasUserReviewedGig,
} = require("../controllers/review.controller");

const Review = require("../models/Review");

const router = express.Router();

// ✅ Create a review
router.post("/", verifyToken, createReview);

// ✅ Get all reviews for a gig
router.get("/:gigId", getGigReviews);

// ✅ Check if user has reviewed a gig
router.get("/check/:gigId", verifyToken, hasUserReviewedGig);

// ✅ NEW: Get all reviews by logged-in user (for dashboard)
router.get("/", verifyToken, async (req, res) => {
  try {
    const reviews = await Review.find({ userId: req.userId });
    res.status(200).json(reviews);
  } catch (err) {
    res.status(500).json(err.message);
  }
});

module.exports = router;
