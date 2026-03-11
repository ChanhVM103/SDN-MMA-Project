const jwt = require("jsonwebtoken");

/**
 * Middleware to verify JWT token
 * Adds userId and userRole to req object if valid
 */
const authMiddleware = (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("DEBUG [Auth]: Missing or malformed header:", authHeader);
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
      });
    }

    const token = authHeader.split(" ")[1];

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    req.userRole = decoded.role; // Lưu role vào request

    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token has expired. Please login again.",
      });
    }

    console.log("DEBUG [Auth]: Invalid token:", error.message);
    return res.status(401).json({
      success: false,
      message: "Invalid token.",
    });
  }
};

/**
 * Middleware to authorize roles
 * Usage: authorizeRole("admin", "brand")
 */
const authorizeRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.userRole) {
      console.log("DEBUG [Auth]: Role missing on request. Decoded ID was:", req.userId);
      return res.status(401).json({
        success: false,
        message: "User role not found. Please login again.",
      });
    }

    if (!allowedRoles.includes(req.userRole)) {
      console.log(`DEBUG [Auth]: Forbidden. Role "${req.userRole}" not in allowed:`, allowedRoles);
      return res.status(403).json({
        success: false,
        message: "Access forbidden. Insufficient permissions.",
      });
    }

    next();
  };
};

module.exports = { authMiddleware, authorizeRole };
