const mongoose = require('mongoose');

const habitSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    type: { type: String, enum: ['casal', 'individual'], required: true },

    // Só preenchido quando type === 'individual'. Representa de quem são os
    // check-ins (não quem criou o registro) — mesmo espírito de
    // FinanceEntry.paidBy vs FinanceEntry.creator.
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      validate: {
        validator: function (v) {
          return this.type === 'individual' ? Boolean(v) : v == null;
        },
        message: 'owner é obrigatório para hábitos individuais e deve ser nulo para hábitos de casal',
      },
    },

    emoji: { type: String, default: '🙂', trim: true, maxlength: 8 },
    color: { type: String, default: '#64748b', trim: true },

    // HH:mm, 24h. Nulo = sem lembrete configurado.
    reminderTime: {
      type: String,
      default: null,
      validate: {
        validator: (v) => v === null || /^([01]\d|2[0-3]):[0-5]\d$/.test(v),
        message: 'reminderTime deve estar no formato HH:mm',
      },
    },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

habitSchema.index({ createdBy: 1 });

module.exports = mongoose.model('Habit', habitSchema);
