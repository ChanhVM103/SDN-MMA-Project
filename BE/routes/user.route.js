var express = require("express");
var router = express.Router();
var userController = require("../controller/user.controller");
var { authMiddleware, authorizeRole } = require("../middleware/auth.middleware");

<<<<<<< HEAD
=======
// ── User tự đổi mật khẩu (chỉ cần đăng nhập) ────
router.patch("/change-password", authMiddleware, userController.changePassword);

>>>>>>> 30cae0e2f630089fbcf52d3d4cae322ae9b2c886
// ── Admin routes ──────────────────────────────────
router.use(authMiddleware, authorizeRole("admin"));

router.get("/stats", userController.getUserStats);
router.get("/", userController.getAllUsers);
router.get("/:id", userController.getUserById);
router.post("/", userController.createUser);
router.put("/:id", userController.updateUser);
router.patch("/:id/role", userController.changeUserRole);
router.patch("/:id/toggle-active", userController.toggleUserActive);
router.patch("/:id/reset-password", userController.resetPassword);
router.delete("/:id", userController.deleteUser);

module.exports = router;
