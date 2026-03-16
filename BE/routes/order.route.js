var express = require("express");
var router = express.Router();
var orderController = require("../controller/order.controller");
var { authMiddleware, authorizeRole } = require("../middleware/auth.middleware");

// ── User routes (cần đăng nhập) ──────────────────
router.post("/", authMiddleware, orderController.createOrder);
router.get("/my", authMiddleware, orderController.getMyOrders);
router.patch("/:id/cancel", authMiddleware, orderController.cancelOrder);
router.patch("/:id/confirm-received", authMiddleware, orderController.confirmOrderReceived);

// ── Shipper routes ────────────────────────────────
router.get("/shipper/available", authMiddleware, authorizeRole("shipper", "admin"), orderController.getAvailableOrders);
router.get("/shipper/my", authMiddleware, authorizeRole("shipper", "admin"), orderController.getShipperOrders);
router.patch("/:id/shipper-accept", authMiddleware, authorizeRole("shipper"), orderController.shipperAcceptOrder);
router.patch("/:id/shipper-pickup", authMiddleware, authorizeRole("shipper"), orderController.shipperPickedUp);
router.patch("/:id/shipper-delivered", authMiddleware, authorizeRole("shipper"), orderController.shipperCompleteDelivery);
router.patch("/:id/shipper-bomb", authMiddleware, authorizeRole("shipper"), orderController.shipperReportBomb);

// ── Brand routes (nhà hàng) ───────────────────────
router.get("/restaurant/:restaurantId/stats", authMiddleware, authorizeRole("brand", "admin"), orderController.getRestaurantStats);
router.get("/restaurant/:restaurantId", authMiddleware, authorizeRole("brand", "admin"), orderController.getRestaurantOrders);
router.patch("/:id/brand-status", authMiddleware, authorizeRole("brand", "admin"), orderController.updateOrderStatusByBrand);
router.patch("/:id/brand-handover", authMiddleware, authorizeRole("brand", "admin"), orderController.brandHandoverToShipper);
router.patch("/:id/brand-confirm-delivered", authMiddleware, authorizeRole("brand", "admin"), orderController.brandConfirmDelivered);

// ── Admin routes ──────────────────────────────────
router.get("/", authMiddleware, authorizeRole("admin"), orderController.getAllOrders);
router.get("/stats", authMiddleware, authorizeRole("admin"), orderController.getOrderStats);
router.patch("/:id/status", authMiddleware, authorizeRole("admin"), orderController.updateOrderStatus);

// ── Generic (user xem đơn theo id) ───────────────
router.get("/:id", authMiddleware, orderController.getOrderById);

module.exports = router;
