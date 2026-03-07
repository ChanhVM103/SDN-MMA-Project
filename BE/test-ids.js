require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');

mongoose.connect(process.env.MONGODB_URI)
.then(async () => {
  const db = mongoose.connection.db;
  const user = await db.collection('users').findOne({ email: 'thevanmsad@gmail.com' });
  const rests = await db.collection('restaurants').find({}).toArray();
  
  let outData = {
    user: {
      _id: user._id,
      _id_type: typeof user._id,
      isObjectId: typeof user._id === 'object' && user._id.constructor.name === 'ObjectId'
    },
    restaurants: []
  };

  for (const r of rests) {
    if (r.name.includes("Phuc") || r.name.includes("Phúc")) {
        outData.restaurants.push({
            name: r.name,
            owner: r.owner,
            owner_type: typeof r.owner,
            isObjectId: typeof r.owner === 'object' && r.owner.constructor.name === 'ObjectId',
            matchExact: String(user._id) === String(r.owner)
        });
    }
  }

  fs.writeFileSync('out-json.txt', JSON.stringify(outData, null, 2));
  process.exit(0);
});
