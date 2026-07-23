const mongoose = require('mongoose');

const watchlistItemSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 140 },
    type: { type: String, enum: ['filme', 'serie', 'jogo'], required: true },

    // Kanban: mesmo espírito do UpdateRequest.status — sem endpoint dedicado de
    // "mover", o drag-and-drop do board só dá um PUT genérico trocando este campo.
    status: {
      type: String,
      enum: ['quero_ver', 'em_andamento', 'visto_ouvido'],
      default: 'quero_ver',
    },

    note: { type: String, default: '', trim: true, maxlength: 280 },
    posterUrl: { type: String, default: '', trim: true },
    creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('WatchlistItem', watchlistItemSchema);
