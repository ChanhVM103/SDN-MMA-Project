var express = require("express");
var router = express.Router();
var orderController = require("../controller/order.controller");
var { authMiddleware, authorizeRole } = require("../middleware/auth.middleware");

// ── User routes (cần đăng nhập) ──────────────────
router.post("/", authMiddleware, orderController.createOrder);
router.get("/my", authMiddleware, orderController.getMyOrders);
router.patch("/:id/cancel", authMiddleware, orderController.cancelOrder);
router.get("/:id", authMiddleware, orderController.getOrderById);

// ── Brand routes (nhà hàng) ───────────────────────
router.get("/restaurant/:restaurantId", authMiddleware, authorizeRole("brand", "admin"), orderController.getRestaurantOrders);
router.patch("/:id/brand-status", authMiddleware, authorizeRole("brand", "admin"), orderController.updateOrderStatusByBrand);

// ── Admin routes ──────────────────────────────────
router.get("/", authMiddleware, authorizeRole("admin"), orderController.getAllOrders);
router.get("/stats", authMiddleware, authorizeRole("admin"), orderController.getOrderStats);
router.patch("/:id/status", authMiddleware, authorizeRole("admin"), orderController.updateOrderStatus);

module.exports = router;
