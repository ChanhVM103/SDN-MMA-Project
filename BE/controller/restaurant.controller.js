const restaurantService = require("../services/restaurant.services");

const isBlank = (value) =>
  value === undefined ||
  value === null ||
  (typeof value === "string" && value.trim() === "");

const parseTags = (tags) => {
  if (Array.isArray(tags)) {
    return tags
      .map((tag) => (typeof tag === "string" ? tag.trim() : ""))
      .filter(Boolean);
  }
  if (typeof tags === "string") {
    return tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
  }
  return [];
};

const validateAndBuildRestaurantData = (payload) => {
  const requiredStringFields = [
    "name",
    "image",
    "distance",
    "address",
    "phone",
    "description",
    "openingHours",
  ];

  for (const field of requiredStringFields) {
    if (isBlank(payload[field])) {
      throw new Error(`Field '${field}' is required`);
    }
  }

  const tags = parseTags(payload.tags);
  if (!Array.isArray(tags) || tags.length === 0) {
    throw new Error(
      "Field 'tags' is required and must contain at least one tag",
    );
  }

  if (!["food", "drink"].includes(payload.type)) {
    throw new Error("Field 'type' must be either 'food' or 'drink'");
  }

  if (typeof payload.isFlashSale !== "boolean") {
    throw new Error("Field 'isFlashSale' must be a boolean");
  }

  if (typeof payload.isOpen !== "boolean") {
    throw new Error("Field 'isOpen' must be a boolean");
  }

  const numericFields = [
    "rating",
    "reviews",
    "discountPercent",
    "deliveryTime",
    "deliveryFee",
    "latitude",
    "longitude",
  ];

  for (const field of numericFields) {
    if (typeof payload[field] !== "number" || Number.isNaN(payload[field])) {
      throw new Error(`Field '${field}' must be a number`);
    }
  }

  if (payload.rating < 0 || payload.rating > 5) {
    throw new Error("Field 'rating' must be between 0 and 5");
  }

  if (payload.reviews < 0) {
    throw new Error("Field 'reviews' must be greater than or equal to 0");
  }

  if (payload.discountPercent < 0 || payload.discountPercent > 100) {
    throw new Error("Field 'discountPercent' must be between 0 and 100");
  }

  if (payload.deliveryTime < 0 || payload.deliveryFee < 0) {
    throw new Error(
      "Fields 'deliveryTime' and 'deliveryFee' must be greater than or equal to 0",
    );
  }

  return {
    name: payload.name.trim(),
    image: payload.image.trim(),
    rating: payload.rating,
    reviews: payload.reviews,
    distance: payload.distance.trim(),
    tags,
    type: payload.type,
    isFlashSale: payload.isFlashSale,
    discountPercent: payload.discountPercent,
    deliveryTime: payload.deliveryTime,
    deliveryFee: payload.deliveryFee,
    isOpen: payload.isOpen,
    address: payload.address.trim(),
    phone: payload.phone.trim(),
    description: payload.description.trim(),
    openingHours: payload.openingHours.trim(),
    latitude: payload.latitude,
    longitude: payload.longitude,
  };
};

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
      type = "",
      sortBy = "rating",
      sortOrder = -1,
    } = req.query;

    const result = await restaurantService.getAllRestaurants(
      parseInt(page),
      parseInt(limit),
      search,
      type,
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
    const restaurantData = validateAndBuildRestaurantData(req.body);

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
 * POST /api/restaurants/admin-create
 * Admin creates a new restaurant and assigns to a brand owner
 */
const adminCreateRestaurant = async (req, res) => {
  try {
    const { ownerId } = req.body;

    if (!ownerId) {
      return res
        .status(400)
        .json({ success: false, message: "Owner ID is required" });
    }
    const restaurantData = validateAndBuildRestaurantData(req.body);

    const restaurant = await restaurantService.adminCreateRestaurant(
      restaurantData,
      ownerId,
    );

    res.status(201).json({
      success: true,
      message: "Restaurant created and assigned to brand successfully",
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
    const updateData = validateAndBuildRestaurantData(req.body);
    if (req.body.owner) {
      updateData.owner = req.body.owner;
    }

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

/**
 * GET /api/restaurants/my-restaurant
 * Get restaurant owned by current brand user
 */
const getMyRestaurant = async (req, res) => {
  try {
    const userId = req.userId; // From authMiddleware

    const restaurant = await restaurantService.getRestaurantByOwner(userId);

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: "No restaurant found for this brand owner",
      });
    }

    res.status(200).json({
      success: true,
      message: "Restaurant fetched successfully",
      data: restaurant,
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
  adminCreateRestaurant,
  updateRestaurant,
  deleteRestaurant,
  getTopRatedRestaurants,
  getFlashSaleRestaurants,
  getRestaurantsByTags,
  getMyRestaurant,
};
