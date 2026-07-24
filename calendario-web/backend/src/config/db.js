const dns = require('dns');
const mongoose = require('mongoose');

// Alguns roteadores/provedores recusam consultas DNS do tipo SRV, que o
// "mongodb+srv://" precisa para descobrir os hosts do cluster Atlas.
// Forçar DNS público evita o erro "querySrv ECONNREFUSED".
dns.setServers(['8.8.8.8', '1.1.1.1']);

async function connectDB() {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    throw new Error('MONGO_URI não definida no .env');
  }

  await mongoose.connect(uri);
  console.log('MongoDB conectado:', mongoose.connection.name);

  // O schema de User trocou o índice único de "email" pra "name" — sincroniza
  // pra derrubar o índice antigo (senão a 2ª conta sem email colide nele).
  await require('../models/User').syncIndexes();

  // HabitCheckin trocou o índice único de {habit,user,day} (1 check-in por
  // dia) pra um índice parcial {habit,day,subtask} (só hábitos colaborativos)
  // — sincroniza pra derrubar o índice antigo, senão hábitos quantitativos
  // (múltiplos check-ins/dia) e colaborativos colidiriam nele.
  await require('../models/HabitCheckin').syncIndexes();
}

module.exports = connectDB;
