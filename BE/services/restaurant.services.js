const Restaurant = require("../models/restaurant.model");

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

    // Build search query
    let query = {};
    if (search) {
      query = { $text: { $search: search } };
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

    return {
      data: restaurants,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalRecords: total,
        limit,
      },
    };
  } catch (error) {
    throw new Error(`Error fetching restaurants: ${error.message}`);
  }
};

/**
 * Get restaurant by ID
 */
const getRestaurantById = async (id) => {
  try {
    const restaurant = await Restaurant.findById(id);
    if (!restaurant) {
      throw new Error("Restaurant not found");
    }
    return restaurant;
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
    const restaurant = await Restaurant.findByIdAndDelete(id);
    if (!restaurant) {
      throw new Error("Restaurant not found");
    }
    return restaurant;
  } catch (error) {
    throw new Error(`Error deleting restaurant: ${error.message}`);
  }
};

/**
 * Get top rated restaurants
 */
const getTopRatedRestaurants = async (limit = 10) => {
  try {
    return await Restaurant.find().sort({ rating: -1 }).limit(limit);
  } catch (error) {
    throw new Error(`Error fetching top rated restaurants: ${error.message}`);
  }
};

/**
 * Get flash sale restaurants
 */
const getFlashSaleRestaurants = async (limit = 10) => {
  try {
    return await Restaurant.find({ isFlashSale: true })
      .sort({ discountPercent: -1 })
      .limit(limit);
  } catch (error) {
    throw new Error(`Error fetching flash sale restaurants: ${error.message}`);
  }
};

/**
 * Filter restaurants by tags
 */
const getRestaurantsByTags = async (tags, limit = 10) => {
  try {
    return await Restaurant.find({ tags: { $in: tags } })
      .sort({ rating: -1 })
      .limit(limit);
  } catch (error) {
    throw new Error(`Error fetching restaurants by tags: ${error.message}`);
  }
};

/**
 * Get most ordered restaurants with totalOrders field
 */
const getMostOrderedRestaurants = async (limit = 10) => {
  try {
    return await Restaurant.find({ totalOrders: { $gt: 0 } })
      .populate("owner", "fullName email")
      .sort({ totalOrders: -1, rating: -1 })
      .limit(limit);
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
