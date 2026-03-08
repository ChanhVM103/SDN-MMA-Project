const Review = require("../models/review.model");
const Order = require("../models/order.model");

// @desc    Create new review
// @route   POST /api/reviews
// @access  Private (User)
exports.createReview = async (req, res) => {
  try {
    const { rating, comment, restaurantId, orderId } = req.body;
    const userId = req.user._id;

    // Temporary bypass for FE mock orders
    // const order = await Order.findOne({
    //   _id: orderId,
    //   user: userId,
    //   restaurant: restaurantId,
    // });

    // if (!order) {
    //   return res.status(404).json({
    //     success: false,
    //     message: "Order not found or does not belong to you",
    //   });
    // }

    // if (order.status !== "delivered") {
    //   return res.status(400).json({
    //     success: false,
    //     message: "You can only review an order after it has been delivered",
    //   });
    // }

    // 3. Check if user already reviewed this order (we also have a DB index for this)
    const existingReview = await Review.findOne({ order: orderId, user: userId });
    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: "You have already reviewed this order",
      });
    }

    // 4. Create the review
    const review = await Review.create({
      rating,
      comment,
      restaurant: restaurantId,
      user: userId,
      order: orderId,
    });

    res.status(201).json({
      success: true,
      message: "Review submitted successfully",
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
