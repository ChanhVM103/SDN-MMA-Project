const Restaurant = require("../models/restaurant.model");

/**
 * Get all restaurants with pagination, search, and filtering
 */
const getAllRestaurants = async (
  page = 1,
  limit = 10,
  search = "",
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

    // Get total count for pagination
    const total = await Restaurant.countDocuments(query);

    // Fetch restaurants with sorting
    const restaurants = await Restaurant.find(query)
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
 * Create a new restaurant
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
 * Update restaurant
 */
const updateRestaurant = async (id, updateData) => {
  try {
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

module.exports = {
  getAllRestaurants,
  getRestaurantById,
  createRestaurant,
  updateRestaurant,
  deleteRestaurant,
  getTopRatedRestaurants,
  getFlashSaleRestaurants,
  getRestaurantsByTags,
};
