var express = require("express");
var router = express.Router();
var authController = require("../controller/auth.controller");
var authMiddleware = require("../middleware/auth.middleware");

// Public routes - Local auth
router.post("/register", authController.register);
router.post("/login", authController.login);

// Public routes - Social auth
router.post("/google", authController.googleAuth);
router.post("/facebook", authController.facebookAuth);

// Protected routes
router.get("/profile", authMiddleware, authController.getProfile);

module.exports = router;
