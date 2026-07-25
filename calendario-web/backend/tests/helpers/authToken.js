const jwt = require('jsonwebtoken');

function tokenFor(user) {
  return jwt.sign({ id: user._id, team: user.team }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

module.exports = { tokenFor };
