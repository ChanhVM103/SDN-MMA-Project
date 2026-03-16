const { VNPay, ignoreLogger, ProductCode, VnpLocale, dateFormat } = require("vnpay");
const User = require("../models/user.model");
const WalletTransaction = require("../models/walletTransaction.model");

const TMN_CODE    = process.env.VNP_TMNCODE     || "AS6J2VJB";
const HASH_SECRET = process.env.VNP_HASH_SECRET  || "J5UYCZUI6U6HB2OOQPN7YEB815IWL1ZG";
const VNPAY_HOST  = process.env.VNP_URL          || "https://sandbox.vnpayment.vn";
const BASE_RETURN = process.env.VNP_RETURN_URL   || "http://localhost:5173/payment-result";
const RETURN_URL  = process.env.VNP_WALLET_RETURN_URL || BASE_RETURN.replace("payment-result", "shipper-dashboard");

const vnpay = new VNPay({
  tmnCode: TMN_CODE, secureSecret: HASH_SECRET, vnpayHost: VNPAY_HOST,
  testMode: true, hashAlgorithm: "SHA512", loggerFn: ignoreLogger,
});

const getClientIp = (req) => {
  const ff = req.headers["x-forwarded-for"];
  if (typeof ff === "string" && ff.length > 0) return ff.split(",")[0].trim();
  return req.ip || req.connection?.remoteAddress || "127.0.0.1";
};

// GET /api/wallet/balance
const getBalance = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("walletBalance fullName role");
    if (!user) return res.status(404).json({ success: false, message: "Không tìm thấy người dùng" });
    return res.json({ success: true, data: { balance: user.walletBalance, fullName: user.fullName } });
  } catch (err) { return res.status(500).json({ success: false, message: err.message }); }
};

// GET /api/wallet/transactions
const getTransactions = async (req, res) => {
  try {
    const { page = 1, limit = 15 } = req.query;
    const filter = { user: req.userId };
    const total = await WalletTransaction.countDocuments(filter);
    const txns = await WalletTransaction.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate("relatedOrder", "_id");
    return res.json({ success: true, data: txns, pagination: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / limit) } });
  } catch (err) { return res.status(500).json({ success: false, message: err.message }); }
};

// POST /api/wallet/topup-vnpay — Shipper tạo link nạp tiền
const createTopupVnpayUrl = async (req, res) => {
  try {
    const parsedAmount = Number(String(req.body.amount || 0).replace(/[^0-9]/g, ""));
    if (!parsedAmount || parsedAmount < 10000)
      return res.status(400).json({ success: false, message: "Số tiền nạp tối thiểu là 10,000đ" });
    if (parsedAmount > 50000000)
      return res.status(400).json({ success: false, message: "Số tiền nạp tối đa là 50,000,000đ" });

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ success: false, message: "Không tìm thấy người dùng" });

    const txnRef = `WALLET_${req.userId}_${Date.now()}`;
    await WalletTransaction.create({
      user: req.userId, type: "topup", amount: parsedAmount,
      balanceBefore: user.walletBalance, balanceAfter: user.walletBalance + parsedAmount,
      description: "Nạp tiền qua VNPay", vnpayTxnRef: txnRef, status: "pending",
    });

    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const paymentUrl = vnpay.buildPaymentUrl({
      vnp_Amount: Math.round(parsedAmount), vnp_IpAddr: getClientIp(req),
      vnp_TxnRef: txnRef, vnp_OrderInfo: `Nap tien vi FoodieHub - ${user.fullName}`,
      vnp_OrderType: ProductCode.Other, vnp_ReturnUrl: RETURN_URL, vnp_Locale: VnpLocale.VN,
      vnp_CreateDate: dateFormat(now), vnp_ExpireDate: dateFormat(tomorrow),
    });

    return res.json({ success: true, url: paymentUrl, txnRef });
  } catch (err) { return res.status(500).json({ success: false, message: err.message }); }
};

// GET /api/wallet/topup-vnpay-result — FE gọi sau khi VNPay redirect về
const handleTopupVnpayResult = async (req, res) => {
  try {
    const result = vnpay.verifyReturnUrl(req.query);
    const responseCode = req.query.vnp_ResponseCode;
    const txnRef = req.query.vnp_TxnRef;
    const isSuccess = result.isVerified && responseCode === "00";

    const txn = await WalletTransaction.findOne({ vnpayTxnRef: txnRef });
    if (!txn) return res.json({ success: false, message: "Không tìm thấy giao dịch" });
    if (txn.status !== "pending") return res.json({ success: txn.status === "completed", message: "Giao dịch đã được xử lý" });

    if (isSuccess) {
      // Dùng txn.amount (số tiền shipper nhập từ đầu) thay vì result.vnp_Amount
      // vì vnp_Amount trong response đã bị nhân 100 bởi VNPay SDK
      const paidAmount = txn.amount;
      const user = await User.findById(txn.user);
      if (!user) return res.json({ success: false, message: "Không tìm thấy người dùng" });
      user.walletBalance = (user.walletBalance || 0) + paidAmount;
      await user.save();
      txn.status = "completed"; txn.balanceBefore = user.walletBalance - paidAmount;
      txn.balanceAfter = user.walletBalance; txn.vnpayResponseCode = responseCode;
      txn.description = `Nạp ${paidAmount.toLocaleString("vi-VN")}đ qua VNPay thành công`;
      await txn.save();
      return res.json({ success: true, message: "Nạp tiền thành công!", data: { amount: paidAmount, newBalance: user.walletBalance } });
    } else {
      txn.status = "failed"; txn.vnpayResponseCode = responseCode;
      txn.description = `Nạp tiền VNPay thất bại (mã: ${responseCode})`;
      await txn.save();
      const reason = responseCode === "24" ? "Bạn đã hủy giao dịch." : `Nạp tiền thất bại (mã lỗi: ${responseCode}).`;
      return res.json({ success: false, message: reason, responseCode });
    }
  } catch (err) { return res.status(500).json({ success: false, message: err.message }); }
};

module.exports = { getBalance, getTransactions, createTopupVnpayUrl, handleTopupVnpayResult };
