const restaurantService = require("../services/restaurant.services");

/**
 * GET /api/restaurants
 * Get all restaurants with pagination and search
 */
const getAllRestaurants = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      sortBy = "rating",
      sortOrder = -1,
    } = req.query;

    const result = await restaurantService.getAllRestaurants(
      parseInt(page),
      parseInt(limit),
      search,
      sortBy,
      parseInt(sortOrder),
    );

    res.status(200).json({
      success: true,
      message: "Restaurants fetched successfully",
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * GET /api/restaurants/:id
 * Get restaurant by ID
 */
const getRestaurantById = async (req, res) => {
  try {
    const { id } = req.params;

    const restaurant = await restaurantService.getRestaurantById(id);

    res.status(200).json({
      success: true,
      message: "Restaurant fetched successfully",
      data: restaurant,
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * POST /api/restaurants
 * Create a new restaurant
 */
const createRestaurant = async (req, res) => {
  try {
    const {
      name,
      image,
      rating,
      reviews,
      distance,
      tags,
      isFlashSale,
      discountPercent,
      deliveryTime,
      deliveryFee,
      isOpen,
      address,
      phone,
      description,
      openingHours,
      latitude,
      longitude,
    } = req.body;

    // Validation
    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Restaurant name is required",
      });
    }

    if (!image) {
      return res.status(400).json({
        success: false,
        message: "Restaurant image is required",
      });
    }

    if (deliveryTime === undefined) {
      return res.status(400).json({
        success: false,
        message: "Delivery time is required",
      });
    }

    if (deliveryFee === undefined) {
      return res.status(400).json({
        success: false,
        message: "Delivery fee is required",
      });
    }

    const restaurantData = {
      name,
      image,
      rating: rating || 0,
      reviews: reviews || 0,
      distance: distance || "",
      tags: tags || [],
      isFlashSale: isFlashSale || false,
      discountPercent: discountPercent || 0,
      deliveryTime,
      deliveryFee,
      isOpen: isOpen !== undefined ? isOpen : true,
      address: address || "",
      phone: phone || "",
      description: description || "",
      openingHours: openingHours || "",
      latitude,
      longitude,
    };

    const restaurant = await restaurantService.createRestaurant(restaurantData);

    res.status(201).json({
      success: true,
      message: "Restaurant created successfully",
      data: restaurant,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * PUT /api/restaurants/:id
 * Update restaurant
 */
const updateRestaurant = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const restaurant = await restaurantService.updateRestaurant(id, updateData);

    res.status(200).json({
      success: true,
      message: "Restaurant updated successfully",
      data: restaurant,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * DELETE /api/restaurants/:id
 * Delete restaurant
 */
const deleteRestaurant = async (req, res) => {
  try {
    const { id } = req.params;

    await restaurantService.deleteRestaurant(id);

    res.status(200).json({
      success: true,
      message: "Restaurant deleted successfully",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * GET /api/restaurants/top-rated
 * Get top rated restaurants
 */
const getTopRatedRestaurants = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const restaurants = await restaurantService.getTopRatedRestaurants(
      parseInt(limit),
    );

    res.status(200).json({
      success: true,
      message: "Top rated restaurants fetched successfully",
      data: restaurants,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * GET /api/restaurants/flash-sale
 * Get flash sale restaurants
 */
const getFlashSaleRestaurants = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const restaurants = await restaurantService.getFlashSaleRestaurants(
      parseInt(limit),
    );

    res.status(200).json({
      success: true,
      message: "Flash sale restaurants fetched successfully",
      data: restaurants,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * GET /api/restaurants/tags/:tags
 * Get restaurants by tags
 */
const getRestaurantsByTags = async (req, res) => {
  try {
    const { tags } = req.params;
    const { limit = 10 } = req.query;

    const tagsArray = tags.split(",").map((tag) => tag.trim());

    const restaurants = await restaurantService.getRestaurantsByTags(
      tagsArray,
      parseInt(limit),
    );

    res.status(200).json({
      success: true,
      message: "Restaurants by tags fetched successfully",
      data: restaurants,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
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
