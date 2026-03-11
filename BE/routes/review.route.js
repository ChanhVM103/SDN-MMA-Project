var express = require("express");
var router = express.Router();
var reviewController = require("../controller/review.controller");
var { authMiddleware } = require("../middleware/auth.middleware");

// POST /api/reviews          – Tạo 1 đánh giá (nhà hàng hoặc món ăn)
router.post("/", authMiddleware, reviewController.createReview);

// POST /api/reviews/bulk     – Gửi nhiều đánh giá cùng lúc cho 1 đơn
router.post("/bulk", authMiddleware, reviewController.createBulkReviews);

// GET /api/reviews/restaurant/:restaurantId  – Đánh giá tổng thể nhà hàng
router.get("/restaurant/:restaurantId", reviewController.getRestaurantReviews);

// GET /api/reviews/product/:productId        – Đánh giá theo sản phẩm
router.get("/product/:productId", reviewController.getProductReviews);

// GET /api/reviews/check/:orderId            – Kiểm tra đã review chưa
router.get("/check/:orderId", authMiddleware, reviewController.checkOrderReviewed);

// PUT /api/reviews/:id                       – Sửa đánh giá
router.put("/:id", authMiddleware, reviewController.updateReview);

// DELETE /api/reviews/:id                    – Xóa đánh giá
router.delete("/:id", authMiddleware, reviewController.deleteReview);

module.exports = router;

