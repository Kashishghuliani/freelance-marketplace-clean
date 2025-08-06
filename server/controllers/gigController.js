const Gig = require("../models/Gig");

// ✅ Create a New Gig
exports.createGig = async (req, res) => {
  const { title, description, category, price, deliveryTime, images } = req.body;
  try {
    const newGig = await Gig.create({
      title,
      description,
      category,
      price,
      deliveryTime,
      images,
      sellerId: req.user.id, // Injected via auth middleware
    });
    res.status(201).json(newGig);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create gig" });
  }
};

// ✅ Get All Gigs
exports.getGigs = async (req, res) => {
  try {
    const gigs = await Gig.find().populate("sellerId", "username");
    res.status(200).json(gigs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch gigs" });
  }
};

// ✅ Get Single Gig by ID
exports.getGigById = async (req, res) => {
  try {
    const gig = await Gig.findById(req.params.id).populate("sellerId", "username");
    if (!gig) return res.status(404).json({ message: "Gig not found" });
    res.status(200).json(gig);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching gig" });
  }
};

// ✅ Update Gig
exports.updateGig = async (req, res) => {
  try {
    const gig = await Gig.findById(req.params.id);
    if (!gig) return res.status(404).json({ message: "Gig not found" });

    if (gig.sellerId.toString() !== req.user.id)
      return res.status(403).json({ message: "Not authorized to update this gig" });

    const updatedGig = await Gig.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json(updatedGig);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Update failed" });
  }
};

// ✅ Delete Gig
exports.deleteGig = async (req, res) => {
  try {
    const gig = await Gig.findById(req.params.id);
    if (!gig) return res.status(404).json({ message: "Gig not found" });

    // Only the seller can delete
    if (gig.sellerId.toString() !== req.user.id)
      return res.status(403).json({ message: "Not authorized to delete this gig" });

    await Gig.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Gig deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Delete failed" });
  }
};
