var express = require("express");
var router = express.Router();
var productController = require("../controller/product.controller");

/**
 * CRUD Routes
 */
// Get all products with pagination and search
router.get("/", productController.getAllProducts);

// Get product by ID
router.get("/:id", productController.getProductById);

// Create a new product
router.post("/", productController.createProduct);

// Update product
router.put("/:id", productController.updateProduct);

// Delete product
router.delete("/:id", productController.deleteProduct);

/**
 * Special Routes (must be before /:id routes)
 */
// Get best seller products
router.get("/special/best-seller", productController.getBestSellerProducts);

// Get available products
router.get("/special/available", productController.getAvailableProducts);

// Get products by restaurant
router.get(
  "/restaurant/:restaurantId",
  productController.getProductsByRestaurant,
);

// Get products by category
router.get("/category/:category", productController.getProductsByCategory);

/**
 * Restaurant Product Management Routes
 * Allow restaurants to manage their products
 */
// Create product for restaurant
router.post(
  "/restaurant/:restaurantId/products",
  productController.createProductForRestaurant,
);

// Update product for restaurant (only owner)
router.put(
  "/restaurant/:restaurantId/products/:productId",
  productController.updateProductForRestaurant,
);

// Delete product for restaurant (only owner)
router.delete(
  "/restaurant/:restaurantId/products/:productId",
  productController.deleteProductForRestaurant,
);

module.exports = router;
