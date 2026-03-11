const mongoose = require('mongoose');
require('dotenv').config({ path: 'BE/.env' });

async function checkUser() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const User = require('./models/user.model');
        const user = await User.findOne({ email: /brand/i });
        console.log("--- USER CHECK ---");
        if (user) {
            console.log("ID:", user._id);
            console.log("Email:", user.email);
            console.log("Role:", user.role);
        } else {
            console.log("No brand user found");
        }
        process.exit(0);
    } catch (e) { console.error(e); process.exit(1); }
}
checkUser();
