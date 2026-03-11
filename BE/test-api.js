const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
require('dotenv').config();

async function runTest() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to DB");

    // Find or create a fake brand user
    const User = require('./models/user.model');
    const Product = require('./models/product.model');

    let user = await User.findOne({ email: 'brand_test_api@test.com' });
    if (!user) {
        user = new User({ email: 'brand_test_api@test.com', fullName: 'Brand Test API', password: '123456', role: 'brand' });
        await user.save();
    } else {
        user.role = 'brand';
        await user.save();
    }

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
    console.log("Generated Token");

    const API_URL = 'http://localhost:3000/api';

    // 1. Create Product
    console.log("Testing POST Create...");
    const res1 = await fetch(`${API_URL}/products/restaurant/${user._id}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
            name: 'Test Product API', price: 50000, category: 'Test Category', image: 'test.png', addons: []
        })
    });
    const data1 = await res1.json();
    console.log('Create Response:', data1.success ? 'Success!' : data1);

    if (!data1.success) {
        console.log('Aborting tests due to failure in Create limit.');
        process.exit(1);
    }
    const productId = data1.data._id;

    // 2. Update Product (Toggle isAvailable like "Ẩn/Hiện" API call)
    console.log("Testing PUT Update...");
    const res2 = await fetch(`${API_URL}/products/restaurant/${user._id}/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ isAvailable: false })
    });
    const data2 = await res2.json();
    console.log('Update Response:', data2.success ? 'Success!' : data2);

    // 3. Delete Product (from Action Sheet)
    console.log("Testing DELETE Product...");
    const res3 = await fetch(`${API_URL}/products/restaurant/${user._id}/products/${productId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    });
    const data3 = await res3.json();
    console.log('Delete Response:', data3.success ? 'Success!' : data3);

    process.exit(0);
}

runTest().catch(console.error);
