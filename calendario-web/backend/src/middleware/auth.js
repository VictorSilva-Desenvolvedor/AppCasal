const jwt = require('jsonwebtoken');
const User = require('../models/User');

async function auth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: 'Token não informado' });
  }

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return res.status(401).json({ message: 'Token inválido ou expirado' });
  }

  // O token sozinho não basta: um usuário apagado continuaria com acesso até
  // o token expirar (7 dias), criando registros com autor órfão. O time vem do
  // banco, não do payload, pra que mudar o time de alguém valha na hora.
  const user = await User.findById(payload.id, 'team');
  if (!user) {
    return res.status(401).json({ message: 'Usuário não encontrado' });
  }

  req.userId = String(user._id);
  req.userTeam = user.team;
  next();
}

module.exports = auth;
