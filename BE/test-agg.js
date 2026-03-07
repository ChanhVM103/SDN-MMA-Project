require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/user.model');
const Restaurant = require('./models/restaurant.model');

mongoose.connect(process.env.MONGODB_URI)
.then(async () => {
  const users = await User.aggregate([
    {
      $lookup: {
        from: 'restaurants',
        localField: '_id',
        foreignField: 'owner',
        as: 'rData'
      }
    },
    {
      $addFields: {
        hasR: { $gt: [{ $size: '$rData' }, 0] }
      }
    }
  ]);
  console.log(users.map(u => u.email + ': ' + u.hasR));
  process.exit(0);
});
