const mongoose = require("mongoose");

const restaurantSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Restaurant must belong to an owner (Brand user)"],
    },
    name: {
      type: String,
      required: [true, "Restaurant name is required"],
      trim: true,
      minlength: [2, "Restaurant name must be at least 2 characters"],
      maxlength: [100, "Restaurant name must be less than 100 characters"],
    },
    image: {
      type: String,
      required: [true, "Restaurant image is required"],
    },
    thumbnail: {
      type: String,
      default: "",
    },
    images: {
      type: [String],
      default: [],
    },
    rating: {
      type: Number,
      default: 0,
      min: [0, "Rating must be at least 0"],
      max: [5, "Rating must be at most 5"],
    },
    reviews: {
      type: Number,
      default: 0,
      min: [0, "Reviews count cannot be negative"],
    },
    distance: {
      type: String,
      default: "",
    },
    tags: {
      type: [String],
      default: [],
    },
    isFlashSale: {
      type: Boolean,
      default: false,
    },
    discountPercent: {
      type: Number,
      default: 0,
      min: [0, "Discount percent cannot be negative"],
      max: [100, "Discount percent cannot exceed 100"],
    },
    deliveryTime: {
      type: Number,
      required: [true, "Delivery time is required"],
      min: [0, "Delivery time cannot be negative"],
    },
    deliveryFee: {
      type: Number,
      required: [true, "Delivery fee is required"],
      min: [0, "Delivery fee cannot be negative"],
    },
    isOpen: {
      type: Boolean,
      default: true,
    },
    address: {
      type: String,
      trim: true,
      default: "",
    },
    phone: {
      type: String,
      trim: true,
      default: "",
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    openingHours: {
      type: String,
      default: "",
    },
    latitude: {
      type: Number,
      default: null,
    },
    longitude: {
      type: Number,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

// Index for searching
restaurantSchema.index({ name: "text", tags: "text" });
restaurantSchema.index({ rating: -1 });
restaurantSchema.index({ isFlashSale: 1 });

const Restaurant = mongoose.model("Restaurant", restaurantSchema);

module.exports = Restaurant;
