var express = require("express");
var router = express.Router();
var walletController = require("../controller/wallet.controller");
var { authMiddleware, authorizeRole } = require("../middleware/auth.middleware");

// Shipper xem số dư
router.get("/balance", authMiddleware, walletController.getBalance);

// Shipper xem lịch sử giao dịch
router.get("/transactions", authMiddleware, walletController.getTransactions);

// Shipper tạo link nạp tiền VNPay (chỉ role shipper)
router.post("/topup-vnpay", authMiddleware, authorizeRole("shipper"), walletController.createTopupVnpayUrl);

// VNPay redirect về sau khi thanh toán (không cần auth, FE gọi để xác minh)
router.get("/topup-vnpay-result", walletController.handleTopupVnpayResult);

module.exports = router;
