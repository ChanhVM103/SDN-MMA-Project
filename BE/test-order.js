const mongoose = require('mongoose');
require('dotenv').config();

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    const User = require('./models/user.model');
    const Restaurant = require('./models/restaurant.model');
    const Product = require('./models/product.model');
    const Order = require('./models/order.model');

    const products = await Product.find({});
    let validProd = null;
    let validRest = null;

    for (const p of products) {
        const r = await Restaurant.findById(p.restaurant);
        if (r) {
            validProd = p;
            validRest = r;
            break;
        }
    }

    if (!validProd) return console.log("No valid product-restaurant pair found in DB");

    const user = await User.findOne({ role: 'user' });
    if (!user) return console.log("No user found");

    console.log("Will order product:", validProd.name, validProd._id, "from rest", validRest.name, validRest._id);

    try {
        const order = new Order({
            user: user._id,
            restaurant: validRest._id,
            restaurantName: validRest.name,
            items: [{
                productId: validProd._id.toString(),
                name: validProd.name,
                price: validProd.price,
                quantity: 1,
            }],
            subtotal: validProd.price,
            deliveryFee: 15000,
            total: validProd.price + 15000,
            deliveryAddress: "Test Address"
        });
        await order.save();
        console.log("Order saved successfully:", order._id);
    } catch (e) {
        console.error("Order save failed!", e.name, e.message);
        if (e.errors) {
            console.error(Object.keys(e.errors).map(k => `${k}: ${e.errors[k].message}`));
        }
    }
    process.exit(0);
}
run();
