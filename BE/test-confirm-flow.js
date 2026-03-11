const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: 'BE/.env' });

const API_URL = 'http://localhost:3000/api';

async function runTest() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("✅ Connected to DB");

        const User = require('./models/user.model');
        const Restaurant = require('./models/restaurant.model');
        const Order = require('./models/order.model');

        // 1. Get/Create Users
        let brandUser = await User.findOne({ email: 'brand_test@test.com' });
        if (!brandUser) {
            brandUser = new User({ email: 'brand_test@test.com', fullName: 'Brand Test', password: '123456', role: 'brand' });
            await brandUser.save();
        }

        let customerUser = await User.findOne({ email: 'customer_test@test.com' });
        if (!customerUser) {
            customerUser = new User({ email: 'customer_test@test.com', fullName: 'Customer Test', password: '123456', role: 'user' });
            await customerUser.save();
        }

        const brandToken = jwt.sign({ id: brandUser._id, role: brandUser.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
        const customerToken = jwt.sign({ id: customerUser._id, role: customerUser.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

        // 2. Ensure Restaurant exists and belongs to brand
        let restaurant = await Restaurant.findOne({ owner: brandUser._id });
        if (!restaurant) {
            restaurant = new Restaurant({
                name: "Test Restaurant",
                owner: brandUser._id,
                address: "Test Address",
                image: "test.png",
                isOpen: true,
                rating: 5,
                deliveryTime: 30,
                deliveryFee: 15000,
                tags: ["Test"]
            });
            await restaurant.save();
            console.log("✅ Created Test Restaurant");
        }

        console.log("\n--- STEP 1: CUSTOMER CREATES ORDER ---");
        const orderRes = await fetch(`${API_URL}/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${customerToken}` },
            body: JSON.stringify({
                restaurantId: restaurant._id,
                items: [{ productId: "650000000000000000000001", name: "Test Dish", price: 50000, quantity: 2, image: 'test.png' }],
                deliveryAddress: "Home Sweet Home",
                paymentMethod: "cash"
            })
        });
        const orderData = await orderRes.json();
        if (!orderData.success) {
            console.error("❌ Order Creation Failed:", orderData);
            process.exit(1);
        }
        const orderId = orderData.data._id;
        console.log(`✅ Order Created: ${orderId}, Status: ${orderData.data.status}`);

        console.log("\n--- STEP 2: BRAND MARKS AS PREPARING ---");
        const prepareRes = await fetch(`${API_URL}/orders/${orderId}/brand-status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${brandToken}` },
            body: JSON.stringify({ status: "preparing" })
        });
        const prepareData = await prepareRes.json();
        console.log('Brand Preparing Response:', prepareData.success ? '✅ Success' : '❌ Failed: ' + JSON.stringify(prepareData));
        if (!prepareData.success) process.exit(1);

        console.log("\n--- STEP 3: BRAND MARKS AS DELIVERING ---");
        const deliverRes = await fetch(`${API_URL}/orders/${orderId}/brand-status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${brandToken}` },
            body: JSON.stringify({ status: "delivering" })
        });
        const deliverData = await deliverRes.json();
        console.log('Brand Delivering Response:', deliverData.success ? '✅ Success' : '❌ Failed: ' + JSON.stringify(deliverData));
        if (!deliverData.success) process.exit(1);

        console.log("\n--- STEP 4: CUSTOMER CONFIRMS RECEIPT ---");
        const confirmRes = await fetch(`${API_URL}/orders/${orderId}/confirm-received`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${customerToken}` }
        });
        const confirmData = await confirmRes.json();
        console.log('Customer Confirm Response:', confirmData.success ? '✅ Success' : '❌ Failed: ' + JSON.stringify(confirmData));
        if (!confirmData.success) process.exit(1);

        console.log("\n--- STEP 5: VERIFY REVENUE ---");
        const statsRes = await fetch(`${API_URL}/orders/restaurant/${restaurant._id}/stats`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${brandToken}` }
        });
        const statsData = await statsRes.json();
        console.log('Restaurant Stats:', statsData.success ? `✅ Revenue: ${statsData.data.totalRevenue}` : '❌ Failed');

        console.log("\n✅ ALL TESTS PASSED!");
        process.exit(0);
    } catch (err) {
        console.error("💥 TEST ERROR:", err);
        process.exit(1);
    }
}

runTest();
