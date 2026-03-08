var express = require("express");
var router = express.Router();
var authRouter = require("./auth.route");
var restaurantRouter = require("./restaurant.route");
var productRouter = require("./product.route");
var userRouter = require("./user.route");
var orderRouter = require("./order.route");
var paymentRouter = require("./payment.route");
var reviewRouter = require("./review.route");
var paymentController = require("../controller/payment.controller");

router.use("/auth", authRouter);
router.use("/restaurants", restaurantRouter);
router.use("/products", productRouter);
router.use("/users", userRouter);
router.use("/orders", orderRouter);
router.use("/payments", paymentRouter);
router.use("/reviews", reviewRouter);

// Alias routes to match the simple VNPay sample format.
router.post("/create-vnpay-url", paymentController.createVnpayUrl);
router.post("/create-qr", paymentController.createQr);
router.get("/check-payment-vnpay", paymentController.checkPaymentVnpay);
router.get("/vnpay-ipn", paymentController.vnpayIpn);

module.exports = router;
