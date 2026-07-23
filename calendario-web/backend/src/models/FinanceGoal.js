const mongoose = require('mongoose');

const financeGoalSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: ['poupanca', 'parcelamento'], default: 'poupanca' },
    targetAmount: { type: Number, required: true, min: 0 },
    currentAmount: { type: Number, default: 0, min: 0 },
    totalInstallments: { type: Number, default: null, min: 1 },
    paidInstallments: { type: Number, default: 0, min: 0 },
    installmentAmount: { type: Number, default: null, min: 0 },
    notes: { type: String, default: '' },
    status: { type: String, enum: ['ativo', 'concluido'], default: 'ativo' },
    creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    team: { type: String, default: 'principal' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('FinanceGoal', financeGoalSchema);
