const Review = require("../models/review.model");
const Order = require("../models/order.model");

// @desc    Create new review
// @route   POST /api/reviews
// @access  Private (User)
exports.createReview = async (req, res) => {
  try {
    const { rating, comment, restaurantId, orderId } = req.body;
    const userId = req.userId;

    // Validate: order must exist, belong to user, and be delivered
    const order = await Order.findOne({
      _id: orderId,
      user: userId,
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Đơn hàng không tồn tại hoặc không thuộc về bạn",
      });
    }

    if (order.status !== "delivered") {
      return res.status(400).json({
        success: false,
        message: "Chỉ có thể đánh giá đơn hàng đã giao thành công",
      });
    }

    // Check if user already reviewed this order
    const existingReview = await Review.findOne({ order: orderId, user: userId });
    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: "Bạn đã đánh giá đơn hàng này rồi",
      });
    }

    // Create the review
    const review = await Review.create({
      rating,
      comment,
      restaurant: restaurantId || order.restaurant,
      user: userId,
      order: orderId,
    });

    // Mark order as reviewed
    await Order.findByIdAndUpdate(orderId, { isReviewed: true });

    res.status(201).json({
      success: true,
      message: "Đánh giá đã được gửi thành công",
      data: review,
    });
  } catch (error) {
    console.error("Error creating review:", error);
    // Handle Mongoose duplicate key error specifically if it reaches here
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "You have already reviewed this order",
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error while creating review",
      error: error.message,
    });
  }
};

// @desc    Get reviews for a specific restaurant
// @route   GET /api/reviews/restaurant/:restaurantId
// @access  Public
exports.getRestaurantReviews = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;

    const query = { restaurant: restaurantId };

    const reviews = await Review.find(query)
      .populate({
        path: "user",
        select: "fullName avatar",
      })
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit);

    const total = await Review.countDocuments(query);

    res.status(200).json({
      success: true,
      count: reviews.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      data: reviews,
    });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching reviews",
      error: error.message,
    });
  }
};
