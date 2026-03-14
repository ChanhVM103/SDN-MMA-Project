require("dotenv").config();
const mongoose = require("mongoose");
const Restaurant = require("./models/restaurant.model");

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const restaurants = await Restaurant.find({ name: { $in: ["Sashimi Cá Ngừ", "Pizza 4P's", "Nhà hàng Hải Sản Biển Đông", "Phở Thìn Bờ Hồ"] } }).lean();
  require("fs").writeFileSync("restaurants_dump.json", JSON.stringify(restaurants, null, 2));
  console.log("Done");
  process.exit(0);
});
