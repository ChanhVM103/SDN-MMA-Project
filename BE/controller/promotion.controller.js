const promotionService = require("../services/promotion.services");
const restaurantService = require("../services/restaurant.services");

/**
 * Create a promotion
 */
const createPromotion = async (req, res) => {
  try {
    const { name, discountPercent, restaurantId, productIds, startDate, endDate } = req.body;
    const brandId = req.userId;

    // Verify restaurant ownership
    const restaurant = await restaurantService.getRestaurantById(restaurantId);
    if (!restaurant || restaurant.owner.toString() !== brandId) {
      return res.status(403).json({ success: false, message: "Bạn không có quyền quản lý nhà hàng này" });
    }

    const promotion = await promotionService.createPromotion({
      name,
      discountPercent,
      brandId,
      restaurantId,
      productIds,
      startDate,
      endDate
    });

    res.status(201).json({
      success: true,
      data: promotion
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * Get promotions for a restaurant
 */
const getPromotions = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { isActive } = req.query;

    const promotions = await promotionService.getPromotionsByRestaurant(
      restaurantId,
      isActive === undefined ? null : isActive === "true"
    );

    res.json({ success: true, data: promotions });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * Delete a promotion
 */
const deletePromotion = async (req, res) => {
  try {
    const { id } = req.params;
    const brandId = req.userId;

    const promotion = await promotionService.getPromotionById(id);
    if (!promotion) {
      return res.status(404).json({ success: false, message: "Khuyến mãi không tồn tại" });
    }

    if (promotion.brandId.toString() !== brandId) {
      return res.status(403).json({ success: false, message: "Bạn không có quyền xóa khuyến mãi này" });
    }

    await promotionService.deletePromotion(id);
    res.json({ success: true, message: "Đã xóa khuyến mãi" });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * Update promotion status
 */
const togglePromotionStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    const brandId = req.userId;

    const promotion = await promotionService.getPromotionById(id);
    if (!promotion) {
      return res.status(404).json({ success: false, message: "Khuyến mãi không tồn tại" });
    }

    if (promotion.brandId.toString() !== brandId) {
      return res.status(403).json({ success: false, message: "Bạn không có quyền chỉnh sửa khuyến mãi này" });
    }

    const updated = await promotionService.updatePromotion(id, { isActive });
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * Update promotion details
 */
const updatePromotion = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, discountPercent, productIds } = req.body;
    const brandId = req.userId;

    const promotion = await promotionService.getPromotionById(id);
    if (!promotion) {
      return res.status(404).json({ success: false, message: "Khuyến mãi không tồn tại" });
    }

    if (promotion.brandId.toString() !== brandId) {
      return res.status(403).json({ success: false, message: "Bạn không có quyền chỉnh sửa khuyến mãi này" });
    }

    const updated = await promotionService.updatePromotion(id, {
      name,
      discountPercent,
      productIds
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = {
  createPromotion,
  getPromotions,
  deletePromotion,
  togglePromotionStatus,
  updatePromotion,
};
