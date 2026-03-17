const DanhGiaShipper = require("../models/shipperReview.model");
const Order = require("../models/order.model");

// ── POST /api/danh-gia-shipper ────────────────────────────────────
// Khách hàng đánh giá shipper sau khi nhận hàng
const taoDanhGia = async (req, res) => {
  try {
    const { maDonHang, diemDanhGia, nhanXet, tags } = req.body;

    if (!maDonHang || !diemDanhGia) {
      return res.status(400).json({
        success: false,
        message: "Mã đơn hàng và điểm đánh giá là bắt buộc",
      });
    }

    // Kiểm tra đơn hàng tồn tại, thuộc về khách hàng, đã giao xong
    const donHang = await Order.findOne({
      _id: maDonHang,
      user: req.userId,
    }).populate("shipper", "fullName avatar danhGiaShipper soDanhGiaShipper");

    if (!donHang) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đơn hàng hoặc đơn hàng không thuộc về bạn",
      });
    }
    if (donHang.status !== "delivered") {
      return res.status(400).json({
        success: false,
        message: "Chỉ có thể đánh giá shipper sau khi đơn hàng đã giao thành công",
      });
    }
    if (!donHang.shipper) {
      return res.status(400).json({
        success: false,
        message: "Đơn hàng này không có thông tin shipper",
      });
    }

    // Kiểm tra đã đánh giá chưa
    const daDanhGia = await DanhGiaShipper.findOne({
      donHang: maDonHang,
      khachHang: req.userId,
    });
    if (daDanhGia) {
      return res.status(400).json({
        success: false,
        message: "Bạn đã đánh giá shipper của đơn hàng này rồi",
      });
    }

    // Tạo đánh giá
    const danhGia = await DanhGiaShipper.create({
      diemDanhGia: Number(diemDanhGia),
      nhanXet: nhanXet || "",
      tags: tags || [],
      shipper: donHang.shipper._id || donHang.shipper,
      khachHang: req.userId,
      donHang: maDonHang,
    });

    // Đánh dấu đơn hàng đã đánh giá shipper
    await Order.findByIdAndUpdate(maDonHang, { daDanhGiaShipper: true });

    return res.status(201).json({
      success: true,
      message: "Đánh giá shipper đã được gửi thành công!",
      data: danhGia,
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Bạn đã đánh giá shipper của đơn hàng này rồi",
      });
    }
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/danh-gia-shipper/kiem-tra/:maDonHang ─────────────────
// Kiểm tra khách hàng đã đánh giá shipper của đơn này chưa
const kiemTraDaDanhGia = async (req, res) => {
  try {
    const danhGia = await DanhGiaShipper.findOne({
      donHang: req.params.maDonHang,
      khachHang: req.userId,
    });
    return res.json({
      success: true,
      data: { daDanhGia: !!danhGia, danhGia: danhGia || null },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/danh-gia-shipper/shipper/:shipperId ──────────────────
// Lấy tất cả đánh giá của 1 shipper (public)
const layDanhGiaShipper = async (req, res) => {
  try {
    const { trang = 1, gioiHan = 10 } = req.query;
    const boLoc = { shipper: req.params.shipperId };
    const tongSo = await DanhGiaShipper.countDocuments(boLoc);
    const danhSach = await DanhGiaShipper.find(boLoc)
      .sort({ createdAt: -1 })
      .skip((trang - 1) * gioiHan)
      .limit(Number(gioiHan))
      .populate("khachHang", "fullName avatar");

    return res.json({
      success: true,
      data: danhSach,
      phanTrang: {
        tongSo,
        trang: Number(trang),
        gioiHan: Number(gioiHan),
        tongTrang: Math.ceil(tongSo / gioiHan),
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/danh-gia-shipper/cua-toi ────────────────────────────
// Shipper xem danh sách đánh giá của bản thân
const layDanhGiaCuaToi = async (req, res) => {
  try {
    const { trang = 1, gioiHan = 10 } = req.query;
    const boLoc = { shipper: req.userId };
    const tongSo = await DanhGiaShipper.countDocuments(boLoc);
    const danhSach = await DanhGiaShipper.find(boLoc)
      .sort({ createdAt: -1 })
      .skip((trang - 1) * gioiHan)
      .limit(Number(gioiHan))
      .populate("khachHang", "fullName avatar")
      .populate("donHang", "restaurantName createdAt total");

    return res.json({
      success: true,
      data: danhSach,
      phanTrang: { tongSo, trang: Number(trang), gioiHan: Number(gioiHan) },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { taoDanhGia, kiemTraDaDanhGia, layDanhGiaShipper, layDanhGiaCuaToi };
