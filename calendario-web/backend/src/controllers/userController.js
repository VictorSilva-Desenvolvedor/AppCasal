const User = require('../models/User');

async function list(req, res) {
  const users = await User.find().select('name email').sort('name');
  res.json(users);
}

module.exports = { list };
