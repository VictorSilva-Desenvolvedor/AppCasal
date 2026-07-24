const mongoose = require('mongoose');

const subtaskSchema = new mongoose.Schema(
  {
    label: { type: String, required: true, trim: true, maxlength: 80 },
    order: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const freezeDaySchema = new mongoose.Schema(
  {
    day: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
    usedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const streakHistoryEntrySchema = new mongoose.Schema(
  {
    startDay: { type: String, required: true },
    endDay: { type: String, required: true },
    length: { type: Number, required: true },
    unit: { type: String, enum: ['dias', 'semanas'], default: 'dias' },
  },
  { _id: false }
);

const habitSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },

    // 'casal' é exibido como "Sincronizado" na UI (label-only, sem migração
    // de dado — hábitos já criados continuam salvos como 'casal').
    type: {
      type: String,
      enum: ['casal', 'individual', 'espelhado', 'alternado', 'colaborativo'],
      required: true,
    },

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
        message: 'owner é obrigatório para hábitos individuais e deve ser nulo para os demais tipos',
      },
    },

    // Só usado quando type === 'alternado'. De quem é a vez agora — trocado
    // pro outro usuário fixo a cada check-in (ver habitCheckinController).
    currentTurnUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

    // Só usado quando type === 'colaborativo'. Nunca removida fisicamente
    // (soft-archive via active:false) pra não invalidar HabitCheckin.subtask
    // já registrados.
    subtasks: { type: [subtaskSchema], default: [] },

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

    category: {
      type: String,
      enum: ['saude', 'conexao_emocional', 'financas', 'crescimento', 'outro'],
      default: 'outro',
    },

    difficulty: { type: String, enum: ['facil', 'medio', 'dificil'], default: 'medio' },

    // ---- Frequência ----
    frequency: {
      kind: {
        type: String,
        enum: ['diario', 'dias_semana', 'vezes_por_semana', 'quinzenal'],
        default: 'diario',
      },
      daysOfWeek: { type: [Number], default: [] }, // 0=Dom..6=Sáb, só 'dias_semana'
      timesPerWeek: { type: Number, default: null, min: 1, max: 7 }, // só 'vezes_por_semana'
    },

    // ---- Duração / desafio ----
    durationType: { type: String, enum: ['para_sempre', 'desafio'], default: 'para_sempre' },
    challengeDays: { type: Number, default: null, min: 1 },
    challengeStartDay: { type: String, default: null }, // YYYY-MM-DD, setado na criação
    challengeCompletedAt: { type: Date, default: null },

    // ---- Meta quantitativa ----
    goalType: { type: String, enum: ['binario', 'quantitativo'], default: 'binario' },
    targetValue: { type: Number, default: null, min: 0 },
    unit: { type: String, default: '', trim: true, maxlength: 20 }, // ex: "copos" — só exibição

    // ---- Tolerância ----
    maxMissesPerWeek: { type: Number, default: 0, min: 0, max: 7 },

    // ---- Freezes (congeladores) ----
    freezesPerMonth: { type: Number, default: 2, min: 0, max: 30 },
    freezeDays: { type: [freezeDaySchema], default: [] },

    // ---- Streak persistida (calculada por backend/src/services/habitStreakService.js) ----
    currentStreak: { type: Number, default: 0 },
    bestStreak: { type: Number, default: 0 },
    lastEvaluatedDay: { type: String, default: null }, // idempotência do cron noturno
    missesThisWeek: { type: Number, default: 0 },
    missesWeekKey: { type: String, default: null }, // domingo da semana corrente (tolerância)

    streakHistory: { type: [streakHistoryEntrySchema], default: [] },

    recoveryChallenge: {
      active: { type: Boolean, default: false },
      brokenStreakLength: { type: Number, default: null },
      startDay: { type: String, default: null },
      daysCompleted: { type: Number, default: 0 },
      restoredAmount: { type: Number, default: null },
    },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    active: { type: Boolean, default: true },
    team: { type: String, default: 'principal' },
  },
  { timestamps: true }
);

habitSchema.index({ createdBy: 1 });

module.exports = mongoose.model('Habit', habitSchema);
