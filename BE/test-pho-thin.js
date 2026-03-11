const mongoose = require('mongoose');
require('dotenv').config();

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    const Restaurant = require('./models/restaurant.model');
    const Product = require('./models/product.model');

    const rest = await Restaurant.findOne({ name: /Phở Thìn/i });
    if (!rest) return console.log("Not found Phở Thìn");
    console.log("Found Restaurant:", rest.name, rest._id);

    const prods = await Product.find({ restaurant: rest._id });
    console.log("Products count for this restaurant:", prods.length);
    prods.forEach(p => console.log("-", p.name, p.category, p.isAvailable));

    process.exit(0);
}
run();
