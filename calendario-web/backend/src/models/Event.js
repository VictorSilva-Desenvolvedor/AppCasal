const mongoose = require('mongoose');

const attachmentSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    name: { type: String, required: true },
    mimetype: { type: String, required: true },
  },
  { _id: false }
);

const recurrenceRuleSchema = new mongoose.Schema(
  {
    frequency: { type: String, enum: ['none', 'daily', 'weekly', 'monthly', 'yearly'], default: 'none' },
    interval: { type: Number, default: 1, min: 1 },
    daysOfWeek: {
      type: [Number],
      default: [],
      validate: {
        validator: (arr) => arr.every((d) => Number.isInteger(d) && d >= 0 && d <= 6),
        message: 'daysOfWeek deve conter apenas valores inteiros entre 0 (domingo) e 6 (sábado)',
      },
    },
    endDate: { type: Date, default: null },
    endCount: { type: Number, default: null, min: 1 },
  },
  { _id: false }
);

const CATEGORIES = ['trabalho', 'pessoal', 'saude', 'aniversario', 'financeiro', 'outro'];

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    date: { type: Date, required: true },
    creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    attachments: { type: [attachmentSchema], default: [] },
    recurring: { type: Boolean, default: false },
    recurrenceRule: { type: recurrenceRuleSchema, default: () => ({}) },
    category: { type: String, enum: CATEGORIES, default: null },
    color: { type: String, default: null },
    reminderOffsets: {
      type: [Number],
      default: [5, 3, 1],
      validate: {
        validator: (arr) => arr.every((d) => Number.isInteger(d) && d >= 1 && d <= 90),
        message: 'reminderOffsets deve conter apenas inteiros entre 1 e 90 (dias)',
      },
    },
    hideWhenPast: { type: Boolean, default: false },
  },
  { timestamps: true }
);

eventSchema.statics.CATEGORIES = CATEGORIES;

module.exports = mongoose.model('Event', eventSchema);
