const mongoose = require('mongoose');

const hypotheticalEntrySchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['receita', 'despesa'], required: true },
    description: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
  },
  { _id: true }
);

const financeSimulationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    month: { type: Number, required: true, min: 1, max: 12 },
    year: { type: Number, required: true },
    excludedEntryIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'FinanceEntry' }],
    hypotheticalEntries: [hypotheticalEntrySchema],
    creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    team: { type: String, default: 'principal' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('FinanceSimulation', financeSimulationSchema);
