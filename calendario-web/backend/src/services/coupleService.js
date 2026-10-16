const crypto = require('crypto');
const mongoose = require('mongoose');
const User = require('../models/User');
const CoupleCode = require('../models/CoupleCode');
const FinanceCategory = require('../models/FinanceCategory');
const FinanceEntry = require('../models/FinanceEntry');
const FinanceMonth = require('../models/FinanceMonth');

// Sem 0/O e 1/I: o código é lido e digitado à mão.
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 6;
const CODE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_TEAM_SIZE = 2;

function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

function randomCode() {
  const bytes = crypto.randomBytes(CODE_LENGTH);
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join('');
}

function normalizeCode(code) {
  return String(code || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
}

// Reaproveita o código ainda válido do time; senão cria um novo.
async function getOrCreateCode(user) {
  const members = await User.countDocuments({ team: user.team });
  if (members >= MAX_TEAM_SIZE) {
    throw httpError(409, 'Vocês já estão juntos no mesmo espaço.');
  }

  const existing = await CoupleCode.findOne({ team: user.team, usedAt: null, expiresAt: { $gt: new Date() } });
  if (existing) return existing;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      return await CoupleCode.create({
        code: randomCode(),
        team: user.team,
        createdBy: user._id,
        expiresAt: new Date(Date.now() + CODE_TTL_MS),
      });
    } catch (err) {
      if (err.code !== 11000) throw err;
    }
  }
  throw httpError(500, 'Não foi possível gerar o código agora. Tente de novo.');
}

// Leva os dados do time de origem para o time do casal. Categorias financeiras
// com o mesmo nome e tipo (as padrão, por exemplo) viram uma só, e os
// lançamentos passam a apontar para a que ficou; meses financeiros que os dois
// já tinham não são duplicados.
async function migrateTeamData(fromTeam, toTeam) {
  const targetCategories = await FinanceCategory.find({ team: toTeam });
  const targetByKey = new Map(targetCategories.map((c) => [`${c.type}:${c.name.trim().toLowerCase()}`, c]));
  const sourceCategories = await FinanceCategory.find({ team: fromTeam });
  for (const cat of sourceCategories) {
    const match = targetByKey.get(`${cat.type}:${cat.name.trim().toLowerCase()}`);
    if (match) {
      await FinanceEntry.updateMany({ team: fromTeam, category: cat._id }, { $set: { category: match._id } });
      await FinanceCategory.deleteOne({ _id: cat._id });
    }
  }

  const targetMonths = await FinanceMonth.find({ team: toTeam }, 'month year');
  const takenMonths = new Set(targetMonths.map((m) => `${m.year}-${m.month}`));
  const sourceMonths = await FinanceMonth.find({ team: fromTeam }, 'month year');
  const duplicateMonthIds = sourceMonths.filter((m) => takenMonths.has(`${m.year}-${m.month}`)).map((m) => m._id);
  if (duplicateMonthIds.length) await FinanceMonth.deleteMany({ _id: { $in: duplicateMonthIds } });

  for (const name of mongoose.modelNames()) {
    if (name === 'User' || name === 'CoupleCode') continue;
    const model = mongoose.model(name);
    if (!model.schema.path('team')) continue;
    await model.updateMany({ team: fromTeam }, { $set: { team: toTeam } });
  }
}

async function joinWithCode(user, rawCode) {
  const code = normalizeCode(rawCode);
  if (code.length !== CODE_LENGTH) {
    throw httpError(400, 'O código do casal tem 6 letras e números.');
  }

  const invite = await CoupleCode.findOne({ code });
  if (!invite || invite.usedAt || invite.expiresAt <= new Date()) {
    throw httpError(404, 'Código inválido ou expirado. Peça um novo ao seu par.');
  }
  if (invite.team === user.team) {
    throw httpError(400, 'Esse é o seu próprio código. Envie-o para o seu par.');
  }

  const targetMembers = await User.countDocuments({ team: invite.team });
  if (targetMembers >= MAX_TEAM_SIZE) {
    throw httpError(409, 'Esse espaço já tem duas pessoas.');
  }
  const ownMembers = await User.countDocuments({ team: user.team });
  if (ownMembers > 1) {
    throw httpError(409, 'Você já divide o espaço com alguém.');
  }

  const fromTeam = user.team;
  await migrateTeamData(fromTeam, invite.team);
  await User.updateOne({ _id: user._id }, { $set: { team: invite.team } });
  await CoupleCode.updateOne({ _id: invite._id }, { $set: { usedBy: user._id, usedAt: new Date() } });
  // Códigos que o próprio usuário tinha gerado no espaço antigo deixam de valer.
  await CoupleCode.deleteMany({ team: fromTeam, usedAt: null });

  return User.findById(user._id);
}

module.exports = { getOrCreateCode, joinWithCode, normalizeCode, CODE_LENGTH };
