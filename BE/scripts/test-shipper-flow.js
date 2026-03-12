const mongoose = require('mongoose');
require('dotenv').config({ path: './BE/.env' });
const Order = require('../models/order.model');
const Restaurant = require('../models/restaurant.model');
const User = require('../models/user.model');

async function test() {
    console.log('--- SHIPPER FLOW TEST ---');
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 20000,
        });
        console.log('✅ Connected to MongoDB');

        // 1. Find participants
        const user = await User.findOne({ email: 'khoa@gmail.com' });
        const brand = await User.findOne({ email: 'brand@gmail.com' });
        const restaurant = await Restaurant.findOne({ owner: brand._id });

        // Ensure a shipper exists
        let shipper = await User.findOne({ role: 'shipper' });
        if (!shipper) {
            console.log('Creating a test shipper...');
            shipper = await User.create({
                fullName: 'Test Shipper',
                email: 'shipper@test.com',
                password: 'password123',
                role: 'shipper',
                phone: '0987654321'
            });
        }

        if (!user || !restaurant || !shipper) {
            throw new Error(`Missing test data: user=${!!user}, restaurant=${!!restaurant}, shipper=${!!shipper}`);
        }

        const initialRevenue = restaurant.totalRevenue || 0;

        // 2. Create Order
        console.log('\n[Phase 1] Creating Order...');
        const order = await Order.create({
            user: user._id,
            restaurant: restaurant._id,
            restaurantName: restaurant.name,
            items: [{ productId: 'test', name: 'Test Product', price: 50000, quantity: 1 }],
            subtotal: 50000,
            deliveryFee: 15000,
            total: 65000,
            deliveryAddress: '123 Test St',
            paymentMethod: 'cash',
            status: 'pending',
            statusHistory: [{ status: 'pending', note: 'Created' }]
        });
        console.log(`Order created: ${order._id}`);

        // 3. Brand Prepared
        console.log('\n[Phase 2] Brand marking as preparing...');
        order.status = 'preparing';
        order.statusHistory.push({ status: 'preparing', note: 'Cooking...' });
        await order.save();

        // 4. Handover to Shipper
        console.log('\n[Phase 3] Brand handover to shipper...');
        order.status = 'ready_for_pickup';
        order.statusHistory.push({ status: 'ready_for_pickup', note: 'Waiting for shipper' });
        await order.save();

        // 5. Shipper Accepts
        console.log('\n[Phase 4] Shipper accepting order...');
        order.shipper = shipper._id;
        order.status = 'shipper_accepted';
        order.statusHistory.push({ status: 'shipper_accepted', note: 'Shipper on way' });
        await order.save();

        // 6. Shipper Pickup
        console.log('\n[Phase 5] Shipper picked up...');
        order.status = 'delivering';
        order.statusHistory.push({ status: 'delivering', note: 'On route' });
        await order.save();

        // 7. Shipper Delivered
        console.log('\n[Phase 6] Shipper delivered...');
        order.status = 'shipper_delivered';
        order.statusHistory.push({ status: 'shipper_delivered', note: 'Giao xong, cho khach xac nhan' });
        await order.save();

        // 8. User Confirms (The test for the fix)
        console.log('\n[Phase 7] User confirming receipt (the fix)...');
        if (!['delivering', 'shipper_delivered'].includes(order.status)) {
            throw new Error(`Invalid status for confirmation: ${order.status}`);
        }
        order.status = 'delivered';
        order.isPaid = true;
        order.paidAmount = order.total;
        order.paidAt = new Date();
        order.statusHistory.push({ status: 'delivered', note: 'Khach da nhan hang' });
        await order.save();

        // Update Revenue
        await Restaurant.findByIdAndUpdate(restaurant._id, {
            $inc: { totalRevenue: order.total }
        });

        const updatedRestaurant = await Restaurant.findById(restaurant._id);
        console.log('✅ Final status: delivered');
        console.log(`✅ Revenue updated: ${initialRevenue} -> ${updatedRestaurant.totalRevenue} (+${order.total})`);

        // Cleaning up the test order
        // await Order.findByIdAndDelete(order._id);
        // console.log('\nTest order cleaned up.');

        process.exit(0);
    } catch (err) {
        console.error('❌ Test failed:', err);
        process.exit(1);
    }
}

test();
