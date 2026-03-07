require('dotenv').config();
const mongoose = require('mongoose');
const Restaurant = require('./models/restaurant.model');

mongoose.connect(process.env.MONGODB_URI)
.then(async () => {
  const strId = '69aa78317a0f132571c8e881';
  const objId = new mongoose.Types.ObjectId(strId);
  
  const resStr = await Restaurant.findOne({ owner: strId });
  const resObj = await Restaurant.findOne({ owner: objId });
  
  console.log('Using String ID found:', resStr ? resStr.name : 'null');
  console.log('Using ObjectId found:', resObj ? resObj.name : 'null');
  process.exit(0);
});
