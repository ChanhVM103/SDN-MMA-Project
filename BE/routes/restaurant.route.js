var express = require("express");
var router = express.Router();
var restaurantController = require("../controller/restaurant.controller");
var productController = require("../controller/product.controller");
var {
  authMiddleware,
  authorizeRole,
} = require("../middleware/auth.middleware");

/**
 * Special Routes - Public (no auth required)
 */
// Get top rated restaurants
router.get("/special/top-rated", restaurantController.getTopRatedRestaurants);

// Get flash sale restaurants
router.get("/special/flash-sale", restaurantController.getFlashSaleRestaurants);

// Get restaurants by tags
router.get("/special/tags/:tags", restaurantController.getRestaurantsByTags);

/**
 * CRUD Routes
 */
// Get all restaurants with pagination and search - Public
router.get("/", restaurantController.getAllRestaurants);

// Get restaurant by ID - Public
router.get("/:id", restaurantController.getRestaurantById);

// Create a new restaurant - Admin, Brand
router.post(
  "/",
  authMiddleware,
  authorizeRole("admin", "brand"),
  restaurantController.createRestaurant,
);

// Admin explicitly creates a restaurant for a Brand owner
router.post(
  "/admin-create",
  authMiddleware,
  authorizeRole("admin"),
  restaurantController.adminCreateRestaurant,
);

// Update restaurant - Admin, Brand
router.put(
  "/:id",
  authMiddleware,
  authorizeRole("admin", "brand"),
  restaurantController.updateRestaurant,
);

// Delete restaurant - Admin only
router.delete(
  "/:id",
  authMiddleware,
  authorizeRole("admin"),
  restaurantController.deleteRestaurant,
);

module.exports = router;
