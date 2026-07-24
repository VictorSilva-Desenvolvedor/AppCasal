require('dotenv').config();

const mongoose = require('mongoose');
const connectDB = require('./config/db');
const User = require('./models/User');
const Event = require('./models/Event');
const Habit = require('./models/Habit');
const HabitCheckin = require('./models/HabitCheckin');
const EmotionEntry = require('./models/EmotionEntry');
const FinanceEntry = require('./models/FinanceEntry');
const FinanceGoal = require('./models/FinanceGoal');
const FinanceCategory = require('./models/FinanceCategory');
const FinanceMonth = require('./models/FinanceMonth');
const Reimbursement = require('./models/Reimbursement');
const ActivityLog = require('./models/ActivityLog');
const UpdateRequest = require('./models/UpdateRequest');
const WatchlistItem = require('./models/WatchlistItem');
const WatchlistRating = require('./models/WatchlistRating');

// Migração única: preenche `team: 'principal'` em todo documento existente
// que ainda não tem o campo (criado antes da equipe de teste existir).
// Mongoose só aplica `default` a documentos NOVOS — sem isso, os dados reais
// do casal ficariam invisíveis assim que os controllers passassem a filtrar
// por `team`. Rodar uma única vez, com backup do banco antes em produção.
const MODELS = [
  User,
  Event,
  Habit,
  HabitCheckin,
  EmotionEntry,
  FinanceEntry,
  FinanceGoal,
  FinanceCategory,
  FinanceMonth,
  Reimbursement,
  ActivityLog,
  UpdateRequest,
  WatchlistItem,
  WatchlistRating,
];

async function migrate() {
  await connectDB();

  for (const Model of MODELS) {
    const result = await Model.updateMany({ team: { $exists: false } }, { $set: { team: 'principal' } });
    console.log(`${Model.modelName}: ${result.modifiedCount} documento(s) migrado(s) para team "principal"`);
  }

  await mongoose.disconnect();
  console.log('Migração de equipes concluída');
}

migrate().catch((err) => {
  console.error('Erro ao rodar migração de equipes:', err.message);
  process.exit(1);
});
