const mongoose = require('mongoose');

const EMOTIONS = [
  'feliz', 'animado', 'alegre', 'grato', 'motivado', 'calmo', 'confiante', 'esperancoso', 'amado', 'orgulhoso',
  'pensativo', 'cansado', 'confuso', 'indiferente', 'surpreso', 'curioso', 'nostalgico',
  'triste', 'ansioso', 'estressado', 'irritado', 'frustrado', 'solitario', 'preocupado', 'desanimado', 'sobrecarregado',
];

const REASONS = ['namorado', 'trabalho', 'familia', 'amigos', 'dinheiro', 'estudos', 'sono_saude', 'outro'];

const emotionEntrySchema = new mongoose.Schema(
  {
    day: {
      type: String,
      required: true,
      match: [/^\d{4}-\d{2}-\d{2}$/, 'day deve estar no formato YYYY-MM-DD'],
    },
    period: { type: String, enum: ['manha', 'tarde', 'noite'], required: true },
    emotion: { type: String, enum: EMOTIONS, required: true },
    intensity: { type: Number, required: true, min: 1, max: 5 },
    note: { type: String, default: '', trim: true, maxlength: 280 },
    reasons: { type: [String], enum: REASONS, default: [] },
    reasonOther: { type: String, default: '', trim: true, maxlength: 60 },
    helpText: { type: String, default: '', trim: true, maxlength: 280 },
    helpTextBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    helpTextAt: { type: Date, default: null },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

emotionEntrySchema.index({ user: 1, day: 1 });
emotionEntrySchema.statics.EMOTIONS = EMOTIONS;
emotionEntrySchema.statics.REASONS = REASONS;

module.exports = mongoose.model('EmotionEntry', emotionEntrySchema);
