const Voucher = require("../models/voucher.model");

// ── GET /api/vouchers ─────────────────────────────
// Public/Admin: Lấy tất cả voucher
const getAllVouchers = async (req, res) => {
  try {
    const vouchers = await Voucher.find().sort({ minOrderAmount: 1 });
    return res.json({ success: true, data: vouchers });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/vouchers/active ──────────────────────
// Public: Lấy voucher đang hoạt động (cho mobile checkout)
const getActiveVouchers = async (req, res) => {
  try {
    const vouchers = await Voucher.find({ isActive: true }).sort({
      minOrderAmount: 1,
    });
    return res.json({ success: true, data: vouchers });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST /api/vouchers ────────────────────────────
// Admin: Tạo voucher mới
const createVoucher = async (req, res) => {
  try {
    const { name, description, minOrderAmount, maxDeliveryFee, isActive } =
      req.body;

    if (!name || name.trim() === "") {
      return res
        .status(400)
        .json({ success: false, message: "Tên voucher không được để trống" });
    }
    if (minOrderAmount === undefined || minOrderAmount < 0) {
      return res.status(400).json({
        success: false,
        message: "Giá trị đơn tối thiểu phải >= 0",
      });
    }

    const voucher = await Voucher.create({
      name: name.trim(),
      description: description || "",
      minOrderAmount: Number(minOrderAmount),
      maxDeliveryFee: Number(maxDeliveryFee) || 0,
      isActive: isActive !== undefined ? Boolean(isActive) : true,
    });

    return res.status(201).json({
      success: true,
      message: "Tạo voucher thành công!",
      data: voucher,
    });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

// ── PUT /api/vouchers/:id ─────────────────────────
// Admin: Cập nhật voucher
const updateVoucher = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = {};

    if (req.body.name !== undefined) updateData.name = req.body.name.trim();
    if (req.body.description !== undefined)
      updateData.description = req.body.description;
    if (req.body.minOrderAmount !== undefined)
      updateData.minOrderAmount = Number(req.body.minOrderAmount);
    if (req.body.maxDeliveryFee !== undefined)
      updateData.maxDeliveryFee = Number(req.body.maxDeliveryFee);
    if (req.body.isActive !== undefined)
      updateData.isActive = Boolean(req.body.isActive);

    const voucher = await Voucher.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!voucher) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy voucher" });
    }

    return res.json({
      success: true,
      message: "Cập nhật voucher thành công!",
      data: voucher,
    });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

// ── DELETE /api/vouchers/:id ──────────────────────
// Admin: Xoá voucher
const deleteVoucher = async (req, res) => {
  try {
    const voucher = await Voucher.findByIdAndDelete(req.params.id);
    if (!voucher) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy voucher" });
    }
    return res.json({
      success: true,
      message: "Đã xoá voucher",
      data: voucher,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ── PATCH /api/vouchers/:id/toggle ────────────────
// Admin: Bật/tắt voucher
const toggleVoucher = async (req, res) => {
  try {
    const voucher = await Voucher.findById(req.params.id);
    if (!voucher) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy voucher" });
    }
    voucher.isActive = !voucher.isActive;
    await voucher.save();
    return res.json({
      success: true,
      message: voucher.isActive ? "Đã bật voucher" : "Đã tắt voucher",
      data: voucher,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getAllVouchers,
  getActiveVouchers,
  createVoucher,
  updateVoucher,
  deleteVoucher,
  toggleVoucher,
};
