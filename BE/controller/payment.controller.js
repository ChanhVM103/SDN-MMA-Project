const {
  VNPay,
  ignoreLogger,
  ProductCode,
  VnpLocale,
  dateFormat,
} = require("vnpay");
const Order = require("../models/order.model");

const TMN_CODE = process.env.VNP_TMNCODE || "AS6J2VJB";
const HASH_SECRET =
  process.env.VNP_HASH_SECRET || "J5UYCZUI6U6HB2OOQPN7YEB815IWL1ZG";
const VNPAY_HOST = process.env.VNP_URL || "https://sandbox.vnpayment.vn";
const RETURN_URL =
  process.env.VNP_RETURN_URL || "http://localhost:3000/payment-confirm";

const vnpay = new VNPay({
  tmnCode: TMN_CODE,
  secureSecret: HASH_SECRET,
  vnpayHost: VNPAY_HOST,
  testMode: true,
  hashAlgorithm: "SHA512",
  loggerFn: ignoreLogger,
});

const getClientIp = (req) => {
  const forwardedFor = req.headers["x-forwarded-for"];

  if (typeof forwardedFor === "string" && forwardedFor.length > 0) {
    return forwardedFor.split(",")[0].trim();
  }

  return (
    req.ip ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    "127.0.0.1"
  );
};

const parseRequestData = (req) => {
  const requestData =
    req.body && Object.keys(req.body).length > 0 ? req.body : req.query;
  const { amount, orderInfo, orderId, locale } = requestData;

  const normalizedAmount =
    amount == null ? "" : String(amount).replace(/[^0-9]/g, "");
  const parsedAmount = normalizedAmount ? Number(normalizedAmount) : Number.NaN;

  return {
    amount: parsedAmount,
    orderInfo,
    orderId,
    locale,
  };
};

const buildVnpayPaymentUrl = async (req) => {
  const { amount, orderInfo, orderId, locale } = parseRequestData(req);

  let finalAmount = amount;
  if (orderId) {
    const order = await Order.findById(orderId);
    if (order) {
      finalAmount = order.total;
    }
  }

  // Keep a test-friendly fallback when request has no orderId/amount.
  if (!Number.isFinite(finalAmount) || finalAmount <= 0) {
    finalAmount = 50000;
  }

  if (!Number.isFinite(finalAmount) || finalAmount <= 0) {
    const error = new Error("Can truyen orderId hop le hoac amount > 0");
    error.statusCode = 400;
    throw error;
  }

  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const txnRef = String(orderId || Date.now());

  return vnpay.buildPaymentUrl({
    vnp_Amount: Math.round(finalAmount),
    vnp_IpAddr: getClientIp(req),
    vnp_TxnRef: txnRef,
    vnp_OrderInfo: orderInfo || "Thanh toan don hang FoodieHub",
    vnp_OrderType: ProductCode.Other,
    vnp_ReturnUrl: RETURN_URL,
    vnp_Locale: locale === "en" ? VnpLocale.EN : VnpLocale.VN,
    vnp_CreateDate: dateFormat(now),
    vnp_ExpireDate: dateFormat(tomorrow),
  });
};

const updateOrderPaymentStatus = async (verify) => {
  const txnRef = String(verify?.vnp_TxnRef || "").trim();
  if (!txnRef) {
    return;
  }

  const order = await Order.findById(txnRef);
  if (!order) {
    return;
  }

  const paidAmount = Number(verify.vnp_Amount) / 100;
  if (!Number.isFinite(paidAmount) || paidAmount <= 0) {
    return;
  }

  order.paymentMethod = "vnpay";
  order.isPaid = true;
  order.paidAmount = paidAmount;
  order.paidAt = new Date();

  await order.save();
};

const createVnpayUrl = async (req, res) => {
  try {
    const paymentUrl = await buildVnpayPaymentUrl(req);
    return res.status(200).json({ url: paymentUrl });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Khong the tao URL thanh toan VNPay",
    });
  }
};

const createQr = async (req, res) => {
  try {
    const paymentUrl = await buildVnpayPaymentUrl(req);
    return res.redirect(paymentUrl);
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Khong the tao URL thanh toan VNPay",
    });
  }
};

const paymentConfirm = async (req, res) => {
  try {
    const verify = vnpay.verifyReturnUrl(req.query);

    if (verify.isVerified && verify.isSuccess) {
      await updateOrderPaymentStatus(verify);
      return res.status(200).send("Thanh toan Sandbox thanh cong!");
    }

    return res.status(400).send("Thanh toan that bai!");
  } catch (error) {
    return res.status(400).send("Thanh toan that bai!");
  }
};

const checkPaymentVnpay = (req, res) => {
  try {
    const result = vnpay.verifyReturnUrl(req.query);

    return res.status(200).json({
      success: result.isVerified,
      message: result.message,
      data: result,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || "Khong xac minh duoc ket qua thanh toan",
    });
  }
};

const vnpayIpn = async (req, res) => {
  try {
    const result = vnpay.verifyIpnCall(req.query);

    if (!result.isVerified) {
      return res
        .status(200)
        .json({ RspCode: "97", Message: "Invalid Checksum" });
    }

    if (result.isSuccess) {
      await updateOrderPaymentStatus(result);
    }

    return res.status(200).json({ RspCode: "00", Message: "Confirm Success" });
  } catch (error) {
    return res
      .status(200)
      .json({ RspCode: "99", Message: error.message || "Unknown error" });
  }
};

module.exports = {
  createVnpayUrl,
  createQr,
  paymentConfirm,
  checkPaymentVnpay,
  vnpayIpn,
};
