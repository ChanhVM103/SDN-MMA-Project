const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: [true, "Restaurant ID is required"],
    },
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      minlength: [2, "Product name must be at least 2 characters"],
      maxlength: [100, "Product name must be less than 100 characters"],
    },
    price: {
      type: Number,
      required: [true, "Product price is required"],
      min: [0, "Price cannot be negative"],
    },
    image: {
      type: String,
      required: [true, "Product image is required"],
    },
    category: {
      type: String,
      required: [true, "Product category is required"],
      trim: true,
    },
    type: {
      type: String,
      enum: ["food", "drink"],
      default: "food",
    },
    allowToppings: {
      type: Boolean,
      default: false,
    },
    toppings: {
      type: [
        {
          name: {
            type: String,
            required: true,
            trim: true,
            maxlength: [60, "Topping name must be less than 60 characters"],
          },
          extraPrice: {
            type: Number,
            default: 0,
            min: [0, "Topping extra price cannot be negative"],
          },
        },
      ],
      default: [],
    },
    isBestSeller: {
      type: Boolean,
      default: false,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

// Index for searching and filtering
productSchema.index({ restaurantId: 1 });
productSchema.index({ name: "text", description: "text" });
productSchema.index({ category: 1 });
productSchema.index({ type: 1 });
productSchema.index({ isBestSeller: -1 });
productSchema.index({ price: 1 });

const Product = mongoose.model("Product", productSchema);

module.exports = Product;
