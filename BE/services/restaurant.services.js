const Restaurant = require("../models/restaurant.model");
const Promotion = require("../models/promotion.model");
const Product = require("../models/product.model");

/**
 * Helper to attach promotion info to restaurants
 */
const attachPromotionsToRestaurants = async (restaurants) => {
  if (!restaurants || restaurants.length === 0) return restaurants;

  const restaurantIds = restaurants.map(r => r._id);
  const now = new Date();

  // Find all active promotions for these restaurants
  const activePromotions = await Promotion.find({
    restaurantId: { $in: restaurantIds },
    isActive: true,
    startDate: { $lte: now },
    $or: [
      { endDate: { $exists: false } },
      { endDate: null },
      { endDate: { $gte: now } }
    ]
  });

  return restaurants.map(r => {
    const rObj = r.toObject ? r.toObject() : r;
    const rPromos = activePromotions.filter(p => p.restaurantId.toString() === rObj._id.toString());
    
    if (rPromos.length > 0) {
      const maxDiscount = Math.max(...rPromos.map(p => p.discountPercent));
      // If promotion discount is higher than existing discountPercent, update it
      if (maxDiscount > (rObj.discountPercent || 0)) {
        rObj.discountPercent = maxDiscount;
        // Mark as flash sale if it has a promotion to show in the UI
        rObj.isFlashSale = true;
      }
    }
    return rObj;
  });
};

/**
 * Get all restaurants with pagination, search, and filtering
 */
const getAllRestaurants = async (
  page = 1,
  limit = 10,
  search = "",
  type = "",
  sortBy = "rating",
  sortOrder = -1,
) => {
  try {
    const skip = (page - 1) * limit;

    // Build search query (using regex for partial matches)
    let query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { tags: { $regex: search, $options: "i" } },
      ];
    }
    if (type && ["food", "drink"].includes(type)) {
      query.type = type;
    }

    // Get total count for pagination
    const total = await Restaurant.countDocuments(query);

    // Fetch restaurants with sorting and owner info
    const restaurants = await Restaurant.find(query)
      .populate("owner", "fullName email")
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit);

    const result = {
      data: restaurants,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalRecords: total,
        limit,
      },
    };

    result.data = await attachPromotionsToRestaurants(result.data);
    return result;
  } catch (error) {
    throw new Error(`Error fetching restaurants: ${error.message}`);
  }
};

/**
 * Get restaurant by ID
 */
const getRestaurantById = async (id) => {
  try {
    const restaurant = await Restaurant.findById(id).populate("owner", "fullName email");
    if (!restaurant) {
      throw new Error("Restaurant not found");
    }
    const results = await attachPromotionsToRestaurants([restaurant]);
    return results[0];
  } catch (error) {
    throw new Error(`Error fetching restaurant: ${error.message}`);
  }
};

/**
 * Create a new restaurant (Normal flow)
 */
const createRestaurant = async (restaurantData) => {
  try {
    const restaurant = new Restaurant(restaurantData);
    await restaurant.save();
    return restaurant;
  } catch (error) {
    throw new Error(`Error creating restaurant: ${error.message}`);
  }
};

/**
 * Admin Create Restaurant for Brand
 */
const adminCreateRestaurant = async (restaurantData, ownerId) => {
  try {
    // Basic validation to ensure owner exists and is a brand
    const User = require("../models/user.model");
    const owner = await User.findById(ownerId);
    if (!owner) {
      throw new Error("Owner (User) not found");
    }
    if (owner.role !== "brand") {
      throw new Error("Assigned user must have the 'brand' role");
    }

    // Check if owner already has a restaurant
    const existingRestaurant = await Restaurant.findOne({ owner: ownerId });
    if (existingRestaurant) {
      throw new Error("This brand already has a restaurant associated with it");
    }

    const restaurant = new Restaurant({
      ...restaurantData,
      owner: ownerId,
    });
    await restaurant.save();
    return restaurant;
  } catch (error) {
    throw new Error(`Error creating restaurant: ${error.message}`);
  }
};

/**
 * Update restaurant
 */
const updateRestaurant = async (id, updateData) => {
  try {
    // If owner is being updated (Transfer Owner feature)
    if (updateData.owner) {
      const User = require("../models/user.model");

      // 1. Check if the new owner exists and is a brand
      const newOwner = await User.findById(updateData.owner);
      if (!newOwner) {
        throw new Error("New owner (User) not found");
      }
      if (newOwner.role !== "brand") {
        throw new Error("The new owner must have the 'brand' role");
      }

      // 2. Check if the new owner already has another restaurant
      const existingRestaurant = await Restaurant.findOne({
        owner: updateData.owner,
        _id: { $ne: id }, // Exclude the current restaurant being updated
      });

      if (existingRestaurant) {
        throw new Error(
          "This brand already owns another restaurant. Cannot transfer ownership.",
        );
      }
    }

    const restaurant = await Restaurant.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });
    if (!restaurant) {
      throw new Error("Restaurant not found");
    }
    return restaurant;
  } catch (error) {
    throw new Error(`Error updating restaurant: ${error.message}`);
  }
};

/**
 * Delete restaurant
 */
const deleteRestaurant = async (id) => {
  try {
    // Check if restaurant has any products
    const productCount = await Product.countDocuments({ restaurantId: id });
    if (productCount > 0) {
      throw new Error(
        `Không thể xóa thương hiệu này vì đang có ${productCount} sản phẩm. Vui lòng xóa hết sản phẩm trước khi xóa thương hiệu.`,
      );
    }

    const restaurant = await Restaurant.findByIdAndDelete(id);
    if (!restaurant) {
      throw new Error("Restaurant not found");
    }
    return restaurant;
  } catch (error) {
    throw new Error(error.message);
  }
};

/**
 * Get top rated restaurants
 */
const getTopRatedRestaurants = async (limit = 10) => {
  try {
    const restaurants = await Restaurant.find().sort({ rating: -1 }).limit(limit);
    return await attachPromotionsToRestaurants(restaurants);
  } catch (error) {
    throw new Error(`Error fetching top rated restaurants: ${error.message}`);
  }
};

/**
 * Get flash sale restaurants
 */
const getFlashSaleRestaurants = async (limit = 10) => {
  try {
    const now = new Date();
    // Get IDs of restaurants with active promotions
    const promotedRestaurants = await Promotion.distinct("restaurantId", {
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now }
    });

    const restaurants = await Restaurant.find({ 
      $or: [
        { isFlashSale: true },
        { _id: { $in: promotedRestaurants } }
      ]
    })
      .sort({ discountPercent: -1 })
      .limit(limit);

    return await attachPromotionsToRestaurants(restaurants);
  } catch (error) {
    throw new Error(`Error fetching flash sale restaurants: ${error.message}`);
  }
};

/**
 * Filter restaurants by tags
 */
const getRestaurantsByTags = async (tags, limit = 10) => {
  try {
    const restaurants = await Restaurant.find({ tags: { $in: tags } })
      .sort({ rating: -1 })
      .limit(limit);
    return await attachPromotionsToRestaurants(restaurants);
  } catch (error) {
    throw new Error(`Error fetching restaurants by tags: ${error.message}`);
  }
};

/**
 * Get most ordered restaurants with totalOrders field
 */
const getMostOrderedRestaurants = async (limit = 10) => {
  try {
    const restaurants = await Restaurant.find({ totalOrders: { $gt: 0 } })
      .populate("owner", "fullName email")
      .sort({ totalOrders: -1, rating: -1 })
      .limit(limit);
    return await attachPromotionsToRestaurants(restaurants);
  } catch (error) {
    throw new Error(
      `Error fetching most ordered restaurants: ${error.message}`,
    );
  }
};

/**
 * Get restaurant by owner ID (for brand users)
 */
const getRestaurantByOwner = async (ownerId) => {
  try {
    const restaurant = await Restaurant.findOne({ owner: ownerId }).populate(
      "owner",
      "fullName email",
    );
    return restaurant; // Returns null if not found
  } catch (error) {
    throw new Error(`Error fetching restaurant by owner: ${error.message}`);
  }
};

module.exports = {
  getAllRestaurants,
  getRestaurantById,
  createRestaurant,
  adminCreateRestaurant,
  updateRestaurant,
  deleteRestaurant,
  getTopRatedRestaurants,
  getFlashSaleRestaurants,
  getRestaurantsByTags,
  getMostOrderedRestaurants,
  getRestaurantByOwner,
};
