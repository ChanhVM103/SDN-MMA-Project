const Review = require("../models/review.model");
const Order = require("../models/order.model");

// @desc    Tạo đánh giá (nhà hàng tổng thể hoặc từng món ăn)
// @route   POST /api/reviews
// @access  Private (User)
// Body: { rating, comment, restaurantId, orderId, productId?, productName? }
exports.createReview = async (req, res) => {
  try {
    const { rating, comment, restaurantId, orderId, productId, productName } = req.body;
    const userId = req.userId;

    if (!rating || !restaurantId || !orderId) {
      return res.status(400).json({
        success: false,
        message: "rating, restaurantId và orderId là bắt buộc",
      });
    }

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

    // Check if user already reviewed this item (order or product)
    const existingReview = await Review.findOne({
      order: orderId,
      user: userId,
      product: productId || null,
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: productId
          ? "Bạn đã đánh giá món này rồi"
          : "Bạn đã đánh giá đơn hàng này rồi",
      });
    }

    // Create the review
    const review = await Review.create({
      rating,
      comment: comment || "",
      restaurant: restaurantId || order.restaurant,
      user: userId,
      order: orderId,
      product: productId || null,
      productName: productName || "",
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
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Bạn đã đánh giá mục này rồi",
      });
    }
    res.status(500).json({
      success: false,
      message: "Lỗi server khi tạo đánh giá",
      error: error.message,
    });
  }
};

// @desc    Gửi nhiều đánh giá cùng lúc (đánh giá tổng + từng món)
// @route   POST /api/reviews/bulk
// @access  Private (User)
// Body: { orderId, restaurantId, reviews: [{ rating, comment, productId?, productName? }] }
exports.createBulkReviews = async (req, res) => {
  try {
    const { orderId, restaurantId, reviews } = req.body;
    const userId = req.userId;

    if (!orderId || !restaurantId || !Array.isArray(reviews) || reviews.length === 0) {
      return res.status(400).json({
        success: false,
        message: "orderId, restaurantId và reviews[] là bắt buộc",
      });
    }

    // Kiểm tra đơn hàng
    const order = await Order.findOne({ _id: orderId, user: userId });
    if (!order) {
      return res.status(404).json({ success: false, message: "Không tìm thấy đơn hàng" });
    }
    if (order.status !== "delivered") {
      return res.status(400).json({ success: false, message: "Đơn hàng chưa được giao" });
    }

    // Tạo tất cả review, bỏ qua trùng lặp
    const results = [];
    const errors = [];

    for (const r of reviews) {
      try {
        const existing = await Review.findOne({
          order: orderId,
          user: userId,
          product: r.productId || null,
        });
        if (existing) {
          errors.push({ productId: r.productId || null, message: "Đã đánh giá rồi" });
          continue;
        }

        const created = await Review.create({
          rating: r.rating,
          comment: r.comment || "",
          restaurant: restaurantId,
          user: userId,
          order: orderId,
          product: r.productId || null,
          productName: r.productName || "",
        });
        results.push(created);
      } catch (err) {
        if (err.code !== 11000) throw err;
        errors.push({ productId: r.productId || null, message: "Đã đánh giá rồi" });
      }
    }

    res.status(201).json({
      success: true,
      message: `Đã gửi ${results.length} đánh giá`,
      data: results,
      skipped: errors,
    });
  } catch (error) {
    console.error("Error creating bulk reviews:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi tạo đánh giá",
      error: error.message,
    });
  }
};

// @desc    Lấy đánh giá của 1 nhà hàng (chỉ review tổng thể)
// @route   GET /api/reviews/restaurant/:restaurantId
// @access  Public
exports.getRestaurantReviews = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;

    const query = { restaurant: restaurantId, product: null };

    const reviews = await Review.find(query)
      .populate({ path: "user", select: "fullName avatar" })
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
      message: "Lỗi server khi lấy đánh giá",
      error: error.message,
    });
  }
};

// @desc    Lấy đánh giá theo từng món ăn
// @route   GET /api/reviews/product/:productId
// @access  Public
exports.getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;

    const query = { product: productId };

    const reviews = await Review.find(query)
      .populate({ path: "user", select: "fullName avatar" })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Review.countDocuments(query);

    // Tính avg rating cho sản phẩm
    const stats = await Review.aggregate([
      { $match: { product: require("mongoose").Types.ObjectId.createFromHexString(productId) } },
      { $group: { _id: "$product", avgRating: { $avg: "$rating" }, count: { $sum: 1 } } },
    ]);

    res.status(200).json({
      success: true,
      count: reviews.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      avgRating: stats[0] ? Math.round(stats[0].avgRating * 10) / 10 : 0,
      data: reviews,
    });
  } catch (error) {
    console.error("Error fetching product reviews:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy đánh giá sản phẩm",
      error: error.message,
    });
  }
};

// @desc    Kiểm tra user đã review order này chưa
// @route   GET /api/reviews/check/:orderId
// @access  Private
exports.checkOrderReviewed = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.userId;

    const reviews = await Review.find({ order: orderId, user: userId });

    res.status(200).json({
      success: true,
      data: {
        reviewed: reviews.length > 0,
        reviews,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi server", error: error.message });
  }
};

// @desc    Cập nhật đánh giá
// @route   PUT /api/reviews/:id
// @access  Private
exports.updateReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const userId = req.userId;

    if (!req.params.id || req.params.id.length !== 24) {
      return res.status(400).json({ success: false, message: "ID đánh giá không hợp lệ" });
    }

    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ success: false, message: "Không tìm thấy đánh giá" });
    if (review.user.toString() !== userId.toString())
      return res.status(403).json({ success: false, message: "Không có quyền sửa đánh giá này" });

    if (rating !== undefined) review.rating = rating;
    if (comment !== undefined) review.comment = comment;
    await review.save();

    res.status(200).json({ success: true, message: "Đã cập nhật đánh giá", data: review });
  } catch (error) {
    console.error("updateReview error:", error);
    res.status(500).json({ success: false, message: "Lỗi server: " + error.message });
  }
};

// @desc    Xóa đánh giá
// @route   DELETE /api/reviews/:id
// @access  Private
exports.deleteReview = async (req, res) => {
  try {
    const userId = req.userId;

    if (!req.params.id || req.params.id.length !== 24) {
      return res.status(400).json({ success: false, message: "ID đánh giá không hợp lệ" });
    }

    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ success: false, message: "Không tìm thấy đánh giá" });
    if (review.user.toString() !== userId.toString())
      return res.status(403).json({ success: false, message: "Không có quyền xóa đánh giá này" });

    await Review.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: "Đã xóa đánh giá" });
  } catch (error) {
    console.error("deleteReview error:", error);
    res.status(500).json({ success: false, message: "Lỗi server: " + error.message });
  }
};
