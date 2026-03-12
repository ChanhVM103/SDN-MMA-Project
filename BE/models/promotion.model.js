const mongoose = require("mongoose");

const promotionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Promotion name is required"],
      trim: true,
      maxlength: [100, "Promotion name must be less than 100 characters"],
    },
    discountPercent: {
      type: Number,
      required: [true, "Discount percent is required"],
      min: [0, "Discount percent cannot be negative"],
      max: [100, "Discount percent cannot exceed 100"],
    },
    brandId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Promotion must belong to a brand"],
    },
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: [true, "Promotion must belong to a restaurant"],
    },
    productIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
promotionSchema.index({ brandId: 1 });
promotionSchema.index({ restaurantId: 1, isActive: 1 });
promotionSchema.index({ productIds: 1 });

const Promotion = mongoose.model("Promotion", promotionSchema);

module.exports = Promotion;
