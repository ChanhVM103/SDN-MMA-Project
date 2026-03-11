const productService = require("../services/product.services");


/**
 * GET /api/products
 * Get all products with pagination, search, and filtering
 */
const getAllProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      restaurantId = null,
      category = null,
      sortBy = "createdAt",
      sortOrder = -1,
    } = req.query;

    const result = await productService.getAllProducts(
      parseInt(page),
      parseInt(limit),
      search,
      restaurantId,
      category,
      sortBy,
      parseInt(sortOrder),
    );

    res.status(200).json({
      success: true,
      message: "Products fetched successfully",
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
 * GET /api/products/:id
 * Get product by ID
 */
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await productService.getProductById(id);

    res.status(200).json({
      success: true,
      message: "Product fetched successfully",
      data: product,
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * POST /api/products
 * Create a new product
 */
const createProduct = async (req, res) => {
  try {
    const {
      restaurantId,
      name,
      price,
      image,
      category,
      type,
      addons,
      isBestSeller,
      description,
      isAvailable,
    } = req.body;

    // Validation
    if (!restaurantId) {
      return res.status(400).json({
        success: false,
        message: "Restaurant ID is required",
      });
    }

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Product name is required",
      });
    }

    if (price === undefined || price === null) {
      return res.status(400).json({
        success: false,
        message: "Product price is required",
      });
    }

    if (!image) {
      return res.status(400).json({
        success: false,
        message: "Product image is required",
      });
    }

    const productData = {
      restaurantId,
      name,
      price,
      image,
      category: category || "",
      type: type || "food",
      addons: Array.isArray(addons) ? addons : [],
      isBestSeller: isBestSeller || false,
      description: description || "",
      isAvailable: isAvailable !== undefined ? isAvailable : true,
    };

    const product = await productService.createProduct(productData);

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: product,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * PUT /api/products/:id
 * Update product
 */
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const product = await productService.updateProduct(id, updateData);

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      data: product,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * DELETE /api/products/:id
 * Delete product
 */
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    await productService.deleteProduct(id);

    res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * GET /api/products/special/best-seller
 * Get best seller products
 */
const getBestSellerProducts = async (req, res) => {
  try {
    const { restaurantId = null, limit = 10 } = req.query;

    const products = await productService.getBestSellerProducts(
      restaurantId,
      parseInt(limit),
    );

    res.status(200).json({
      success: true,
      message: "Best seller products fetched successfully",
      data: products,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * GET /api/products/restaurant/:restaurantId
 * Get products by restaurant
 */
const getProductsByRestaurant = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { page = 1, limit = 10, category = null } = req.query;

    const result = await productService.getProductsByRestaurant(
      restaurantId,
      parseInt(page),
      parseInt(limit),
      category,
    );

    res.status(200).json({
      success: true,
      message: "Products by restaurant fetched successfully",
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
 * GET /api/products/category/:category
 * Get products by category
 */
const getProductsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const result = await productService.getProductsByCategory(
      category,
      parseInt(page),
      parseInt(limit),
    );

    res.status(200).json({
      success: true,
      message: "Products by category fetched successfully",
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
 * GET /api/products/special/available
 * Get available products
 */
const getAvailableProducts = async (req, res) => {
  try {
    const { restaurantId = null, limit = 10 } = req.query;

    const products = await productService.getAvailableProducts(
      restaurantId,
      parseInt(limit),
    );

    res.status(200).json({
      success: true,
      message: "Available products fetched successfully",
      data: products,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * POST /api/restaurants/:restaurantId/products
 * Create product for restaurant
 */
const createProductForRestaurant = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const {
      name,
      price,
      image,
      category,
      type,
      addons,
      description,
      isBestSeller,
      isAvailable,
    } = req.body;

    // Validation
    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Product name is required",
      });
    }

    if (price === undefined || price === null) {
      return res.status(400).json({
        success: false,
        message: "Product price is required",
      });
    }

    if (!image) {
      return res.status(400).json({
        success: false,
        message: "Product image is required",
      });
    }

    const productData = {
      name,
      price,
      image,
      category: category || "",
      type: type || "food",
      addons: Array.isArray(addons) ? addons : [],
      description: description || "",
      isBestSeller: isBestSeller || false,
      isAvailable: isAvailable !== undefined ? isAvailable : true,
    };

    const product = await productService.createProductForRestaurant(
      restaurantId,
      productData,
    );

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: product,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * PUT /api/restaurants/:restaurantId/products/:productId
 * Update product (only restaurant owner)
 */
const updateProductForRestaurant = async (req, res) => {
  try {
    const { restaurantId, productId } = req.params;
    const updateData = req.body;

    const product = await productService.updateProductForRestaurant(
      productId,
      restaurantId,
      updateData,
    );

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      data: product,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * DELETE /api/restaurants/:restaurantId/products/:productId
 * Delete product (only restaurant owner)
 */
const deleteProductForRestaurant = async (req, res) => {
  try {
    const { restaurantId, productId } = req.params;

    await productService.deleteProductForRestaurant(productId, restaurantId);

    res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getBestSellerProducts,
  getProductsByRestaurant,
  getProductsByCategory,
  getAvailableProducts,
  createProductForRestaurant,
  updateProductForRestaurant,
  deleteProductForRestaurant,
};
