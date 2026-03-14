const { chatAI } = require("../services/chatAI.services.js");
const Product = require("../models/product.model");
const Restaurant = require("../models/restaurant.model");

async function askAI(req, res) {
  try {
    const { question, restaurantId } = req.body;

    // Validate input
    if (!question || question.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập câu hỏi",
      });
    }

    let filter = { isAvailable: true };
    let restaurantInfo = null;

    // Nếu có restaurantId, chỉ lấy sản phẩm của nhà hàng đó
    if (restaurantId) {
      filter.restaurantId = restaurantId;
      restaurantInfo = await Restaurant.findById(restaurantId, "name description tags");
    }

    // Lấy danh sách sản phẩm để AI có context tư vấn
    const products = await Product.find(
      filter,
      "name price description category"
    )
      .limit(30) // Tăng giới hạn lên một chút để AI có nhiều lựa chọn hơn
      .lean();

    // Gọi service để lấy tư vấn từ AI
    const advice = await chatAI(question, products, restaurantInfo);

    return res.status(200).json({
      success: true,
      question: question,
      advice: advice,
    });
  } catch (error) {
    console.error("Lỗi trong chatAI controller:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Lỗi server",
    });
  }
}

module.exports = {
  askAI,
};
