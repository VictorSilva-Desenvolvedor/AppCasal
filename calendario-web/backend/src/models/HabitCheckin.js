const mongoose = require('mongoose');

const reactionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    emoji: { type: String, required: true, maxlength: 8 },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

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

    // Só preenchido quando habit.type === 'colaborativo'. Referencia
    // habit.subtasks[]._id — QUAL subtarefa este registro conclui.
    subtask: { type: mongoose.Schema.Types.ObjectId, default: null },

    // Só preenchido quando habit.goalType === 'quantitativo'. Quantidade
    // DESTE lançamento (ex: 1 copo) — não um total acumulado. Múltiplos
    // lançamentos no mesmo dia são somados na leitura.
    value: { type: Number, default: null, min: 0 },

    reactions: { type: [reactionSchema], default: [] },
    team: { type: String, default: 'principal' },
  },
  { timestamps: true }
);

// Só relevante pro caso 'colaborativo': garante 1 conclusão por subtarefa por
// dia, não importa quem marcou. Índice parcial — não afeta os demais tipos
// (subtask fica null pra eles).
// MongoDB não aceita $ne em partialFilterExpression — $type é a forma
// suportada de expressar "subtask não é null" (null tem BSON type próprio,
// diferente de 'objectId').
habitCheckinSchema.index(
  { habit: 1, day: 1, subtask: 1 },
  { unique: true, partialFilterExpression: { subtask: { $type: 'objectId' } } }
);

// Índice de consulta (não é mais único — ver habitCheckinController: a
// duplicidade de check-in binário simples passou a ser validada em código,
// já que quantitativo precisa de múltiplos docs por dia e colaborativo de
// múltiplos usuários/subtasks por dia).
habitCheckinSchema.index({ habit: 1, user: 1, day: 1 });

module.exports = mongoose.model('HabitCheckin', habitCheckinSchema);
