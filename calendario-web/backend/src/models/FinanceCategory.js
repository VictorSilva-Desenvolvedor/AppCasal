const mongoose = require('mongoose');

const financeCategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: ['receita', 'despesa'], required: true },
    color: { type: String, default: '#64748b' },
    team: { type: String, default: 'principal' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('FinanceCategory', financeCategorySchema);
