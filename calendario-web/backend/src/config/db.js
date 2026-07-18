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
}

module.exports = connectDB;
