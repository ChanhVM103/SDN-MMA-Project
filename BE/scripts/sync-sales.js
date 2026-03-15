const mongoose = require("mongoose");
const Order = require("../models/order.model");
const Product = require("../models/product.model");
require("dotenv").config();

async function syncSales() {
    try {
        const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017/sdn-mma";
        await mongoose.connect(mongoUri);
        console.log("Connected to MongoDB");

        // Get all delivered orders
        const deliveredOrders = await Order.find({ status: "delivered" });
        console.log(`Found ${deliveredOrders.length} delivered orders`);

        const salesMap = new Map();

        // Calculate total quantity sold for each product
        for (const order of deliveredOrders) {
            for (const item of order.items) {
                const productId = item.productId;
                const quantity = item.quantity || 1;
                salesMap.set(productId, (salesMap.get(productId) || 0) + quantity);
            }
        }

        console.log(`Calculated sales for ${salesMap.size} unique products`);

        // Update each product
        let updatedCount = 0;
        for (const [productId, soldCount] of salesMap.entries()) {
            if (mongoose.Types.ObjectId.isValid(productId)) {
                await Product.findByIdAndUpdate(productId, { sold: soldCount });
                updatedCount++;
            } else {
                console.warn(`Invalid Product ID: ${productId}`);
            }
        }

        console.log(`Successfully updated ${updatedCount} products`);
        process.exit(0);
    } catch (error) {
        console.error("Sync error:", error);
        process.exit(1);
    }
}

syncSales();
