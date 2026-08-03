const mongoose = require('mongoose');

const taskItemSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },

    kind: {
      type: String,
      enum: ['diaria', 'semanal', 'mensal', 'unica'],
      required: true,
    },

    // Sub-lista dentro das diárias (manhã/tarde/noite/o dia todo). Só faz
    // sentido para kind 'diaria'; nos outros tipos fica sempre em 'dia-todo'.
    // Itens criados antes deste campo existir leem como undefined — o front
    // trata isso como 'dia-todo' (ver PERIOD_ORDER em tarefasUtils).
    period: {
      type: String,
      enum: ['manha', 'tarde', 'noite', 'dia-todo'],
      default: 'dia-todo',
    },

    // De quem é a lista — só ele pode remover o item, mesmo que quem tenha
    // adicionado (createdBy) tenha sido o parceiro.
    belongsTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    // Posição manual dentro da seção (mesmo belongsTo + kind + period), definida
    // pelo arraste. Itens anteriores a este campo ficam todos em 0, e o
    // desempate por createdAt no list() preserva a ordem em que já apareciam.
    order: { type: Number, default: 0 },

    completed: { type: Boolean, default: false },
    completedAt: { type: Date, default: null },

    // dayKey (YYYY-MM-DD) do último reset noturno aplicado a este item —
    // garante idempotência caso o cron dispare mais de uma vez no mesmo dia
    // (mesmo espírito de Habit.lastEvaluatedDay). 'unica' nunca seta isso.
    lastResetKey: { type: String, default: null },

    team: { type: String, default: 'principal' },
  },
  { timestamps: true }
);

taskItemSchema.index({ team: 1, belongsTo: 1 });
taskItemSchema.index({ team: 1, belongsTo: 1, kind: 1, period: 1, order: 1 });
taskItemSchema.index({ kind: 1, lastResetKey: 1 });

module.exports = mongoose.model('TaskItem', taskItemSchema);
