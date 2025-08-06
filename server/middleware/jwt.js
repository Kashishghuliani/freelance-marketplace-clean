const jwt = require("jsonwebtoken");

exports.verifyToken = (req, res, next) => {
  let token = req.cookies.accessToken;

  // ✅ Fallback to Authorization header if cookie is missing
  if (!token && req.headers.authorization?.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json("You are not authenticated!");
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, payload) => {
    if (err) return res.status(403).json("Token is not valid!");

    // ✅ Set a consistent req.user object
    req.user = {
      id: payload.id,
      isSeller: payload.isSeller,
    };

    next();
  });
};
