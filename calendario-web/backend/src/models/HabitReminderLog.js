const mongoose = require('mongoose');

const habitReminderLogSchema = new mongoose.Schema(
  {
    habit: { type: mongoose.Schema.Types.ObjectId, ref: 'Habit', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    day: {
      type: String,
      required: true,
      match: [/^\d{4}-\d{2}-\d{2}$/, 'day deve estar no formato YYYY-MM-DD'],
    },
  },
  { timestamps: true }
);

habitReminderLogSchema.index({ habit: 1, user: 1, day: 1 }, { unique: true });

module.exports = mongoose.model('HabitReminderLog', habitReminderLogSchema);
