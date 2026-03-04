var express = require("express");
var router = express.Router();
var productController = require("../controller/product.controller");
var {
  authMiddleware,
  authorizeRole,
} = require("../middleware/auth.middleware");

/**
 * CRUD Routes
 */
// Get all products with pagination and search - Public
router.get("/", productController.getAllProducts);

// Get product by ID - Public
router.get("/:id", productController.getProductById);

// Create a new product - Admin, Brand
router.post(
  "/",
  authMiddleware,
  authorizeRole("admin", "brand"),
  productController.createProduct,
);

// Update product - Admin, Brand
router.put(
  "/:id",
  authMiddleware,
  authorizeRole("admin", "brand"),
  productController.updateProduct,
);

// Delete product - Admin only
router.delete(
  "/:id",
  authMiddleware,
  authorizeRole("admin"),
  productController.deleteProduct,
);

/**
 * Special Routes - Public (no auth required)
 */
// Get best seller products
router.get("/special/best-seller", productController.getBestSellerProducts);

// Get available products
router.get("/special/available", productController.getAvailableProducts);

// Get products by restaurant - Public
router.get(
  "/restaurant/:restaurantId",
  productController.getProductsByRestaurant,
);

// Get products by category - Public
router.get("/category/:category", productController.getProductsByCategory);

/**
 * Restaurant Product Management Routes
 * Allow restaurants to manage their products - Admin, Brand
 */
// Create product for restaurant
router.post(
  "/restaurant/:restaurantId/products",
  authMiddleware,
  authorizeRole( "brand"),
  productController.createProductForRestaurant,
);

// Update product for restaurant (only owner) - Admin, Brand
router.put(
  "/restaurant/:restaurantId/products/:productId",
  authMiddleware,
  authorizeRole("brand"),
  productController.updateProductForRestaurant,
);

// Delete product for restaurant (only owner) - Admin, Brand
router.delete(
  "/restaurant/:restaurantId/products/:productId",
  authMiddleware,
  authorizeRole("brand"),
  productController.deleteProductForRestaurant,
);

module.exports = router;

module.exports = router;
