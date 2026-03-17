const mongoose = require("mongoose");

// ── OrderItem Schema ──────────────────────────────
const orderItemSchema = new mongoose.Schema({
  productId: { type: String, required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  originalPrice: { type: Number },
  quantity: { type: Number, required: true, min: 1 },
  emoji: { type: String, default: "🍽️" },
  image: { type: String, default: "" },
  note: { type: String, default: "" },
});

// ── Order Schema ──────────────────────────────────
const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
    },
    restaurantName: { type: String, required: true },
    restaurantAddress: { type: String, default: "" },

    // Shipper được giao đơn
    shipper: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    items: {
      type: [orderItemSchema],
      validate: {
        validator: (v) => v.length > 0,
        message: "Đơn hàng phải có ít nhất 1 món",
      },
    },

    // Giá tiền
    subtotal: { type: Number, required: true },
    deliveryFee: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    total: { type: Number, required: true },

    // Địa chỉ giao hàng
    deliveryAddress: { type: String, required: true },

    // Trạng thái đơn hàng
    status: {
      type: String,
      enum: [
        "pending",           // Chờ xác nhận
        "confirmed",         // Nhà hàng đã xác nhận
        "preparing",         // Đang chuẩn bị
        "ready_for_pickup",  // Sẵn sàng bàn giao cho shipper
        "shipper_accepted",  // Shipper đã nhận đơn
        "delivering",        // Shipper đang giao hàng
        "shipper_delivered", // Shipper báo giao xong, chờ nhà hàng xác nhận
        "delivered",         // Hoàn thành
        "cancelled",
        "bombed",            // User không nhận hàng
      ],
      default: "pending",
    },

    // Bằng chứng giao hàng
    proofImage: { type: String, default: "" },
    callCount: { type: Number, default: 0 },

    // Tiền ký quỹ của Shipper cho đơn COD
    escrowAmount: { type: Number, default: 0 },

    // Thanh toán
    paymentMethod: {
      type: String,
      enum: ["cash", "card", "momo", "zalopay", "vnpay"],
      default: "cash",
    },
    isPaid: { type: Boolean, default: false },
    paidAmount: { type: Number, default: 0 },
    paidAt: { type: Date, default: null },

    // Ghi chú
    note: { type: String, default: "" },

    // Thời gian giao ước tính (phút)
    estimatedDeliveryTime: { type: Number, default: 30 },

    // Đã đánh giá chưa
    isReviewed: { type: Boolean, default: false },
    daDanhGiaShipper: { type: Boolean, default: false },

    // Lịch sử trạng thái
    statusHistory: [
      {
        status: String,
        changedAt: { type: Date, default: Date.now },
        changedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        note: String,
      },
    ],
  },
  { timestamps: true },
);

// Index để query nhanh
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1 });
orderSchema.index({ restaurant: 1 });

module.exports = mongoose.model("Order", orderSchema);
