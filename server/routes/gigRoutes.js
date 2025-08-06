const express = require("express");
const router = express.Router();
const {
  createGig,
  getGigs,
  getGigById,
  updateGig,
  deleteGig
} = require("../controllers/gigController");

const { verifyToken } = require("../middleware/authMiddleware");

router.get("/", getGigs);
router.get("/:id", getGigById);

router.post("/", verifyToken, createGig);
router.put("/:id", verifyToken, updateGig);
router.delete("/:id", verifyToken, deleteGig);

module.exports = router;
