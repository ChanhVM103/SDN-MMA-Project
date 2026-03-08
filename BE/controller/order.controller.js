const Order = require("../models/order.model");
const Restaurant = require("../models/restaurant.model");

const incrementRestaurantOrders = async (restaurantId) => {
  await Restaurant.findByIdAndUpdate(restaurantId, {
    $inc: { totalOrders: 1 },
  });
};

const decrementRestaurantOrders = async (restaurantId) => {
  await Restaurant.updateOne(
    { _id: restaurantId, totalOrders: { $gt: 0 } },
    { $inc: { totalOrders: -1 } },
  );
};

// Luồng trạng thái hợp lệ
const STATUS_FLOW = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["preparing", "cancelled"],
  preparing: ["delivering"],
  delivering: ["delivered"],
  delivered: [],
  cancelled: [],
};

// ════════════════════════════════════════════════
// USER ROUTES
// ════════════════════════════════════════════════

// ── POST /api/orders ──────────────────────────────
// User: Tạo đơn hàng mới
const createOrder = async (req, res) => {
  try {
    const {
      restaurantId,
      items,
      deliveryFee = 0,
      discount = 0,
      deliveryAddress,
      paymentMethod = "cash",
      note = "",
      estimatedDeliveryTime = 30,
    } = req.body;

    // Validate
    if (!restaurantId) {
      return res
        .status(400)
        .json({ success: false, message: "Vui lòng chọn nhà hàng" });
    }
    if (!items || items.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Đơn hàng phải có ít nhất 1 món" });
    }
    if (!deliveryAddress) {
      return res
        .status(400)
        .json({ success: false, message: "Vui lòng nhập địa chỉ giao hàng" });
    }

    // Kiểm tra nhà hàng tồn tại
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy nhà hàng" });
    }
    if (!restaurant.isOpen) {
      return res
        .status(400)
        .json({ success: false, message: "Nhà hàng hiện đang đóng cửa" });
    }

    // Tính tiền
    const subtotal = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );
    const total = subtotal + deliveryFee - discount;

    const order = await Order.create({
      user: req.userId,
      restaurant: restaurantId,
      restaurantName: restaurant.name,
      items,
      subtotal,
      deliveryFee,
      discount,
      total,
      deliveryAddress,
      paymentMethod,
      note,
      estimatedDeliveryTime,
      statusHistory: [
        {
          status: "pending",
          changedBy: req.userId,
          note: "Đơn hàng được tạo",
        },
      ],
    });

    await incrementRestaurantOrders(restaurantId);

    return res.status(201).json({
      success: true,
      message: "Đặt hàng thành công!",
      data: order,
    });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

// ── GET /api/orders/my ────────────────────────────
// User: Xem danh sách đơn hàng của mình
const getMyOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    const filter = { user: req.userId };
    if (status) filter.status = status;

    const total = await Order.countDocuments(filter);
    const orders = await Order.find(filter)
      .populate("restaurant", "name image deliveryTime")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    return res.json({
      success: true,
      data: orders,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/orders/:id ───────────────────────────
// User: Xem chi tiết 1 đơn hàng (chỉ xem được đơn của mình)
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("restaurant", "name image address phone deliveryTime")
      .populate("user", "fullName email phone");

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy đơn hàng" });
    }

    // User chỉ xem được đơn của mình, admin xem được tất cả
    if (req.userRole !== "admin" && order.user._id.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền xem đơn hàng này",
      });
    }

    return res.json({ success: true, data: order });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ── PATCH /api/orders/:id/cancel ─────────────────
// User: Hủy đơn (chỉ hủy được khi pending hoặc confirmed)
const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy đơn hàng" });
    }

    if (order.user.toString() !== req.userId) {
      return res
        .status(403)
        .json({ success: false, message: "Bạn không có quyền hủy đơn này" });
    }

    if (!["pending", "confirmed"].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: `Không thể hủy đơn hàng đang ở trạng thái "${order.status}"`,
      });
    }

    order.status = "cancelled";
    order.statusHistory.push({
      status: "cancelled",
      changedBy: req.userId,
      note: req.body.reason || "Khách hàng hủy đơn",
    });
    await order.save();
    await decrementRestaurantOrders(order.restaurant);

    return res.json({
      success: true,
      message: "Đã hủy đơn hàng thành công",
      data: order,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ════════════════════════════════════════════════
// ADMIN ROUTES
// ════════════════════════════════════════════════

// ── GET /api/orders ───────────────────────────────
// Admin: Xem tất cả đơn hàng (filter, search, phân trang)
const getAllOrders = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      restaurantId,
      userId,
      fromDate,
      toDate,
      sortBy = "createdAt",
      order = "desc",
    } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (restaurantId) filter.restaurant = restaurantId;
    if (userId) filter.user = userId;
    if (fromDate || toDate) {
      filter.createdAt = {};
      if (fromDate) filter.createdAt.$gte = new Date(fromDate);
      if (toDate) filter.createdAt.$lte = new Date(toDate);
    }

    const total = await Order.countDocuments(filter);
    const orders = await Order.find(filter)
      .populate("user", "fullName email phone")
      .populate("restaurant", "name image")
      .sort({ [sortBy]: order === "desc" ? -1 : 1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    return res.json({
      success: true,
      data: orders,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ── PATCH /api/orders/:id/status ─────────────────
// Admin: Cập nhật trạng thái đơn hàng
const updateOrderStatus = async (req, res) => {
  try {
    const { status, note } = req.body;

    if (!status) {
      return res
        .status(400)
        .json({ success: false, message: "Vui lòng cung cấp trạng thái mới" });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy đơn hàng" });
    }

    // Kiểm tra luồng trạng thái hợp lệ
    const allowedNext = STATUS_FLOW[order.status] || [];
    if (!allowedNext.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Không thể chuyển từ "${order.status}" sang "${status}". Cho phép: ${allowedNext.join(", ") || "không có"}`,
      });
    }

    order.status = status;
    if (status === "delivered" && order.paymentMethod === "cash") {
      order.isPaid = true;
      order.paidAmount = order.total;
      order.paidAt = new Date();
    }

    order.statusHistory.push({
      status,
      changedBy: req.userId,
      note: note || `Admin cập nhật sang ${status}`,
    });

    await order.save();

    if (status === "cancelled") {
      await decrementRestaurantOrders(order.restaurant);
    }

    return res.json({
      success: true,
      message: `Đã cập nhật trạng thái thành "${status}"`,
      data: order,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/orders/stats ─────────────────────────
// Admin: Thống kê đơn hàng
const getOrderStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      total,
      todayCount,
      pending,
      confirmed,
      preparing,
      delivering,
      delivered,
      cancelled,
      revenue,
    ] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ createdAt: { $gte: today } }),
      Order.countDocuments({ status: "pending" }),
      Order.countDocuments({ status: "confirmed" }),
      Order.countDocuments({ status: "preparing" }),
      Order.countDocuments({ status: "delivering" }),
      Order.countDocuments({ status: "delivered" }),
      Order.countDocuments({ status: "cancelled" }),
      Order.aggregate([
        { $match: { isPaid: true } },
        { $group: { _id: null, total: { $sum: "$paidAmount" } } },
      ]),
    ]);

    return res.json({
      success: true,
      data: {
        total,
        todayCount,
        byStatus: {
          pending,
          confirmed,
          preparing,
          delivering,
          delivered,
          cancelled,
        },
        totalRevenue: revenue[0]?.total || 0,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  createOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
  getAllOrders,
  updateOrderStatus,
  getOrderStats,
};
