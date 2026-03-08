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

// Prevent user from submitting multiple reviews for the same order
reviewSchema.index({ order: 1, user: 1 }, { unique: true });

// Static method to calculate average rating and number of reviews
reviewSchema.statics.calcAverageRatings = async function (restaurantId) {
  const stats = await this.aggregate([
    {
      $match: { restaurant: restaurantId },
    },
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
      rating: Math.round(stats[0].avgRating * 10) / 10, // round to 1 decimal place
    });
  } else {
    // If all reviews are deleted
    await Restaurant.findByIdAndUpdate(restaurantId, {
      reviews: 0,
      rating: 0,
    });
  }
};

// Call calcAverageRatings after saving a new review
reviewSchema.post("save", function () {
  this.constructor.calcAverageRatings(this.restaurant);
});

// Call calcAverageRatings when updating or deleting a review (findByIdAndUpdate, findByIdAndDelete)
reviewSchema.pre(/^findOneAnd/, async function (next) {
  this.r = await this.clone().findOne();
  next();
});

reviewSchema.post(/^findOneAnd/, async function () {
  if (this.r) {
    await this.r.constructor.calcAverageRatings(this.r.restaurant);
  }
});

const Review = mongoose.model("Review", reviewSchema);

module.exports = Review;
