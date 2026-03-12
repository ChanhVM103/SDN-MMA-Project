const mongoose = require("mongoose");
const Restaurant = require("./restaurant.model");

const reviewSchema = new mongoose.Schema(
  {
    rating: {
      type: Number,
      required: [true, "Rating is required"],
      min: [1, "Rating must be above 1.0"],
      max: [5, "Rating must be below 5.0"],
    },
    comment: {
      type: String,
      trim: true,
      maxlength: [500, "Comment cannot exceed 500 characters"],
      default: "",
    },
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: [true, "Review must belong to a restaurant"],
    },
    // Đánh giá theo từng món ăn (null = đánh giá tổng thể nhà hàng)
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      default: null,
    },
    // Lưu tên sản phẩm tại thời điểm đánh giá
    productName: {
      type: String,
      default: "",
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Review must belong to a user"],
    },
    order: {
      type: String,
      required: [true, "Review must be associated with an order"],
    },
  },
  {
    timestamps: true,
  }
);

// Mỗi user chỉ được review 1 lần / order / product
// product: null  → đánh giá nhà hàng tổng thể
// product: <id>  → đánh giá món ăn cụ thể
reviewSchema.index({ order: 1, user: 1, product: 1 }, { unique: true });

// Chỉ tính rating nhà hàng từ review tổng thể (product === null)
reviewSchema.statics.calcAverageRatings = async function (restaurantId) {
  const stats = await this.aggregate([
    { $match: { restaurant: restaurantId, product: null } },
    {
      $group: {
        _id: "$restaurant",
        nRating: { $sum: 1 },
        avgRating: { $avg: "$rating" },
      },
    },
  ]);

  if (stats.length > 0) {
    await Restaurant.findByIdAndUpdate(restaurantId, {
      reviews: stats[0].nRating,
      rating: Math.round(stats[0].avgRating * 10) / 10,
    });
  } else {
    await Restaurant.findByIdAndUpdate(restaurantId, { reviews: 0, rating: 0 });
  }
};

reviewSchema.post("save", function () {
  if (!this.product) {
    this.constructor.calcAverageRatings(this.restaurant);
  }
});

reviewSchema.pre(/^findOneAnd/, async function () {
  this.r = await this.clone().findOne();
});

reviewSchema.post(/^findOneAnd/, async function () {
  if (this.r && !this.r.product) {
    await this.r.constructor.calcAverageRatings(this.r.restaurant);
  }
});

const Review = mongoose.model("Review", reviewSchema);

module.exports = Review;
