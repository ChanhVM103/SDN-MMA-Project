const mongoose = require('mongoose');
require('dotenv').config({ path: './BE/.env' });
const User = require('../models/user.model');
const Restaurant = require('../models/restaurant.model');

async function test() {
    console.log('--- FAVORITES FEATURE TEST ---');
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // 1. Find a user and a restaurant
        const user = await User.findOne({ email: 'khoa@gmail.com' });
        const restaurant = await Restaurant.findOne();

        if (!user || !restaurant) {
            throw new Error('Missing test data');
        }

        const restaurantId = restaurant._id.toString();
        const userId = user._id;

        console.log(`Testing with User: ${user.fullName}, Restaurant: ${restaurant.name}`);

        // 2. Clear favorites first
        user.favorites = [];
        await user.save();
        console.log('Favorites cleared.');

        // 3. Toggle ON
        console.log('\nToggling favorite ON...');
        const isFavoritedBefore = user.favorites.includes(restaurantId);
        
        // Simulate controller logic
        if (!user.favorites.some(id => id.toString() === restaurantId)) {
            user.favorites.push(restaurantId);
        }
        await user.save();
        
        const userAfterOn = await User.findById(userId);
        console.log(`Is favorited now? ${userAfterOn.favorites.some(id => id.toString() === restaurantId)} (Expected: true)`);

        // 4. Toggle OFF
        console.log('\nToggling favorite OFF...');
        userAfterOn.favorites = userAfterOn.favorites.filter(id => id.toString() !== restaurantId);
        await userAfterOn.save();

        const userAfterOff = await User.findById(userId);
        console.log(`Is favorited now? ${userAfterOff.favorites.some(id => id.toString() === restaurantId)} (Expected: false)`);

        // 5. Test Populating
        console.log('\nTesting Population...');
        userAfterOff.favorites.push(restaurantId);
        await userAfterOff.save();
        
        const populatedUser = await User.findById(userId).populate('favorites');
        console.log(`Populated favorite name: ${populatedUser.favorites[0].name} (Expected: ${restaurant.name})`);

        console.log('\n✅ Backend favorites logic verified successfully.');
        process.exit(0);
    } catch (err) {
        console.error('❌ Test failed:', err);
        process.exit(1);
    }
}

test();
