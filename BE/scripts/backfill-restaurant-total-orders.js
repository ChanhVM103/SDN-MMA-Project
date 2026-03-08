require("dotenv").config();
const mongoose = require("mongoose");
const Order = require("../models/order.model");
const Restaurant = require("../models/restaurant.model");

const run = async () => {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is missing in environment variables");
  }

  await mongoose.connect(process.env.MONGODB_URI);

  // Reset all counters first to avoid drift from previous values.
  await Restaurant.updateMany({}, { $set: { totalOrders: 0 } });

  const grouped = await Order.aggregate([
    { $match: { status: { $ne: "cancelled" } } },
    { $group: { _id: "$restaurant", totalOrders: { $sum: 1 } } },
  ]);

  if (grouped.length > 0) {
    const bulkOps = grouped.map((item) => ({
      updateOne: {
        filter: { _id: item._id },
        update: { $set: { totalOrders: item.totalOrders } },
      },
    }));

    await Restaurant.bulkWrite(bulkOps);
  }

  console.log(`Backfill completed. Updated ${grouped.length} restaurants.`);
};

run()
  .then(() => {
    mongoose.connection.close();
    process.exit(0);
  })
  .catch((error) => {
    console.error("Backfill failed:", error.message);
    mongoose.connection.close();
    process.exit(1);
  });
