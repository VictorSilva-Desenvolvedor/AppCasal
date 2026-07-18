require('dotenv').config();

const mongoose = require('mongoose');
const connectDB = require('./config/db');
const User = require('./models/User');
const Event = require('./models/Event');

const TEST_EMAIL = 'teste@teste.com';
const TEST_PASSWORD = '123456';

async function seed() {
  await connectDB();

  let user = await User.findOne({ email: TEST_EMAIL });
  if (!user) {
    user = await User.create({ name: 'Usuário Teste', email: TEST_EMAIL, password: TEST_PASSWORD });
    console.log('Usuário de teste criado:', TEST_EMAIL, '/', TEST_PASSWORD);
  } else {
    console.log('Usuário de teste já existia:', TEST_EMAIL, '/', TEST_PASSWORD);
  }

  const existingEvents = await Event.countDocuments();
  if (existingEvents === 0) {
    const today = new Date();
    const sample = [
      { title: 'Reunião de equipe', description: 'Alinhamento semanal do time', offset: 1 },
      { title: 'Consulta médica', description: 'Checkup de rotina', offset: 5 },
      { title: 'Aniversário da Ana', description: 'Não esquecer o presente', offset: 10 },
    ].map(({ title, description, offset }) => ({
      title,
      description,
      date: new Date(today.getFullYear(), today.getMonth(), today.getDate() + offset),
      creator: user._id,
      attachments: [],
    }));

    await Event.insertMany(sample);
    console.log(`${sample.length} eventos de exemplo criados`);
  } else {
    console.log('Já existem eventos no banco, nenhum evento de exemplo foi criado');
  }

  await mongoose.disconnect();
  console.log('Seed concluído');
}

seed().catch((err) => {
  console.error('Erro ao rodar seed:', err.message);
  process.exit(1);
});
