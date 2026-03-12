const mongoose = require('mongoose');
require('dotenv').config({ path: './BE/.env' });

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    const Restaurant = require('./models/restaurant.model');
    const Product = require('./models/product.model');

    // Find restaurant owned by "Nguyễn Khoa"
    const restaurants = await Restaurant.find({ name: /khoa/i });
    if (restaurants.length === 0) {
        // Try searching by owner name in User collection
        const User = require('./models/user.model');
        const users = await User.find({ fullName: /khoa/i });
        console.log("Users matching 'khoa':", users.map(u => ({ id: u._id, name: u.fullName, email: u.email, role: u.role })));

        if (users.length > 0) {
            for (const u of users) {
                const rest = await Restaurant.findOne({ owner: u._id });
                if (rest) {
                    console.log("\n--- Restaurant owned by", u.fullName, "---");
                    console.log("Restaurant ID:", rest._id);
                    console.log("Name:", rest.name);
                    console.log("Address:", rest.address);

                    const products = await Product.find({ restaurantId: rest._id });
                    console.log("\nProducts:", products.length);
                    products.forEach((p, i) => {
                        console.log(`  ${i + 1}. ${p.name} - ${p.price}đ (category: ${p.category || 'N/A'}, available: ${p.isAvailable})`);
                    });
                } else {
                    console.log("No restaurant found for user:", u.fullName);
                }
            }
        }
    } else {
        for (const rest of restaurants) {
            console.log("\n--- Restaurant:", rest.name, "---");
            console.log("Restaurant ID:", rest._id);
            console.log("Owner:", rest.owner);

            const products = await Product.find({ restaurantId: rest._id });
            console.log("Products:", products.length);
            products.forEach((p, i) => {
                console.log(`  ${i + 1}. ${p.name} - ${p.price}đ (category: ${p.category || 'N/A'}, available: ${p.isAvailable})`);
            });
        }
    }

    // Also list ALL restaurants for reference
    console.log("\n\n=== ALL RESTAURANTS ===");
    const allRests = await Restaurant.find({});
    for (const r of allRests) {
        const count = await Product.countDocuments({ restaurantId: r._id });
        console.log(`  - ${r.name} (ID: ${r._id}, owner: ${r.owner}, products: ${count})`);
    }

    process.exit(0);
}
run().catch(e => { console.error(e); process.exit(1); });
