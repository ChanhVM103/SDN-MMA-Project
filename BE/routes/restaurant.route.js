var express = require("express");
var router = express.Router();
var restaurantController = require("../controller/restaurant.controller");
var productController = require("../controller/product.controller");

/**
 *
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
// Get all restaurants with pagination and search
router.get("/", restaurantController.getAllRestaurants);

// Get restaurant by ID
router.get("/:id", restaurantController.getRestaurantById);

// Create a new restaurant
router.post("/", restaurantController.createRestaurant);

// Update restaurant
router.put("/:id", restaurantController.updateRestaurant);

// Delete restaurant
router.delete("/:id", restaurantController.deleteRestaurant);

module.exports = router;
