const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    const User = require('./app/models/User');
    require('./app/models/Institution');
    const users = await User.find({ role: 'instructor' }).populate('institutionId', 'name');
    console.log(JSON.stringify(users, null, 2));
    process.exit(0);
  })
  .catch(e => {
    console.error(e);
    process.exit(1);
  });
