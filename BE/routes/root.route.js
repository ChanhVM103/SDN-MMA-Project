var express = require("express");
var router = express.Router();
var authRouter = require("./auth.route");
var restaurantRouter = require("./restaurant.route");
var productRouter = require("./product.route");

router.use("/auth", authRouter);
router.use("/restaurants", restaurantRouter);
router.use("/products", productRouter);

module.exports = router;
