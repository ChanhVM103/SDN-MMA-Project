const mongoose = require('mongoose');
require('dotenv').config();

async function check() {
    await mongoose.connect(process.env.MONGODB_URI);

    const User = require('./models/user.model');
    const Restaurant = require('./models/restaurant.model');
    const Order = require('./models/order.model');

    // 1. Get current logged in brand user that we created via test-order-flow
    const brandUser = await User.findOne({ email: 'brand_test_api@test.com' });
    console.log("Brand Test User ID:", brandUser?._id);

    // 2. Who owns the restaurant?
    const restaurants = await Restaurant.find({});
    console.log(`\nTotal Restaurants in DB: ${restaurants.length}`);
    restaurants.forEach((r, i) => {
        console.log(`[${i}] Rest ID: ${r._id}, Owner: ${r.owner}, Name: ${r.name}`);
    });

    // 4. Products and Addons
    const Product = require('./models/product.model');
    const allProducts = await Product.find({}).limit(10);
    console.log(`\nSample Products with Addons:`);
    allProducts.forEach(p => {
        console.log(`Product: ${p.name}, ID: ${p._id}, Addons: ${p.addons?.length || 0}`);
        if (p.addons && p.addons.length > 0) {
            p.addons.forEach(a => console.log(`  - Addon Group: ${a.name}, Options: ${a.options?.length}`));
        }
    });

    process.exit(0);
}

check().catch(console.error);
