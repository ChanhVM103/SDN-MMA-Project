const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Chat-based AI advice for food selection.
 * @param {string} question - The user's question.
 * @param {Array} products - List of available products to recommend.
 * @param {Object} restaurantInfo - Optional information about the restaurant.
 * @returns {Promise<string>} AI's advice.
 */
async function chatAI(question, products, restaurantInfo = null) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Prepare context from products
    const productContext = products
      .map(
        (p) =>
          `- ${p.name}: ${p.description || "Ngon và hấp dẫn"} (Giá: ${p.price.toLocaleString("vi-VN")}đ, Danh mục: ${p.category || "Chung"})`,
      )
      .join("\n");

    const restaurantContext = restaurantInfo
      ? `Người dùng đang ở trong cửa hàng: "${restaurantInfo.name}".\n${restaurantInfo.description ? `Mô tả cửa hàng: ${restaurantInfo.description}\n` : ""}`
      : "Người dùng đang xem danh sách món ăn từ nhiều cửa hàng khác nhau.";

    const prompt = `
Bạn là FoodieHub Consultant – trợ lý tư vấn món ăn thông minh và nhiệt tình.

${restaurantContext}

Dưới đây là danh sách các món ăn hiện có để bạn tư vấn:
${productContext}

Câu hỏi của người dùng: "${question}"

Yêu cầu trả lời:
- Hãy trả lời tự nhiên, thân thiện bằng tiếng Việt.
- Nếu người dùng đang ở một cửa hàng cụ thể (${restaurantInfo ? restaurantInfo.name : "nào đó"}), hãy ưu tiên giới thiệu các món của cửa hàng đó.
- Chỉ sử dụng các món có tên trong danh sách phía trên để đề xuất.
- Nếu không tìm thấy món phù hợp trong danh sách, hãy khéo léo gợi ý món tương tự có trong danh sách.
- Trả lời ngắn gọn, súc tích (khoảng 2-4 câu).
- Luôn nhắc đến tên món và giá cả khi đề xuất.

Trả lời:
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Gemini AI API Error Details:", {
      message: error.message,
      stack: error.stack,
      status: error.status,
      details: error.details,
    });
    return "Xin lỗi, hiện tại tôi đang bận xử lý, vui lòng quay lại sau.";
  }
}

module.exports = {
  chatAI,
};
