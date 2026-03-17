var express = require("express");
var router = express.Router();
var ctrl = require("../controller/shipperReview.controller");
var { authMiddleware, authorizeRole } = require("../middleware/auth.middleware");

// Khách hàng gửi đánh giá shipper (cần đăng nhập)
router.post("/", authMiddleware, ctrl.taoDanhGia);

// Kiểm tra đã đánh giá shipper của đơn hàng này chưa
router.get("/kiem-tra/:maDonHang", authMiddleware, ctrl.kiemTraDaDanhGia);

// Shipper xem đánh giá của bản thân
router.get("/cua-toi", authMiddleware, authorizeRole("shipper"), ctrl.layDanhGiaCuaToi);

// Xem tất cả đánh giá của 1 shipper (public, dùng cho admin hoặc profile)
router.get("/shipper/:shipperId", ctrl.layDanhGiaShipper);

module.exports = router;
