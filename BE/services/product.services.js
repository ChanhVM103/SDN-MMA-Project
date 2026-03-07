const Product = require("../models/product.model");

const PRODUCT_SELECT_FIELDS =
  "restaurantId name price image category type allowToppings isBestSeller description isAvailable createdAt updatedAt";

const sanitizeUpdateData = (updateData = {}) => {
  const safeData = { ...updateData };
  delete safeData.thumbnail;
  delete safeData.images;
  return safeData;
};

/**
 * Get all products with pagination, search, and filtering
 */
const getAllProducts = async (
  page = 1,
  limit = 10,
  search = "",
  restaurantId = null,
  category = null,
  sortBy = "createdAt",
  sortOrder = -1,
) => {
  try {
    const skip = (page - 1) * limit;

    // Build query
    let query = {};
    if (search) {
      query = { $text: { $search: search } };
    }
    if (restaurantId) {
      query.restaurantId = restaurantId;
    }
    if (category) {
      query.category = category;
    }

    // Get total count for pagination
    const total = await Product.countDocuments(query);

    // Fetch products with sorting
    const products = await Product.find(query)
      .select(PRODUCT_SELECT_FIELDS)
      .populate("restaurantId", "name image")
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit);

    return {
      data: products,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalRecords: total,
        limit,
      },
    };
  } catch (error) {
    throw new Error(`Error fetching products: ${error.message}`);
  }
};

/**
 * Get product by ID
 */
const getProductById = async (id) => {
  try {
    const product = await Product.findById(id)
      .select(PRODUCT_SELECT_FIELDS)
      .populate("restaurantId", "name image");
    if (!product) {
      throw new Error("Product not found");
    }
    return product;
  } catch (error) {
    throw new Error(`Error fetching product: ${error.message}`);
  }
};

/**
 * Create a new product
 */
const createProduct = async (productData) => {
  try {
    const product = new Product(productData);
    await product.save();
    await product.populate("restaurantId", "name image");
    return await Product.findById(product._id)
      .select(PRODUCT_SELECT_FIELDS)
      .populate("restaurantId", "name image");
  } catch (error) {
    throw new Error(`Error creating product: ${error.message}`);
  }
};

/**
 * Update product
 */
const updateProduct = async (id, updateData) => {
  try {
    const safeUpdateData = sanitizeUpdateData(updateData);
    const product = await Product.findByIdAndUpdate(id, safeUpdateData, {
      new: true,
      runValidators: true,
    })
      .select(PRODUCT_SELECT_FIELDS)
      .populate("restaurantId", "name image");
    if (!product) {
      throw new Error("Product not found");
    }
    return product;
  } catch (error) {
    throw new Error(`Error updating product: ${error.message}`);
  }
};

/**
 * Delete product
 */
const deleteProduct = async (id) => {
  try {
    const product = await Product.findByIdAndDelete(id);
    if (!product) {
      throw new Error("Product not found");
    }
    return product;
  } catch (error) {
    throw new Error(`Error deleting product: ${error.message}`);
  }
};

/**
 * Get best seller products
 */
const getBestSellerProducts = async (restaurantId = null, limit = 10) => {
  try {
    let query = { isBestSeller: true };
    if (restaurantId) {
      query.restaurantId = restaurantId;
    }

    return await Product.find(query)
      .select(PRODUCT_SELECT_FIELDS)
      .populate("restaurantId", "name image")
      .sort({ createdAt: -1 })
      .limit(limit);
  } catch (error) {
    throw new Error(`Error fetching best seller products: ${error.message}`);
  }
};

/**
 * Get products by restaurant
 */
const getProductsByRestaurant = async (
  restaurantId,
  page = 1,
  limit = 10,
  category = null,
) => {
  try {
    const skip = (page - 1) * limit;

    let query = { restaurantId };
    if (category) {
      query.category = category;
    }

    const total = await Product.countDocuments(query);

    const products = await Product.find(query)
      .select(PRODUCT_SELECT_FIELDS)
      .populate("restaurantId", "name image")
      .sort({ isBestSeller: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return {
      data: products,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalRecords: total,
        limit,
      },
    };
  } catch (error) {
    throw new Error(`Error fetching products by restaurant: ${error.message}`);
  }
};

/**
 * Get products by category
 */
const getProductsByCategory = async (category, page = 1, limit = 10) => {
  try {
    const skip = (page - 1) * limit;

    const total = await Product.countDocuments({ category });

    const products = await Product.find({ category })
      .select(PRODUCT_SELECT_FIELDS)
      .populate("restaurantId", "name image")
      .sort({ isBestSeller: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return {
      data: products,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalRecords: total,
        limit,
      },
    };
  } catch (error) {
    throw new Error(`Error fetching products by category: ${error.message}`);
  }
};

/**
 * Get available products
 */
const getAvailableProducts = async (restaurantId = null, limit = 10) => {
  try {
    let query = { isAvailable: true };
    if (restaurantId) {
      query.restaurantId = restaurantId;
    }

    return await Product.find(query)
      .select(PRODUCT_SELECT_FIELDS)
      .populate("restaurantId", "name image")
      .sort({ isBestSeller: -1, price: 1 })
      .limit(limit);
  } catch (error) {
    throw new Error(`Error fetching available products: ${error.message}`);
  }
};

/**
 * Create product for restaurant
 */
const createProductForRestaurant = async (restaurantId, productData) => {
  try {
    const product = new Product({
      restaurantId,
      ...productData,
    });
    await product.save();
    await product.populate("restaurantId", "name image");
    return await Product.findById(product._id)
      .select(PRODUCT_SELECT_FIELDS)
      .populate("restaurantId", "name image");
  } catch (error) {
    throw new Error(`Error creating product: ${error.message}`);
  }
};

/**
 * Update product for restaurant (only owner)
 */
const updateProductForRestaurant = async (
  productId,
  restaurantId,
  updateData,
) => {
  try {
    const product = await Product.findById(productId);
    const safeUpdateData = sanitizeUpdateData(updateData);

    if (!product) {
      throw new Error("Product not found");
    }

    // Kiểm tra xem product có thuộc restaurantId này không
    if (product.restaurantId.toString() !== restaurantId.toString()) {
      throw new Error("You don't have permission to update this product");
    }

    Object.assign(product, safeUpdateData);
    await product.save();
    await product.populate("restaurantId", "name image");
    return await Product.findById(product._id)
      .select(PRODUCT_SELECT_FIELDS)
      .populate("restaurantId", "name image");
  } catch (error) {
    throw new Error(`Error updating product: ${error.message}`);
  }
};

/**
 * Delete product for restaurant (only owner)
 */
const deleteProductForRestaurant = async (productId, restaurantId) => {
  try {
    const product = await Product.findById(productId);

    if (!product) {
      throw new Error("Product not found");
    }

    // Kiểm tra xem product có thuộc restaurantId này không
    if (product.restaurantId.toString() !== restaurantId.toString()) {
      throw new Error("You don't have permission to delete this product");
    }

    return await Product.findByIdAndDelete(productId);
  } catch (error) {
    throw new Error(`Error deleting product: ${error.message}`);
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
