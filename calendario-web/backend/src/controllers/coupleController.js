const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { getOrCreateCode, joinWithCode } = require('../services/coupleService');

function generateToken(user) {
  return jwt.sign({ id: user._id, team: user.team }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

async function createCode(req, res) {
  const user = await User.findById(req.userId);
  const invite = await getOrCreateCode(user);
  res.json({ code: invite.code, expiresAt: invite.expiresAt });
}

async function join(req, res) {
  const user = await User.findById(req.userId);
  const updated = await joinWithCode(user, req.body.code);
  // Token novo com o time novo (o middleware já lê o time do banco, mas o
  // payload antigo deixaria de refletir a realidade).
  res.json({ token: generateToken(updated), user: updated });
}

module.exports = { createCode, join };
