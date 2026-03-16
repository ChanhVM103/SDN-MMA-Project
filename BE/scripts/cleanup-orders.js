const mongoose = require("mongoose");
const Order = require("./models/order.model");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, ".env") });

const cleanupOrders = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/foodiehub");
    console.log("Connected to MongoDB for cleanup...");

    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    // Xóa các đơn hàng đã hủy hoặc rác (pending quá lâu) sau 24h
    const result = await Order.deleteMany({
      status: { $in: ["cancelled", "pending"] },
      createdAt: { $lt: twentyFourHoursAgo }
    });

    console.log(`Cleanup success: ${result.deletedCount} orders deleted.`);
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("Cleanup error:", error);
    process.exit(1);
  }
};

cleanupOrders();
