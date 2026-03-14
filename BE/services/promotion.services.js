const mongoose = require("mongoose");
const Promotion = require("../models/promotion.model");

/**
 * Helper to get unique, safe product IDs (String and ObjectId supported)
 */
const getSafeProductIds = (productIds) => {
  if (!productIds || !Array.isArray(productIds)) return [];
  const uniqueIds = new Set();
  
  productIds.forEach(id => {
    if (!id) return;
    // Extract ID if it's an object or a string
    const idStr = id._id ? id._id.toString() : id.toString();
    if (mongoose.Types.ObjectId.isValid(idStr)) {
      uniqueIds.add(idStr);
    }
  });

  return Array.from(uniqueIds);
};

/**
 * Get active promotions that contain any of the given products for a restaurant.
 * @param {string} restaurantId 
 * @param {string[]} productIds 
 * @param {string} excludePromotionId - Used when updating to skip the current promotion
 */
const getActiveConflicts = async (restaurantId, productIds, excludePromotionId = null) => {
  const safeIds = getSafeProductIds(productIds);
  if (safeIds.length === 0) return [];

  const query = {
    restaurantId,
    isActive: true,
    productIds: { $in: safeIds },
    $or: [
      { endDate: { $exists: false } },
      { endDate: null },
      { endDate: { $gt: new Date() } }
    ]
  };

  if (excludePromotionId) {
    query._id = { $ne: excludePromotionId };
  }

  return await Promotion.find(query);
};

/**
 * Find any active promotion for a restaurant (excluding a specific one)
 */
const getOtherActivePromotion = async (restaurantId, excludePromotionId = null) => {
  const query = {
    restaurantId,
    isActive: true,
    $or: [
      { endDate: { $exists: false } },
      { endDate: null },
      { endDate: { $gt: new Date() } }
    ]
  };

  if (excludePromotionId) {
    query._id = { $ne: excludePromotionId };
  }

  return await Promotion.findOne(query);
};

/**
 * Deactivate all active promotions for a restaurant except for a specific one
 */
const deactivateOtherPromotions = async (restaurantId, excludePromotionId = null) => {
  const query = {
    restaurantId,
    isActive: true
  };

  if (excludePromotionId) {
    query._id = { $ne: excludePromotionId };
  }

  return await Promotion.updateMany(query, { isActive: false });
};

/**
 * Remove specific products from existing promotions.
 * Used for the "Override" feature to move products from old to new promotions.
 */
const removeProductsFromExistingPromotions = async (productIds, restaurantId, excludePromotionId = null) => {
  const conflicts = await getActiveConflicts(restaurantId, productIds, excludePromotionId);
  const idsToRemove = getSafeProductIds(productIds);

  for (const promo of conflicts) {
    const remainingProducts = promo.productIds
      .map(id => id.toString())
      .filter(id => !idsToRemove.includes(id));

    if (remainingProducts.length === 0) {
      // If no products left, delete the promotion
      await Promotion.findByIdAndDelete(promo._id);
    } else {
      // Otherwise, update the product list
      await Promotion.findByIdAndUpdate(promo._id, { productIds: remainingProducts });
    }
  }
};

/**
 * Service: Create a new promotion
 */
const createPromotion = async (data) => {
  const promotion = new Promotion(data);
  return await promotion.save();
};

/**
 * Service: Fetch all promotions for a restaurant
 */
const getPromotionsByRestaurant = async (restaurantId, isActive = null) => {
  const query = { restaurantId };
  if (isActive !== null) query.isActive = isActive;
  return await Promotion.find(query).sort({ createdAt: -1 });
};

/**
 * Service: Fetch promotion by ID
 */
const getPromotionById = async (id) => {
  return await Promotion.findById(id).populate("productIds");
};

/**
 * Service: Update promotion
 */
const updatePromotion = async (id, data) => {
  return await Promotion.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  });
};

/**
 * Service: Delete promotion
 */
const deletePromotion = async (id) => {
  return await Promotion.findByIdAndDelete(id);
};

module.exports = {
  getSafeProductIds,
  getActiveConflicts,
  getOtherActivePromotion,
  deactivateOtherPromotions,
  removeProductsFromExistingPromotions,
  createPromotion,
  getPromotionsByRestaurant,
  getPromotionById,
  updatePromotion,
  deletePromotion,
};