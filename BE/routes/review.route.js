var express = require("express");
var router = express.Router();
var reviewController = require("../controller/review.controller");
var { authMiddleware } = require("../middleware/auth.middleware");

// @route   POST /api/reviews
// @desc    Create a review for a restaurant and an order
// @access  Private
router.post("/", authMiddleware, reviewController.createReview);

// @route   GET /api/reviews/restaurant/:restaurantId
// @desc    Get reviews for a restaurant with pagination
// @access  Public
router.get("/restaurant/:restaurantId", reviewController.getRestaurantReviews);

module.exports = router;
