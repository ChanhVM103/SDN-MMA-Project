const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
require('dotenv').config();

async function runTest() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to DB");

    const User = require('./models/user.model');
    const Restaurant = require('./models/restaurant.model');
    const Product = require('./models/product.model');
    const Order = require('./models/order.model');

    // 1. Get Brand User
    let brandUser = await User.findOne({ email: 'brand_test_api@test.com' });
    if (!brandUser) {
        brandUser = new User({ email: 'brand_test_api@test.com', fullName: 'Brand Test API', password: '123456', role: 'brand' });
        await brandUser.save();
    }

    // 2. Get Normal User
    let normalUser = await User.findOne({ email: 'customer_test_api@test.com' });
    if (!normalUser) {
        normalUser = new User({ email: 'customer_test_api@test.com', fullName: 'Customer Test API', password: '123456', role: 'user' });
        await normalUser.save();
    }

    const brandToken = jwt.sign({ id: brandUser._id, role: brandUser.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
    const userToken = jwt.sign({ id: normalUser._id, role: normalUser.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
    const API_URL = 'http://localhost:3000/api';

    // Find a restaurant to order from. 
    const restaurant = await Restaurant.findOne({});
    if (!restaurant) {
        console.log("No restaurant found! Aborting test");
        process.exit(1);
    }

    console.log("\n--- TEST: CUSTOMER CREATES ORDER ---");
    const orderRes = await fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userToken}` },
        body: JSON.stringify({
            restaurantId: restaurant._id,
            items: [{ productId: new mongoose.Types.ObjectId(), name: "Test Food", price: 50000, quantity: 2, image: 'test.png' }],
            deliveryAddress: "123 Test Street",
        })
    });
    const orderData = await orderRes.json();
    console.log('Customer Order Response:', orderData.success ? 'Success!' : orderData);
    if (!orderData.success) process.exit(1);
    const orderId = orderData.data._id;


    console.log("\n--- TEST: RESTAURANT REJECTS WITH REASON ---");
    const rejectRes = await fetch(`${API_URL}/orders/restaurant/${restaurant._id}/cancel/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${brandToken}` },
        body: JSON.stringify({ reason: "Hết nguyên liệu" })
    });
    const rejectData = await rejectRes.json();
    console.log('Restaurant Reject Response:', rejectData.success ? 'Success!' : rejectData);


    console.log("\n--- TEST: CUSTOMER CREATES NEW ORDER ---");
    const orderRes2 = await fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userToken}` },
        body: JSON.stringify({
            restaurantId: restaurant._id,
            items: [{ productId: new mongoose.Types.ObjectId(), name: "Test Food 2", price: 100000, quantity: 1, image: 'test2.png' }],
            deliveryAddress: "456 Test Ave",
        })
    });
    const orderData2 = await orderRes2.json();
    const orderId2 = orderData2.data._id;


    console.log("\n--- TEST: RESTAURANT ACCEPTS (PENDING -> PREPARING) ---");
    const acceptRes = await fetch(`${API_URL}/orders/restaurant/${restaurant._id}/status/${orderId2}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${brandToken}` },
        body: JSON.stringify({ status: "preparing" })
    });
    const acceptData = await acceptRes.json();
    console.log('Accept Response:', acceptData.success ? 'Success!' : acceptData);


    console.log("\n--- TEST: RESTAURANT SENDS (PREPARING -> DELIVERING) ---");
    const sendRes = await fetch(`${API_URL}/orders/restaurant/${restaurant._id}/status/${orderId2}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${brandToken}` },
        body: JSON.stringify({ status: "delivering" })
    });
    const sendData = await sendRes.json();
    console.log('Deliver Response:', sendData.success ? 'Success!' : sendData);


    console.log("\n--- CLEANUP ---");
    await Order.deleteMany({ user: normalUser._id });
    console.log("Deleted test orders.");

    process.exit(0);
}

runTest().catch(console.error);
