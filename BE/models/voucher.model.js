const mongoose = require("mongoose");

const voucherSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Tên voucher không được để trống"],
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    minOrderAmount: {
      type: Number,
      required: [true, "Giá trị đơn tối thiểu không được để trống"],
      min: [0, "Giá trị đơn tối thiểu không được âm"],
    },
    maxDeliveryFee: {
      type: Number,
      required: true,
      min: [0, "Phí ship tối đa không được âm"],
      default: 0, // 0 = free ship
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Index để query nhanh
voucherSchema.index({ isActive: 1, minOrderAmount: 1 });

module.exports = mongoose.model("Voucher", voucherSchema);
