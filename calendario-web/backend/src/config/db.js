const dns = require('dns');
const mongoose = require('mongoose');

// Alguns roteadores/provedores recusam consultas DNS do tipo SRV, que o
// "mongodb+srv://" precisa para descobrir os hosts do cluster Atlas.
// Forçar DNS público evita o erro "querySrv ECONNREFUSED".
dns.setServers(['8.8.8.8', '1.1.1.1']);

// Em ambiente serverless (Vercel), cada invocação pode reaproveitar o mesmo
// processo (warm start) — cacheamos a promise de conexão em `global` pra não
// abrir uma conexão nova (e repetir os syncIndexes) a cada requisição.
async function connectDB() {
  if (mongoose.connection.readyState === 1) return mongoose.connection;
  if (global._mongoConnPromise) return global._mongoConnPromise;

  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error('MONGO_URI não definida no .env');
  }

  global._mongoConnPromise = mongoose
    .connect(uri)
    .then(async (conn) => {
      console.log('MongoDB conectado:', mongoose.connection.name);

      // O schema de User trocou o índice único de "email" pra "name" — sincroniza
      // pra derrubar o índice antigo (senão a 2ª conta sem email colide nele).
      await require('../models/User').syncIndexes();

      // HabitCheckin trocou o índice único de {habit,user,day} (1 check-in por
      // dia) pra um índice parcial {habit,day,subtask} (só hábitos colaborativos)
      // — sincroniza pra derrubar o índice antigo, senão hábitos quantitativos
      // (múltiplos check-ins/dia) e colaborativos colidiriam nele.
      await require('../models/HabitCheckin').syncIndexes();

      return conn;
    })
    .catch((err) => {
      global._mongoConnPromise = null;
      throw err;
    });

  return global._mongoConnPromise;
}

module.exports = connectDB;
