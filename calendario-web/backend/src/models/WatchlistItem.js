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

    // Metadados vindos do TMDB/RAWG na hora de escolher a capa (services/posterSearch.js).
    genres: { type: [String], default: [] },
    director: { type: String, default: '', trim: true },
    duration: { type: String, default: '', trim: true },
    rating: { type: Number, default: null },
    synopsis: { type: String, default: '', trim: true, maxlength: 500 },

    creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    team: { type: String, default: 'principal' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('WatchlistItem', watchlistItemSchema);
