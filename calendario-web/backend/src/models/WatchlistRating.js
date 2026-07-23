const mongoose = require('mongoose');

const watchlistRatingSchema = new mongoose.Schema(
  {
    item: { type: mongoose.Schema.Types.ObjectId, ref: 'WatchlistItem', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    hearts: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, default: '', trim: true, maxlength: 280 },
    team: { type: String, default: 'principal' },
  },
  { timestamps: true }
);

// No máximo 1 avaliação por usuário por item — mesma ideia do índice único de
// HabitCheckin (habit+user+day), só que sem a dimensão de tempo. Dá um 409
// automático (Registro duplicado) no handler central se o front tentar criar
// duas vezes em vez de fazer PUT na já existente.
watchlistRatingSchema.index({ item: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('WatchlistRating', watchlistRatingSchema);
