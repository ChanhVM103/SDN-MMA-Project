const Order = require("../models/order.model");
const Restaurant = require("../models/restaurant.model");
const User = require("../models/user.model");

const incrementRestaurantOrders = async (restaurantId) => {
  await Restaurant.findByIdAndUpdate(restaurantId, {
    $inc: { totalOrders: 1 },
  });
};

const addRestaurantRevenue = async (restaurantId, amount) => {
  await Restaurant.findByIdAndUpdate(restaurantId, {
    $inc: { totalRevenue: amount },
  });
};

const addShipperRevenue = async (shipperId, amount) => {
  await User.findByIdAndUpdate(shipperId, {
    $inc: { totalRevenue: amount },
  });
};

const decrementRestaurantOrders = async (restaurantId) => {
  await Restaurant.updateOne(
    { _id: restaurantId, totalOrders: { $gt: 0 } },
    { $inc: { totalOrders: -1 } },
  );
};

// Luồng trạng thái hợp lệ (Admin)
const STATUS_FLOW = {
  pending: ["preparing", "cancelled"],
  preparing: ["shipper_accepted", "ready_for_pickup", "delivering", "cancelled"],
  ready_for_pickup: ["shipper_accepted", "delivering", "cancelled"],
  shipper_accepted: ["delivering", "cancelled"],
  delivering: ["shipper_delivered", "cancelled"], // Buyer cannot confirm from delivering anymore
  shipper_delivered: ["delivered", "cancelled"],
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
      voucherId = null,
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

    // ── Áp dụng Voucher (nếu có) ──────────────────
    let finalDeliveryFee = deliveryFee;
    let appliedVoucherName = null;

    if (voucherId) {
      const Voucher = require("../models/voucher.model");
      const voucher = await Voucher.findById(voucherId);

      if (!voucher) {
        return res
          .status(404)
          .json({ success: false, message: "Không tìm thấy voucher" });
      }
      if (!voucher.isActive) {
        return res
          .status(400)
          .json({ success: false, message: "Voucher này đã hết hạn hoặc bị tắt" });
      }
      if (subtotal < voucher.minOrderAmount) {
        return res.status(400).json({
          success: false,
          message: `Đơn hàng phải từ ${voucher.minOrderAmount.toLocaleString()}₫ để dùng voucher này`,
        });
      }

      // Áp dụng giảm ship: cap deliveryFee xuống maxDeliveryFee
      finalDeliveryFee = Math.min(deliveryFee, voucher.maxDeliveryFee);
      appliedVoucherName = voucher.name;
    }

    const total = subtotal + finalDeliveryFee - discount;

    const order = await Order.create({
      user: req.userId,
      restaurant: restaurantId,
      restaurantName: restaurant.name,
      restaurantAddress: restaurant.address,
      items,
      subtotal,
      deliveryFee: finalDeliveryFee,
      discount,
      total,
      deliveryAddress,
      paymentMethod,
      note: appliedVoucherName
        ? `${note ? note + " | " : ""}Voucher: ${appliedVoucherName}`
        : note,
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
      .populate("restaurant", "name image deliveryTime address")
      .select("+restaurantAddress")
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
      .populate("user", "fullName email phone")
      .populate("shipper", "fullName phone avatar");

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
      await addRestaurantRevenue(order.restaurant, order.total);
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

// ════════════════════════════════════════════════
// BRAND (NHÀ HÀNG) ROUTES
// ════════════════════════════════════════════════

// Luồng trạng thái hợp lệ cho Brand (nhà hàng chỉ được xác nhận → chuẩn bị → giao)
const BRAND_STATUS_FLOW = {
  pending: ["preparing", "cancelled"],
  preparing: ["shipper_accepted", "ready_for_pickup", "delivering", "cancelled"],
  ready_for_pickup: ["shipper_accepted", "delivering", "cancelled"],
  shipper_accepted: ["delivering", "cancelled"],
  delivering: ["shipper_delivered", "cancelled"],
  shipper_delivered: ["delivered", "cancelled"],
  delivered: [],
  cancelled: [],
};

// ── GET /api/orders/restaurant/:restaurantId ──────
// Brand: Lấy danh sách đơn hàng của nhà hàng mình
// ── GET /api/orders/restaurant/:restaurantId/stats ─
// Brand: Thống kê doanh thu nhà hàng từ DB
const getRestaurantStats = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const RestaurantModel = require("../models/restaurant.model");
    const restaurant = await RestaurantModel.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({ success: false, message: "Không tìm thấy nhà hàng" });
    }
    if (restaurant.owner && restaurant.owner.toString() !== req.userId && req.userRole !== "admin") {
      return res.status(403).json({ success: false, message: "Không có quyền truy cập" });
    }

    const [revenueAgg, statusAgg] = await Promise.all([
      // Doanh thu đã thu (isPaid = true)
      Order.aggregate([
        { $match: { restaurant: restaurant._id, isPaid: true } },
        {
          $group: {
            _id: "$paymentMethod",
            total: { $sum: { $subtract: ["$total", { $ifNull: ["$deliveryFee", 0] }] } },
            count: { $sum: 1 },
          }
        },
      ]),
      // Đếm theo trạng thái
      Order.aggregate([
        { $match: { restaurant: restaurant._id } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
    ]);

    // Đơn VNPay delivered nhưng isPaid chưa được set (fallback)
    const vnpayDeliveredAgg = await Order.aggregate([
      { $match: { restaurant: restaurant._id, paymentMethod: "vnpay", status: "delivered" } },
      { $group: { _id: null, total: { $sum: { $subtract: ["$total", { $ifNull: ["$deliveryFee", 0] }] } }, count: { $sum: 1 } } },
    ]);

    const revenueByMethod = {};
    revenueAgg.forEach(r => { revenueByMethod[r._id] = { total: r.total, count: r.count }; });

    const countByStatus = {};
    let actualTotalOrders = 0;
    statusAgg.forEach(s => { countByStatus[s._id] = s.count; actualTotalOrders += s.count; });

    // Nếu isPaid chưa được set đúng, dùng fallback từ delivered orders
    const vnpayRevenuePaid = revenueByMethod["vnpay"]?.total || 0;
    const vnpayRevenueFallback = vnpayDeliveredAgg[0]?.total || 0;
    const vnpayRevenue = Math.max(vnpayRevenuePaid, vnpayRevenueFallback);
    const vnpayCount = Math.max(revenueByMethod["vnpay"]?.count || 0, vnpayDeliveredAgg[0]?.count || 0);
    const cashRevenue = revenueByMethod["cash"]?.total || 0;

    return res.json({
      success: true,
      data: {
        vnpayRevenue,
        vnpayCount,
        cashRevenue,
        totalRevenue: vnpayRevenue + cashRevenue,
        countByStatus,
        totalOrders: actualTotalOrders,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const getRestaurantOrders = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { page = 1, limit = 20, status } = req.query;

    // Kiểm tra nhà hàng thuộc về brand này
    const Restaurant = require("../models/restaurant.model");
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({ success: false, message: "Không tìm thấy nhà hàng" });
    }
    if (restaurant.owner && restaurant.owner.toString() !== req.userId && req.userRole !== "admin") {
      return res.status(403).json({ success: false, message: "Bạn không có quyền xem đơn hàng này" });
    }

    const filter = { restaurant: restaurantId };
    if (status) {
      if (status === "delivering") {
        // Return all intermediate states for the 'Delivering' tab
        filter.status = { $in: ["ready_for_pickup", "shipper_accepted", "delivering", "shipper_delivered"] };
      } else {
        filter.status = status;
      }
    }

    const total = await Order.countDocuments(filter);
    const orders = await Order.find(filter)
      .populate("user", "fullName email phone")
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

// ── PATCH /api/orders/:id/brand-status ───────────
// Brand: Cập nhật trạng thái đơn hàng (confirmed → preparing → delivering → delivered)
const updateOrderStatusByBrand = async (req, res) => {
  try {
    const { status, note } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, message: "Vui lòng cung cấp trạng thái mới" });
    }

    const order = await Order.findById(req.params.id).populate("restaurant");
    if (!order) {
      return res.status(404).json({ success: false, message: "Không tìm thấy đơn hàng" });
    }

    // Kiểm tra brand có quyền với đơn hàng này không
    const restaurant = order.restaurant;
    if (restaurant.owner && restaurant.owner.toString() !== req.userId && req.userRole !== "admin") {
      return res.status(403).json({ success: false, message: "Bạn không có quyền cập nhật đơn hàng này" });
    }

    // Kiểm tra luồng trạng thái hợp lệ
    const allowedNext = BRAND_STATUS_FLOW[order.status] || [];
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
      await addRestaurantRevenue(order.restaurant._id, order.total);
    }

    const statusLabels = {
      confirmed: "Nhà hàng đã xác nhận đơn",
      preparing: "Đang chuẩn bị hàng",
      delivering: "Đang giao hàng",
      delivered: "Giao hàng thành công",
      cancelled: "Nhà hàng từ chối đơn",
    };

    order.statusHistory.push({
      status,
      changedBy: req.userId,
      note: note || statusLabels[status] || `Cập nhật sang ${status}`,
    });

    await order.save();

    if (status === "cancelled") {
      await decrementRestaurantOrders(order.restaurant._id);
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

// ════════════════════════════════════════════════
// BRAND HANDOVER ROUTES
// ════════════════════════════════════════════════

// ── PATCH /api/orders/:id/brand-handover ─────────
// Brand: Bàn giao đơn cho shipper (preparing → ready_for_pickup)
const brandHandoverToShipper = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate("restaurant");
    if (!order) return res.status(404).json({ success: false, message: "Không tìm thấy đơn hàng" });

    const restaurant = order.restaurant;
    if (restaurant.owner && restaurant.owner.toString() !== req.userId && req.userRole !== "admin") {
      return res.status(403).json({ success: false, message: "Bạn không có quyền cập nhật đơn hàng này" });
    }

    if (order.status !== "preparing") {
      return res.status(400).json({ success: false, message: `Chỉ có thể bàn giao khi đơn đang ở trạng thái "preparing". Hiện tại: "${order.status}"` });
    }

    order.status = "ready_for_pickup";
    order.statusHistory.push({
      status: "ready_for_pickup",
      changedBy: req.userId,
      note: req.body.note || "Nhà hàng đã chuẩn bị xong, đang chờ shipper đến lấy",
    });
    await order.save();

    return res.json({ success: true, message: "Đã bàn giao đơn hàng cho shipper", data: order });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ── PATCH /api/orders/:id/brand-confirm-delivered ─
// Brand: Xác nhận giao hàng thành công (shipper_delivered → delivered)
const brandConfirmDelivered = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate("restaurant");
    if (!order) return res.status(404).json({ success: false, message: "Không tìm thấy đơn hàng" });

    const restaurant = order.restaurant;
    if (restaurant.owner && restaurant.owner.toString() !== req.userId && req.userRole !== "admin") {
      return res.status(403).json({ success: false, message: "Bạn không có quyền cập nhật đơn hàng này" });
    }

    if (order.status !== "shipper_delivered") {
      return res.status(400).json({ success: false, message: `Chỉ có thể xác nhận khi shipper đã báo giao xong. Hiện tại: "${order.status}"` });
    }

    order.status = "delivered";
    if (order.paymentMethod === "cash") {
      order.isPaid = true;
      order.paidAmount = order.total;
      order.paidAt = new Date();
      
      const productRevenue = order.total - (order.deliveryFee || 0);
      await addRestaurantRevenue(order.restaurant._id, productRevenue);
      if (order.shipper) {
        await addShipperRevenue(order.shipper, order.deliveryFee || 0);
      }
    }
    order.statusHistory.push({
      status: "delivered",
      changedBy: req.userId,
      note: req.body.note || "Nhà hàng xác nhận giao hàng thành công",
    });
    await order.save();

    return res.json({ success: true, message: "Xác nhận giao hàng thành công!", data: order });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ════════════════════════════════════════════════
// SHIPPER ROUTES
// ════════════════════════════════════════════════

// ── GET /api/orders/shipper/available ────────────
// Shipper: Xem các đơn đang chờ giao (ready_for_pickup)
const getAvailableOrders = async (req, res) => {
  try {
    // Shipper can see orders that are ready for pickup (Brand has handed over)
    const orders = await Order.find({
      status: "ready_for_pickup",
      shipper: null // Only orders that haven't been claimed yet
    })
      .populate("restaurant", "name address image")
      .populate("user", "fullName phone")
      .sort({ createdAt: -1 });

    return res.json({ success: true, data: orders });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/orders/shipper/my ───────────────────
// Shipper: Xem đơn của mình (đang giao và đã giao)
const getShipperOrders = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = { shipper: req.userId };
    if (status) filter.status = status;

    const orders = await Order.find(filter)
      .populate("restaurant", "name address image")
      .populate("user", "fullName phone")
      .sort({ createdAt: -1 });

    return res.json({ success: true, data: orders });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ── PATCH /api/orders/:id/shipper-accept ─────────
// Shipper: Nhận đơn (ready_for_pickup → shipper_accepted)
const shipperAcceptOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: "Không tìm thấy đơn hàng" });

    if (!["preparing", "ready_for_pickup"].includes(order.status)) {
      return res.status(400).json({ success: false, message: `Đơn hàng không ở trạng thái chờ shipper. Hiện tại: "${order.status}"` });
    }

    if (order.shipper) {
      return res.status(400).json({ success: false, message: "Đơn hàng này đã có shipper khác nhận rồi" });
    }

    order.shipper = req.userId;
    // When a shipper accepts from ready_for_pickup, it usually moves to shipper_accepted (waiting for pickup) or delivering
    const nextStatus = req.body.status || "shipper_accepted";
    order.status = nextStatus;
    order.statusHistory.push({
      status: nextStatus,
      changedBy: req.userId,
      note: req.body.note || (nextStatus === "delivering" ? "Shipper nhận hàng và đang giao" : "Shipper đã nhận đơn"),
    });
    await order.save();

    return res.json({ success: true, message: `Đã cập nhật trạng thái thành "${nextStatus}"`, data: order });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ── PATCH /api/orders/:id/shipper-pickup ─────────
// Shipper: Đã lấy hàng từ nhà hàng (shipper_accepted → delivering)
const shipperPickedUp = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: "Không tìm thấy đơn hàng" });

    if (order.shipper?.toString() !== req.userId) {
      return res.status(403).json({ success: false, message: "Bạn không có quyền cập nhật đơn hàng này" });
    }
    if (order.status !== "shipper_accepted") {
      return res.status(400).json({ success: false, message: `Đơn hàng không ở trạng thái shipper đã nhận. Hiện tại: "${order.status}"` });
    }

    order.status = "delivering";
    order.statusHistory.push({
      status: "delivering",
      changedBy: req.userId,
      note: "Shipper đã lấy hàng, đang trên đường giao",
    });
    await order.save();

    return res.json({ success: true, message: "Đang giao hàng!", data: order });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ── PATCH /api/orders/:id/shipper-delivered ───────
// Shipper: Báo giao hàng xong (delivering → shipper_delivered)
const shipperCompleteDelivery = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: "Không tìm thấy đơn hàng" });

    if (order.shipper?.toString() !== req.userId) {
      return res.status(403).json({ success: false, message: "Bạn không có quyền cập nhật đơn hàng này" });
    }
    if (order.status !== "delivering") {
      return res.status(400).json({ success: false, message: `Đơn hàng không ở trạng thái đang giao. Hiện tại: "${order.status}"` });
    }

    order.status = "shipper_delivered";
    order.statusHistory.push({
      status: "shipper_delivered",
      changedBy: req.userId,
      note: "Shipper báo giao hàng thành công, chờ khách hàng xác nhận",
    });
    await order.save();

    return res.json({ success: true, message: "Đã báo giao hàng thành công! Đang chờ khách hàng xác nhận.", data: order });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ── PATCH /api/orders/:id/confirm-received ───────
// User: Xác nhận đã nhận được hàng (ghi nhận doanh thu cho nhà hàng)
const confirmOrderReceived = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: "Không tìm thấy đơn hàng" });
    }

    if (order.user.toString() !== req.userId) {
      return res.status(403).json({ success: false, message: "Bạn không có quyền xác nhận đơn hàng này" });
    }

    if (order.status !== "shipper_delivered") {
      return res.status(400).json({
        success: false,
        message: `Xác nhận thất bại. Bạn chỉ có thể xác nhận sau khi shipper báo đã giao hàng thành công (Trạng thái hiện tại: "${order.status}")`,
      });
    }

    order.status = "delivered";
    
    // Revenue splitting: restaurant gets product revenue, shipper gets delivery fee
    const productRevenue = order.total - (order.deliveryFee || 0);
    const shipperFee = order.deliveryFee || 0;
    
    if (order.paymentMethod === "cash") {
      order.isPaid = true;
      order.paidAmount = order.total;
      order.paidAt = new Date();
    }
    
    // Always split revenue when order is delivered (both cash and vnpay)
    await addRestaurantRevenue(order.restaurant._id || order.restaurant, productRevenue);
    if (order.shipper && shipperFee > 0) {
      await addShipperRevenue(order.shipper, shipperFee);
    }

    order.statusHistory.push({
      status: "delivered",
      changedBy: req.userId,
      note: "Khách hàng xác nhận đã nhận được hàng",
    });

    await order.save();

    return res.json({
      success: true,
      message: "Xác nhận nhận hàng thành công!",
      data: order,
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
  getRestaurantStats,
  getRestaurantOrders,
  updateOrderStatusByBrand,
  brandHandoverToShipper,
  confirmOrderReceived,
  brandConfirmDelivered,
  getAvailableOrders,
  getShipperOrders,
  shipperAcceptOrder,
  shipperPickedUp,
  shipperCompleteDelivery,
};
