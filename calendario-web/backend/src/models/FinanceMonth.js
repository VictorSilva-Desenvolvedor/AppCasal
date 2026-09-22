const mongoose = require('mongoose');

const financeMonthSchema = new mongoose.Schema(
  {
    month: { type: Number, required: true, min: 1, max: 12 },
    year: { type: Number, required: true },
    status: { type: String, enum: ['aberto', 'fechado'], default: 'aberto' },
    closedAt: { type: Date, default: null },
    closedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    team: { type: String, default: 'principal' },
    // Séries de despesas fixas já replicadas pra este mês (recurringRootId).
    // Evita recriar um fixo que alguém apagou de propósito neste mês.
    generatedSeries: { type: [mongoose.Schema.Types.ObjectId], default: [] },
  },
  { timestamps: true }
);

financeMonthSchema.index({ month: 1, year: 1, team: 1 }, { unique: true });

module.exports = mongoose.model('FinanceMonth', financeMonthSchema);
