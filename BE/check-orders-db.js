const mongoose = require('mongoose');
require('dotenv').config({ path: 'BE/.env' });

async function checkOrders() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("✅ Connected to DB");

        const Order = require('./models/order.model');
        const Restaurant = require('./models/restaurant.model');

        const recentOrders = await Order.find()
            .sort({ createdAt: -1 })
            .limit(10)
            .populate('restaurant', 'name owner');

        console.log("\n--- RECENT ORDERS ---");
        recentOrders.forEach(o => {
            console.log(`ID: ${o._id}`);
            console.log(`Status: ${o.status}`);
            console.log(`Restaurant: ${o.restaurantName} (ID: ${o.restaurant})`);
            console.log(`Total: ${o.total}`);
            console.log(`Customer ID: ${o.user}`);
            console.log(`Is Paid: ${o.isPaid}`);
            console.log(`Created At: ${o.createdAt}`);
            console.log('---');
        });

        const restaurantStats = await Restaurant.find().select('name totalOrders');
        console.log("\n--- RESTAURANT STATS ---");
        restaurantStats.forEach(r => {
            console.log(`${r.name}: ${r.totalOrders} orders`);
        });

        process.exit(0);
    } catch (err) {
        console.error("💥 ERROR:", err);
        process.exit(1);
    }
}

checkOrders();
