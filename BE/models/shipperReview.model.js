const mongoose = require("mongoose");

const shipperReviewSchema = new mongoose.Schema(
  {
    diemDanhGia: {
      type: Number,
      required: [true, "Điểm đánh giá là bắt buộc"],
      min: [1, "Điểm tối thiểu là 1"],
      max: [5, "Điểm tối đa là 5"],
    },
    nhanXet: {
      type: String,
      trim: true,
      maxlength: [300, "Nhận xét không được vượt quá 300 ký tự"],
      default: "",
    },
    // Tag đánh giá nhanh
    tags: [{
      type: String,
      enum: [
        "Giao hàng nhanh",
        "Thái độ niềm nở",
        "Giao đúng món",
        "Đóng gói cẩn thận",
        "Giao hàng trễ",
        "Thái độ kém",
        "Không liên lạc được",
      ],
    }],
    shipper: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Đánh giá phải thuộc về một shipper"],
      index: true,
    },
    khachHang: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Đánh giá phải thuộc về một khách hàng"],
    },
    donHang: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: [true, "Đánh giá phải gắn với một đơn hàng"],
    },
  },
  { timestamps: true }
);

// Mỗi đơn hàng chỉ được đánh giá shipper 1 lần
shipperReviewSchema.index({ donHang: 1, khachHang: 1 }, { unique: true });

// Sau khi lưu → tính lại điểm trung bình của shipper
shipperReviewSchema.statics.tinhDiemTrungBinh = async function (shipperId) {
  const User = require("./user.model");
  const ketQua = await this.aggregate([
    { $match: { shipper: shipperId } },
    {
      $group: {
        _id: "$shipper",
        soLuongDanhGia: { $sum: 1 },
        diemTrungBinh: { $avg: "$diemDanhGia" },
      },
    },
  ]);

  if (ketQua.length > 0) {
    await User.findByIdAndUpdate(shipperId, {
      danhGiaShipper: Math.round(ketQua[0].diemTrungBinh * 10) / 10,
      soDanhGiaShipper: ketQua[0].soLuongDanhGia,
    });
  }
};

shipperReviewSchema.post("save", function () {
  this.constructor.tinhDiemTrungBinh(this.shipper);
});

const DanhGiaShipper = mongoose.model("ShipperReview", shipperReviewSchema);
module.exports = DanhGiaShipper;
