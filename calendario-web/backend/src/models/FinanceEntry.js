const mongoose = require('mongoose');

const financeEntryImageSchema = new mongoose.Schema(
  { url: String, name: String, mimetype: String },
  { _id: false }
);

const financeEntrySchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['receita', 'despesa'], required: true },
    description: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'FinanceCategory', default: null },
    date: { type: Date, required: true },
    paidAmount: { type: Number, default: 0, min: 0 },
    nature: { type: String, enum: ['fixa', 'com_prazo', 'unica', 'a_decidir'], default: 'unica' },
    recurringRootId: { type: mongoose.Schema.Types.ObjectId, ref: 'FinanceEntry', default: null },
    wishType: { type: String, enum: ['necessidade', 'desejo'], default: null },
    reason: { type: String, default: '' },
    image: { type: financeEntryImageSchema, default: null },
    paidBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    sharedWith: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    splitAmount: { type: Number, default: null, min: 0 },
    creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    team: { type: String, default: 'principal' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('FinanceEntry', financeEntrySchema);
