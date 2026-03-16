const promotionService = require("../services/promotion.services");
const restaurantService = require("../services/restaurant.services");

/**
 * Controller: Create a new Flash Sale
 */
const createPromotion = async (req, res) => {
  try {
    const { name, discountPercent, restaurantId, productIds, override } = req.body;
    const brandId = req.userId;

    // 1. Authorization check
    const restaurant = await restaurantService.getRestaurantById(restaurantId);
    if (!restaurant || restaurant.owner._id.toString() !== brandId) {
      return res.status(403).json({ success: false, message: "Bạn không có quyền quảng lý nhà hàng này" });
    }

    // 2. Prepare Global Conflict Check
    const otherActive = await promotionService.getOtherActivePromotion(restaurantId);

    // Handle Global Override FIRST: Deactivate other active promotions
    if (override && otherActive) {
      await promotionService.deactivateOtherPromotions(restaurantId);
    } else if (otherActive && !override) {
      return res.status(400).json({
        success: false,
        hasGlobalConflict: true,
        activePromotion: { id: otherActive._id, name: otherActive.name },
        message: `Hiện đang có chương trình "${otherActive.name}" đang kích hoạt. Bạn có muốn tạm dừng nó để bắt đầu chương trình mới không?`
      });
    }
    // Note: After deactivating, otherActive's products are no longer "conflicting"
    const conflicts = await promotionService.getActiveConflicts(restaurantId, productIds);
    
    if (conflicts.length > 0) {
      if (!override) {
        return res.status(400).json({
          success: false,
          hasConflicts: true,
          conflicts: conflicts.map(c => ({ id: c._id, name: c.name, productIds: c.productIds })),
          message: "Một số sản phẩm bạn chọn đã tham gia chương trình Flash Sale khác."
        });
      }
      
      // Handle override: Remove products from old promotions (any that remain active)
      await promotionService.removeProductsFromExistingPromotions(productIds, restaurantId);
    }

    // 3. Create the promotion
    const promotion = await promotionService.createPromotion({
      name,
      discountPercent,
      brandId,
      restaurantId,
      productIds: promotionService.getSafeProductIds(productIds),
      isActive: true,
      startDate: new Date()
    });

    res.status(201).json({ success: true, message: "Tạo Flash Sale thành công", data: promotion });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * Controller: Update an existing Flash Sale
 */
const updatePromotion = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, discountPercent, productIds, isActive, override, endDate } = req.body;
    const brandId = req.userId;

    const promotion = await promotionService.getPromotionById(id);
    if (!promotion) return res.status(404).json({ success: false, message: "Không tìm thấy chương trình này" });

    // Authorization
    const restaurant = await restaurantService.getRestaurantById(promotion.restaurantId);
    if (!restaurant || restaurant.owner._id.toString() !== brandId) {
      return res.status(403).json({ success: false, message: "Bạn không có quyền chỉnh sửa chương trình này" });
    }

    // Prepare update data
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (discountPercent !== undefined) updateData.discountPercent = discountPercent;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (productIds !== undefined) updateData.productIds = promotionService.getSafeProductIds(productIds);
    if (endDate !== undefined) updateData.endDate = new Date(endDate);

    // Conflict handling (only if active)
    const finalActive = isActive !== undefined ? isActive : promotion.isActive;
    const finalProducts = productIds !== undefined ? productIds : promotion.productIds;

    if (finalActive) {
      // 1. Prepare Global Conflict Check
      const otherActive = await promotionService.getOtherActivePromotion(promotion.restaurantId, id);
      
      // 2. Handle Global Override FIRST
      if (override && otherActive) {
        await promotionService.deactivateOtherPromotions(promotion.restaurantId, id);
      } else if (otherActive && !override) {
        return res.status(400).json({
          success: false,
          hasGlobalConflict: true,
          activePromotion: { id: otherActive._id, name: otherActive.name },
          message: `Hiện đang có chương trình "${otherActive.name}" đang kích hoạt. Bạn có muốn tạm dừng nó để kích hoạt chương trình này không?`
        });
      }

      // 3. Product Conflict handling
      const conflicts = await promotionService.getActiveConflicts(promotion.restaurantId, finalProducts, id);
      if (conflicts.length > 0) {
        if (!override) {
          return res.status(400).json({
            success: false,
            hasConflicts: true,
            conflicts,
            message: "Một số sản phẩm đang tham gia chương trình Flash Sale khác."
          });
        }
        await promotionService.removeProductsFromExistingPromotions(finalProducts, promotion.restaurantId, id);
      }
    }

    const updated = await promotionService.updatePromotion(id, updateData);
    res.json({ success: true, message: "Cập nhật Flash Sale thành công", data: updated });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * Controller: Fetch promotions for a restaurant
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
 * Controller: Delete a promotion
 */
const deletePromotion = async (req, res) => {
  try {
    const { id } = req.params;
    const brandId = req.userId;

    const promotion = await promotionService.getPromotionById(id);
    if (!promotion) return res.status(404).json({ success: false, message: "Không tìm thấy chương trình" });

    const restaurant = await restaurantService.getRestaurantById(promotion.restaurantId);
    const ownerId = restaurant?.owner?._id || restaurant?.owner;
    
    if (!restaurant || ownerId?.toString() !== brandId) {
      return res.status(403).json({ success: false, message: "Bạn không có quyền xóa chương trình này" });
    }

    await promotionService.deletePromotion(id);
    res.json({ success: true, message: "Đã xóa chương trình Flash Sale" });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * Controller: Check for conflicts before saving/activating
 */
const checkConflicts = async (req, res) => {
  try {
    const { restaurantId, productIds, editingPromotionId } = req.body;
    
    const conflicts = await promotionService.getActiveConflicts(restaurantId, productIds, editingPromotionId);
    
    res.json({
      success: true,
      hasConflicts: conflicts.length > 0,
      conflicts: conflicts.map(c => ({
        id: c._id,
        name: c.name,
        discountPercent: c.discountPercent,
        productIds: c.productIds
      }))
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Simple toggle for status
const togglePromotionStatus = async (req, res) => {
  req.body = { isActive: req.body.isActive };
  return updatePromotion(req, res);
};

// Gia hạn thời gian kết thúc khuyến mãi
const extendPromotion = async (req, res) => {
  try {
    const { id } = req.params;
    const { endDate } = req.body;
    if (!endDate) return res.status(400).json({ success: false, message: "Ngày kết thúc không hợp lệ" });

    req.body = { endDate };
    return updatePromotion(req, res);
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = {
  createPromotion,
  updatePromotion,
  getPromotions,
  deletePromotion,
  checkConflicts,
  togglePromotionStatus,
  extendPromotion
};