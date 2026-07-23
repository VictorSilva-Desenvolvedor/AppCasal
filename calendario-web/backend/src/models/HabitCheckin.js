const mongoose = require('mongoose');

const habitCheckinSchema = new mongoose.Schema(
  {
    habit: { type: mongoose.Schema.Types.ObjectId, ref: 'Habit', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    day: {
      type: String,
      required: true,
      match: [/^\d{4}-\d{2}-\d{2}$/, 'day deve estar no formato YYYY-MM-DD'],
    },
    note: { type: String, default: '', trim: true, maxlength: 140 },
    emoji: { type: String, default: '', trim: true, maxlength: 8 },
  },
  { timestamps: true }
);

// No máximo 1 check-in por usuário por hábito por dia (hábito é binário: fez/não fez).
habitCheckinSchema.index({ habit: 1, user: 1, day: 1 }, { unique: true });

module.exports = mongoose.model('HabitCheckin', habitCheckinSchema);
