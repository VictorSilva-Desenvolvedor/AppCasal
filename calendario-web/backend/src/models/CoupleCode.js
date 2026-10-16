const mongoose = require('mongoose');

// Código do casal: quem já tem conta gera, o parceiro digita e entra no mesmo
// espaço (team). Vale por 7 dias e só uma vez.
const coupleCodeSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true },
    team: { type: String, required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    expiresAt: { type: Date, required: true },
    usedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    usedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

coupleCodeSchema.index({ team: 1, usedAt: 1 });

module.exports = mongoose.model('CoupleCode', coupleCodeSchema);
