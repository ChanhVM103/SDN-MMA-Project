const mongoose = require("mongoose");

const walletTransactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["topup", "deduct", "escrow", "escrow_refund", "reward"],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    balanceBefore: {
      type: Number,
      required: true,
    },
    balanceAfter: {
      type: Number,
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
    // Nạp tiền qua VNPay
    vnpayTxnRef: {
      type: String,
      default: null,
    },
    vnpayResponseCode: {
      type: String,
      default: null,
    },
    // Admin nạp thủ công
    createdByAdmin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    // Liên quan đơn hàng (escrow)
    relatedOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: null,
    },
    status: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "completed",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("WalletTransaction", walletTransactionSchema);
