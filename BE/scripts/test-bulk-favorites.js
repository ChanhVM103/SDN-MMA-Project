const mongoose = require('mongoose');
require('dotenv').config({ path: './BE/.env' });
const User = require('../models/user.model');
const Restaurant = require('../models/restaurant.model');

async function testBulk() {
    console.log('--- BULK FAVORITES FEATURE TEST ---');
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // 1. Find a user and multiple restaurants
        const user = await User.findOne({ email: 'khoa@gmail.com' });
        const restaurants = await Restaurant.find().limit(3);

        if (!user || restaurants.length < 2) {
            throw new Error('Missing test data (need at least 2 restaurants)');
        }

        const restaurantIds = restaurants.map(r => r._id.toString());
        const userId = user._id;

        console.log(`Testing with User: ${user.fullName}`);
        console.log(`Restaurants to add: ${restaurants.map(r => r.name).join(', ')}`);

        // 2. Setup favorites
        user.favorites = restaurantIds;
        await user.save();
        console.log('Test favorites setup complete.');

        // 3. Verify IDs are there
        let testUser = await User.findById(userId);
        console.log(`Count BEFORE bulk remove: ${testUser.favorites.length}`);

        // 4. Simulate Bulk Remove Logic (Controller logic)
        const idsToRemove = [restaurantIds[0], restaurantIds[1]];
        console.log(`Removing ${idsToRemove.length} items...`);
        
        testUser.favorites = testUser.favorites.filter(id => !idsToRemove.includes(id.toString()));
        await testUser.save();

        // 5. Verify result
        const finalUser = await User.findById(userId);
        console.log(`Count AFTER bulk remove: ${finalUser.favorites.length}`);
        
        const remainingContainsRemoved = finalUser.favorites.some(id => idsToRemove.includes(id.toString()));
        if (!remainingContainsRemoved && finalUser.favorites.length === (restaurantIds.length - idsToRemove.length)) {
            console.log('\n✅ Bulk removal logic verified successfully.');
        } else {
            console.log('\n❌ Bulk removal verification failed.');
        }

        process.exit(0);
    } catch (err) {
        console.error('❌ Test failed:', err);
        process.exit(1);
    }
}

testBulk();
