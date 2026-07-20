const mongoose = require('mongoose');

const financeEntrySchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['receita', 'despesa'], required: true },
    description: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'FinanceCategory', required: true },
    date: { type: Date, required: true },
    paidAmount: { type: Number, default: 0, min: 0 },
    wishType: { type: String, enum: ['necessidade', 'desejo'], default: null },
    reason: { type: String, default: '' },
    paidBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    sharedWith: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    splitAmount: { type: Number, default: null, min: 0 },
    creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('FinanceEntry', financeEntrySchema);
