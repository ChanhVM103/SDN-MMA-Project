var express = require("express");
var router = express.Router();
var paymentController = require("../controller/payment.controller");

/* GET home page. */
router.get("/", function (req, res, next) {
  res.render("index", { title: "Express" });
});

router.get("/payment-confirm", paymentController.paymentConfirm);

module.exports = router;
