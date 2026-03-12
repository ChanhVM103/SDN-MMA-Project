const Promotion = require("../models/promotion.model");

/**
 * Create a new promotion
 */
const createPromotion = async (promotionData) => {
  const promotion = new Promotion(promotionData);
  return await promotion.save();
};

/**
 * Get promotions for a restaurant
 */
const getPromotionsByRestaurant = async (restaurantId, isActive = null) => {
  const query = { restaurantId };
  if (isActive !== null) {
    query.isActive = isActive;
  }
  return await Promotion.find(query).populate("productIds");
};

/**
 * Get promotion by ID
 */
const getPromotionById = async (id) => {
  return await Promotion.findById(id).populate("productIds");
};

/**
 * Update promotion
 */
const updatePromotion = async (id, updateData) => {
  return await Promotion.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });
};

/**
 * Delete promotion
 */
const deletePromotion = async (id) => {
  return await Promotion.findByIdAndDelete(id);
};

/**
 * Get active promotions for a list of products
 */
const getActivePromotionsForProducts = async (productIds) => {
  return await Promotion.find({
    productIds: { $in: productIds },
    isActive: true,
    $or: [
      { endDate: { $exists: false } },
      { endDate: { $gt: new Date() } }
    ]
  });
};

module.exports = {
  createPromotion,
  getPromotionsByRestaurant,
  getPromotionById,
  updatePromotion,
  deletePromotion,
  getActivePromotionsForProducts,
};
