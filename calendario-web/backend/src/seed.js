require('dotenv').config();

const mongoose = require('mongoose');
const connectDB = require('./config/db');
const User = require('./models/User');
const Event = require('./models/Event');
const FinanceCategory = require('./models/FinanceCategory');

const COUPLE_PASSWORD = '2605';
const COUPLE_NAMES = ['Victor', 'Maria'];

const DEFAULT_FINANCE_CATEGORIES = [
  { name: 'Salário', type: 'receita', color: '#16a34a' },
  { name: 'Outros', type: 'receita', color: '#0891b2' },
  { name: 'Moradia', type: 'despesa', color: '#2563eb' },
  { name: 'Transporte', type: 'despesa', color: '#f97316' },
  { name: 'Assinaturas', type: 'despesa', color: '#9333ea' },
  { name: 'Alimentação', type: 'despesa', color: '#ca8a04' },
  { name: 'Saúde', type: 'despesa', color: '#16a34a' },
  { name: 'Financiamento', type: 'despesa', color: '#dc2626' },
  { name: 'Educação', type: 'despesa', color: '#0891b2' },
  { name: 'Pessoal', type: 'despesa', color: '#db2777' },
  { name: 'Outros', type: 'despesa', color: '#64748b' },
];

async function upsertUser(name) {
  let user = await User.findOne({ name });
  if (!user) {
    user = await User.create({ name, password: COUPLE_PASSWORD });
    console.log('Usuário criado:', name, '/', COUPLE_PASSWORD);
  } else {
    console.log('Usuário já existia:', name);
  }
  return user;
}

async function seed() {
  await connectDB();

  const [victor, maria] = await Promise.all(COUPLE_NAMES.map(upsertUser));

  const existingEvents = await Event.countDocuments();
  if (existingEvents === 0) {
    const today = new Date();
    const sample = [
      { title: 'Reunião de equipe', description: 'Alinhamento semanal do time', offset: 1, creator: victor },
      { title: 'Consulta médica', description: 'Checkup de rotina', offset: 5, creator: maria },
      { title: 'Aniversário de namoro', description: 'Reservar o restaurante', offset: 10, creator: victor },
    ].map(({ title, description, offset, creator }) => ({
      title,
      description,
      date: new Date(today.getFullYear(), today.getMonth(), today.getDate() + offset),
      creator: creator._id,
      attachments: [],
    }));

    await Event.insertMany(sample);
    console.log(`${sample.length} eventos de exemplo criados`);
  } else {
    console.log('Já existem eventos no banco, nenhum evento de exemplo foi criado');
  }

  const existingCategories = await FinanceCategory.countDocuments();
  if (existingCategories === 0) {
    await FinanceCategory.insertMany(DEFAULT_FINANCE_CATEGORIES);
    console.log(`${DEFAULT_FINANCE_CATEGORIES.length} categorias financeiras padrão criadas`);
  } else {
    console.log('Já existem categorias financeiras no banco, nenhuma categoria padrão foi criada');
  }

  await mongoose.disconnect();
  console.log('Seed concluído');
}

seed().catch((err) => {
  console.error('Erro ao rodar seed:', err.message);
  process.exit(1);
});
