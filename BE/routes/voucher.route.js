const express = require("express");
const router = express.Router();
const voucherController = require("../controller/voucher.controller");
const { authMiddleware, authorizeRole } = require("../middleware/auth.middleware");

// ── Public routes ─────────────────────────────────
router.get("/active", voucherController.getActiveVouchers);

// ── Admin routes ──────────────────────────────────
router.get("/", authMiddleware, authorizeRole("admin"), voucherController.getAllVouchers);
router.post("/", authMiddleware, authorizeRole("admin"), voucherController.createVoucher);
router.put("/:id", authMiddleware, authorizeRole("admin"), voucherController.updateVoucher);
router.delete("/:id", authMiddleware, authorizeRole("admin"), voucherController.deleteVoucher);
router.patch("/:id/toggle", authMiddleware, authorizeRole("admin"), voucherController.toggleVoucher);

module.exports = router;
