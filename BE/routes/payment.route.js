var express = require("express");
var router = express.Router();
var paymentController = require("../controller/payment.controller");

router.post("/create-qr", paymentController.createQr);
router.post("/cancel-vnpay-order", paymentController.cancelFailedVnpayOrder);
router.get("/check-payment-vnpay", paymentController.checkPaymentVnpay);
router.get("/ipn", paymentController.vnpayIpn);

module.exports = router;
