var express = require("express");
var router = express.Router();
var userController = require("../controller/user.controller");
var { authMiddleware, authorizeRole } = require("../middleware/auth.middleware");

// Public route must be defined before authMiddleware
router.get("/brands/public", userController.getPublicBrands);

router.use(authMiddleware, authorizeRole("admin"));

router.get("/stats", userController.getUserStats);
router.get("/", userController.getAllUsers);
router.get("/:id", userController.getUserById);
router.post("/", userController.adminCreateUser);
router.put("/:id", userController.updateUser);
router.patch("/:id/role", userController.changeUserRole);
router.patch("/:id/toggle-active", userController.toggleUserActive);
router.patch("/:id/reset-password", userController.resetPassword);
router.delete("/:id", userController.deleteUser);

module.exports = router;
