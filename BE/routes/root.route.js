var express = require("express");
var router = express.Router();
var authRouter = require("./auth.route");
var restaurantRouter = require("./restaurant.route");
var productRouter = require("./product.route");
var orderRouter = require("./order.route");
var userRouter = require("./users");

router.use("/auth", authRouter);
router.use("/restaurants", restaurantRouter);
router.use("/products", productRouter);
router.use("/orders", orderRouter);
router.use("/users", userRouter);

module.exports = router;