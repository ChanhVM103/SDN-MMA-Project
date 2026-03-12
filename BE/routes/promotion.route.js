const express = require("express");
const router = express.Router();
const promotionController = require("../controller/promotion.controller");
const { authMiddleware } = require("../middleware/auth.middleware");

// Public routes (anyone can see promotions for a restaurant)
router.get("/restaurant/:restaurantId", promotionController.getPromotions);

// Private routes (Brand management)
router.post("/", authMiddleware, promotionController.createPromotion);
router.delete("/:id", authMiddleware, promotionController.deletePromotion);
router.put("/:id", authMiddleware, promotionController.updatePromotion);
router.patch("/:id/status", authMiddleware, promotionController.togglePromotionStatus);

module.exports = router;
