const mongoose = require('mongoose');

const reimbursementSchema = new mongoose.Schema(
  {
    owedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    owedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true, min: 0 },
    description: { type: String, required: true, trim: true },
    status: { type: String, enum: ['pendente', 'quitado'], default: 'pendente' },
    settledAt: { type: Date, default: null },
    relatedEntry: { type: mongoose.Schema.Types.ObjectId, ref: 'FinanceEntry', default: null },
    creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    team: { type: String, default: 'principal' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Reimbursement', reimbursementSchema);
