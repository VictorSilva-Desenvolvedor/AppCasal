const mongoose = require('mongoose');
const { MAX_HOLD_MS } = require('../utils/candyLimits');

const candyEntrySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    // Duração do "segurar", em ms. Já vem truncada pelo controller antes do
    // create; o max aqui é só uma segunda barreira.
    durationMs: { type: Number, required: true, min: 1, max: MAX_HOLD_MS },
    // Calculado no servidor via todayKeyInTimezone() — nunca aceito do client,
    // mesmo padrão do HabitCheckin (evita manipulação de fuso/relógio do device).
    day: { type: String, required: true, match: [/^\d{4}-\d{2}-\d{2}$/, 'day deve estar no formato YYYY-MM-DD'] },
    team: { type: String, default: 'principal' },
  },
  { timestamps: true }
);

candyEntrySchema.index({ team: 1, day: 1 });
candyEntrySchema.index({ team: 1, user: 1, day: 1 });

module.exports = mongoose.model('CandyEntry', candyEntrySchema);
