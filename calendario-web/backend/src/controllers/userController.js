const User = require('../models/User');

async function list(req, res) {
  // Escopo por equipe (team) é o que isola a equipe de teste do casal
  // principal — includeInHabits só controla pareamento dentro dos hábitos.
  const users = await User.find({ team: req.userTeam }).select('name includeInHabits').sort('name');
  res.json(users);
}

async function me(req, res) {
  const user = await User.findById(req.userId);
  if (!user) {
    return res.status(404).json({ message: 'Usuário não encontrado' });
  }
  res.json(user);
}

async function updateMe(req, res) {
  const { whatsappNumber } = req.body;

  if (whatsappNumber !== undefined) {
    const digits = String(whatsappNumber).replace(/\D/g, '');
    if (digits && digits.length < 10) {
      return res.status(400).json({ message: 'Número de WhatsApp inválido (informe DDD + número)' });
    }
  }

  const user = await User.findByIdAndUpdate(
    req.userId,
    { whatsappNumber: String(whatsappNumber || '').trim() },
    { new: true, runValidators: true }
  );
  res.json(user);
}

module.exports = { list, me, updateMe };
