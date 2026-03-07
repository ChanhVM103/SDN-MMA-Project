var express = require("express");
var router = express.Router();
const userController = require("../controller/user.controller");
const { authMiddleware, authorizeRole } = require("../middleware/auth.middleware");

// Require auth and admin role for all user management routes
router.use(authMiddleware);
router.use(authorizeRole("admin"));

router.get("/", userController.getAllUsers);
router.post("/", userController.adminCreateUser);
router.put("/:id", userController.updateUser);
router.delete("/:id", userController.deleteUser);

module.exports = router;
