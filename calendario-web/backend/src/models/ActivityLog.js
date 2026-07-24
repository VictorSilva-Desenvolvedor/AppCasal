const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema(
  {
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    action: { type: String, enum: ['created', 'updated', 'deleted', 'archived'], required: true },
    module: {
      type: String,
      enum: ['evento', 'financeiro', 'habito', 'emocao', 'watchlist', 'convite', 'doce'],
      default: 'evento',
    },
    // Título do item (evento, lançamento, hábito, item da watchlist etc.), não só de eventos.
    eventTitle: { type: String, required: true },
    // Sem `ref` fixo: pode apontar para documentos de coleções diferentes conforme `module`.
    eventId: { type: mongoose.Schema.Types.ObjectId, default: null },
    details: { type: String, default: '' },
    team: { type: String, default: 'principal' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ActivityLog', activityLogSchema);
