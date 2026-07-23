const jwt = require('jsonwebtoken');
const User = require('../models/User');

function generateToken(user) {
  return jwt.sign({ id: user._id, team: user.team }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function findByName(name) {
  return User.findOne({ name: new RegExp(`^${escapeRegex(name.trim())}$`, 'i') });
}

async function register(req, res) {
  const { name, password } = req.body;

  if (!name || !password) {
    return res.status(400).json({ message: 'Nome e senha são obrigatórios' });
  }

  const existing = await findByName(name);
  if (existing) {
    return res.status(409).json({ message: 'Já existe um usuário com esse nome' });
  }

  const user = await User.create({ name: name.trim(), password });
  const token = generateToken(user);

  res.status(201).json({ token, user });
}

async function login(req, res) {
  const { name, password } = req.body;

  if (!name || !password) {
    return res.status(400).json({ message: 'Nome e senha são obrigatórios' });
  }

  const user = await findByName(name);
  if (!user) {
    return res.status(401).json({ message: 'Credenciais inválidas' });
  }

  const valid = await user.comparePassword(password);
  if (!valid) {
    return res.status(401).json({ message: 'Credenciais inválidas' });
  }

  const token = generateToken(user);
  res.json({ token, user });
}

module.exports = { register, login };
