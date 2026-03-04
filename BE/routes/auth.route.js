var express = require("express");
var router = express.Router();
var authController = require("../controller/auth.controller");
var {
  authMiddleware,
  authorizeRole,
} = require("../middleware/auth.middleware");

// Public routes - No auth required
router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/google", authController.googleAuth);
router.post("/facebook", authController.facebookAuth);

// Protected routes - All authenticated users can access
router.get("/profile", authMiddleware, authController.getProfile);
router.put("/profile", authMiddleware, authController.updateProfile);

module.exports = router;
