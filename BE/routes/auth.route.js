var express = require("express");
var router = express.Router();
var authController = require("../controller/auth.controller");
var { authMiddleware } = require("../middleware/auth.middleware");

// Public routes
router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/google", authController.googleAuth);
router.post("/facebook", authController.facebookAuth);

// Protected routes
router.get("/profile", authMiddleware, authController.getProfile);
router.put("/profile", authMiddleware, authController.updateProfile);
router.put("/change-password", authMiddleware, authController.changePassword);
router.put("/avatar", authMiddleware, authController.updateAvatar);

module.exports = router;
