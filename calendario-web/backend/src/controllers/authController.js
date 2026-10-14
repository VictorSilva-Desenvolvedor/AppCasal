const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');
const FinanceCategory = require('../models/FinanceCategory');
const { DEFAULT_FINANCE_CATEGORIES } = require('../constants/defaultFinanceCategories');

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

  // Conta nova ganha um time só dela: sem isso caía no default 'principal' e
  // via todos os eventos, finanças e usuários do casal.
  const _id = new mongoose.Types.ObjectId();
  const user = await User.create({ _id, name: name.trim(), password, team: `solo-${_id}` });
  // Time novo começa com as categorias padrão — sem elas a primeira despesa
  // não tinha como ser lançada.
  await FinanceCategory.insertMany(DEFAULT_FINANCE_CATEGORIES.map((category) => ({ ...category, team: user.team })));
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
