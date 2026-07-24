const CandyEntry = require('../models/CandyEntry');
const User = require('../models/User');
const { todayKeyInTimezone, addDaysToKey, weekStartKey } = require('../utils/dayKey');
const { MAX_HOLD_MS } = require('../utils/candyLimits');
const { logActivity } = require('../services/activityLogger');

const POPULATE = [{ path: 'user', select: 'name' }];

function monthRangeKeys(dayKey) {
  const [y, m] = dayKey.split('-').map(Number);
  const start = `${dayKey.slice(0, 7)}-01`;
  const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate(); // dia 0 do próx. mês = último dia deste
  const end = `${dayKey.slice(0, 7)}-${String(lastDay).padStart(2, '0')}`;
  return { start, end };
}

function rangeForPeriod(period, dateParam) {
  const base = dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam) ? dateParam : todayKeyInTimezone();
  if (period === 'week') {
    const start = weekStartKey(base);
    return { start, end: addDaysToKey(start, 6) };
  }
  if (period === 'month') return monthRangeKeys(base);
  return { start: base, end: base }; // 'day' (default)
}

async function list(req, res) {
  const { period, date, user } = req.query;
  const filter = { team: req.userTeam };
  if (user) filter.user = user;
  if (period) {
    const { start, end } = rangeForPeriod(period, date);
    filter.day = { $gte: start, $lte: end };
  }
  const entries = await CandyEntry.find(filter).populate(POPULATE).sort({ createdAt: -1 });
  res.json(entries);
}

async function create(req, res) {
  const raw = Number(req.body.durationMs);
  if (!Number.isFinite(raw) || raw <= 0) {
    return res.status(400).json({ message: 'Duração inválida' });
  }
  const durationMs = Math.min(Math.round(raw), MAX_HOLD_MS);

  const entry = await CandyEntry.create({
    user: req.userId,
    durationMs,
    day: todayKeyInTimezone(),
    team: req.userTeam,
  });

  await logActivity({
    actor: req.userId,
    action: 'created',
    module: 'doce',
    itemTitle: `${(durationMs / 1000).toFixed(1)}s de doce`,
    itemId: entry._id,
    details: `Registrou ${(durationMs / 1000).toFixed(1)}s de doce/besteira`,
    team: req.userTeam,
  });

  const populated = await entry.populate(POPULATE);
  res.status(201).json(populated);
}

async function remove(req, res) {
  const entry = await CandyEntry.findById(req.params.id);
  if (!entry || String(entry.team) !== req.userTeam) {
    return res.status(404).json({ message: 'Registro não encontrado' });
  }
  if (String(entry.user) !== req.userId) {
    const err = new Error('Você só pode excluir seus próprios registros');
    err.status = 403;
    throw err;
  }

  await CandyEntry.findByIdAndDelete(entry._id);

  await logActivity({
    actor: req.userId,
    action: 'deleted',
    module: 'doce',
    itemTitle: `${(entry.durationMs / 1000).toFixed(1)}s de doce`,
    team: req.userTeam,
  });

  res.status(204).send();
}

async function ranking(req, res) {
  const { period = 'day', date } = req.query;
  const { start, end } = rangeForPeriod(period, date);

  const [roster, entries] = await Promise.all([
    User.find({ team: req.userTeam }).select('name').sort('name'),
    CandyEntry.find({ team: req.userTeam, day: { $gte: start, $lte: end } }),
  ]);

  const totals = new Map();
  entries.forEach((e) => {
    const acc = totals.get(String(e.user)) || { totalMs: 0, count: 0 };
    acc.totalMs += e.durationMs;
    acc.count += 1;
    totals.set(String(e.user), acc);
  });

  // Roster inteiro do time entra no ranking, mesmo quem tem 0 registros.
  const rows = roster.map((u) => {
    const acc = totals.get(String(u._id)) || { totalMs: 0, count: 0 };
    return { user: { _id: u._id, name: u.name }, totalMs: acc.totalMs, count: acc.count };
  });

  rows.sort((a, b) => a.totalMs - b.totalMs);
  const minTotal = rows[0]?.totalMs ?? 0;
  const winners = rows.filter((r) => r.totalMs === minTotal);
  const canDeclareWinner = entries.length > 0 && winners.length === 1;
  rows.forEach((r) => {
    r.isWinner = canDeclareWinner && r.totalMs === minTotal;
  });

  res.json({ period, start, end, ranking: rows });
}

module.exports = { list, create, remove, ranking };
