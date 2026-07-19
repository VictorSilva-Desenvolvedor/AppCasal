const mongoose = require('mongoose');

const reminderLogSchema = new mongoose.Schema(
  {
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    offsetDays: { type: Number, required: true, enum: [5, 3, 1] },
    occurrenceDate: { type: Date, required: true },
  },
  { timestamps: true }
);

reminderLogSchema.index(
  { event: 1, recipient: 1, offsetDays: 1, occurrenceDate: 1 },
  { unique: true }
);

module.exports = mongoose.model('ReminderLog', reminderLogSchema);
