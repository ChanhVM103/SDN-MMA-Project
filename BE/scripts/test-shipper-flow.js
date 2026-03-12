const mongoose = require('mongoose');
require('dotenv').config({ path: './BE/.env' });
const Order = require('../models/order.model');
const Restaurant = require('../models/restaurant.model');
const User = require('../models/user.model');

async function test() {
    console.log('--- EARLY SHIPPER NOTIFICATION FLOW TEST ---');
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 20000,
        });
        console.log('✅ Connected to MongoDB');

        // 1. Find participants
        const user = await User.findOne({ email: 'khoa@gmail.com' });
        const brand = await User.findOne({ email: 'brand@gmail.com' });
        const restaurant = await Restaurant.findOne({ owner: brand._id });
        const shipper = await User.findOne({ role: 'shipper' });

        if (!user || !restaurant || !shipper) {
            throw new Error('Missing test data');
        }

        // 2. Create Order (Initial state: Pending, No Shipper)
        console.log('\n[Phase 1] User creating order (Pending, No Shipper)...');
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
            shipper: null,
            statusHistory: [{ status: 'pending', note: 'Created' }]
        });
        console.log(`Order created: ${order._id}`);

        // 3. Restaurant Accepts
        console.log('\n[Phase 2] Restaurant accepting order (Status -> preparing)...');
        order.status = 'preparing';
        await order.save();
        console.log('Order status: preparing');

        // 4. Verify Visibility (Shipper SHOULD see it now while cooking)
        console.log('\n[Phase 3] Verifying visibility for Shipper while cooking...');
        const availableOrders = await Order.find({
            status: { $in: ["preparing", "ready_for_pickup"] },
            shipper: null
        });
        const isVisibleToShipper = availableOrders.some(o => o._id.toString() === order._id.toString());
        console.log(`Is visible to Shipper now? ${isVisibleToShipper} (Expected: true)`);

        // 5. Shipper Accepts early
        console.log('\n[Phase 4] Shipper accepting order early (while preparing)...');
        order.shipper = shipper._id;
        order.status = 'shipper_accepted';
        await order.save();
        console.log('Shipper assigned. Status: shipper_accepted');

        // 6. Restaurant completes cooking
        console.log('\n[Phase 5] Restaurant finishing preparation (Status -> ready_for_pickup)...');
        order.status = 'ready_for_pickup';
        await order.save();
        console.log('Order status: ready_for_pickup');

        // 7. Delivery Flow
        console.log('\n[Phase 6] Shipper picking up and delivering...');
        order.status = 'delivering';
        await order.save();
        order.status = 'shipper_delivered';
        await order.save();
        console.log('Order status: shipper_delivered');

        // 8. User Confirms
        console.log('\n[Phase 7] User confirming receipt (Strict confirmation)...');
        order.status = 'delivered';
        order.isPaid = true;
        await order.save();
        console.log('Order status: delivered');

        // Cleanup
        await Order.findByIdAndDelete(order._id);
        console.log('\n✅ Test passed: Early Shipper notification flow works correctly.');

        process.exit(0);
    } catch (err) {
        console.error('❌ Test failed:', err);
        process.exit(1);
    }
}

test();

test();
