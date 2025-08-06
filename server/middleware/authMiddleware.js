const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET;

exports.verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  // Step 1: Check if header is present and well-formed
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authorization header missing or malformed" });
  }

  // Step 2: Extract token from header
  const token = authHeader.split(" ")[1];

  try {
    // Step 3: Verify token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Step 4: Attach user info to request object
    req.user = decoded; // Typically contains { id, role, isSeller, etc. }

    next(); // Proceed to the next middleware/controller
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};
