require('dotenv').config();

const mongoose = require('mongoose');
const connectDB = require('./config/db');
const User = require('./models/User');
const Event = require('./models/Event');
const FinanceCategory = require('./models/FinanceCategory');
const FinanceEntry = require('./models/FinanceEntry');
const FinanceGoal = require('./models/FinanceGoal');

const COUPLE_PASSWORD = '2605';
const COUPLE_NAMES = ['Victor', 'Maria'];

// Equipe de teste fixa para verificação manual/dev (curl, Playwright, etc.) —
// reaproveitar sempre essas 2 contas em vez de registrar novas a cada sessão
// de teste. Ficam na equipe ('team') 'teste', isoladas dos dados reais do
// casal principal (team 'principal') em todas as features.
const TEST_TEAM = 'teste';
const TEST_USERS = [
  { name: 'Teste', password: 'Teste@123' },
  { name: 'Teste2', password: 'Teste2@123' },
];

// Data real migrada da planilha "Orçamento mensal 14 julho lIMPO.xlsx" do casal.
const BUDGET_REFERENCE_DATE = new Date(2026, 6, 14);

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

// Tabela "Renda" (planilha Renda mensal, B3:C6)
const BUDGET_INCOME = [{ description: 'SALARIO', amount: 3100, category: 'Salário' }];

// Tabela "Despesa" (planilha Despesas mensais, B3:E15) — contas do mês
const BUDGET_EXPENSES = [
  { description: 'Internet', amount: 130, category: 'Moradia' },
  { description: 'Gasolina', amount: 150, category: 'Transporte' },
  { description: 'Credito celular', amount: 40, category: 'Assinaturas' },
  { description: 'Assinaturas (spotify e ifood)', amount: 40, category: 'Assinaturas' },
  { description: 'Alimentação', amount: 380, category: 'Alimentação' },
  { description: 'academia', amount: 150, category: 'Saúde' },
  { description: 'Parcela da moto (11/36)', amount: 780.3, category: 'Financiamento' },
  { description: 'Faculdade', amount: 270, category: 'Educação' },
  { description: 'Parcela da moto (12/36)', amount: 780.3, category: 'Financiamento' },
  { description: 'Pasta de amendoim', amount: 125, category: 'Alimentação' },
  { description: 'oculos + coisa de ver direção celular', amount: 50, category: 'Saúde' },
];

// Tabela "Despesa4" (B18:E22) — despesas futuras, apenas necessidades
const BUDGET_NECESSITIES = [
  {
    description: 'Luvas moto/ bota impermeavel',
    amount: 350,
    category: 'Transporte',
    reason: 'Segurança + impedir doenças',
  },
  { description: 'alarme moto antifurto', amount: 100, category: 'Transporte', reason: 'Segurança' },
  { description: 'Rastreador antifurto moto', amount: 100, category: 'Transporte', reason: 'Segurança' },
  { description: 'trava cadeado freio disco', amount: 50, category: 'Transporte', reason: 'Segurança' },
];

// Tabela "Despesa45" (B24:E34) — despesas futuras, comodidades e desejos
const BUDGET_WISHES = [
  {
    description: 'bau moto 60L',
    amount: 900,
    category: 'Transporte',
    reason: 'Levar capacetes e coisas de viagem',
  },
  { description: 'Tenis Melhor', amount: 200, category: 'Pessoal', reason: 'Tenis' },
  { description: 'Celular novo', amount: 2100, category: 'Pessoal', reason: '2 anos com o mesmo celular e foda' },
  { description: 'Relogio Redmi', amount: 600, category: 'Pessoal', reason: 'relogio foda faz tudo' },
  { description: 'Alforge Moto 80L', amount: 350, category: 'Transporte', reason: 'caso o bau seja muito caro' },
  { description: 'Cabelo', amount: 35, category: 'Pessoal', reason: 'Minha mãe briga comigo se não corta' },
  { description: 'Kit lavagem moto vonixx', amount: 200, category: 'Transporte', reason: 'limpa a moto foda' },
  { description: 'central multimidia moto 5 polegadas', amount: 400, category: 'Transporte', reason: 'foda' },
];

// Planilha "Objetivos"
const BUDGET_GOALS = [
  { name: 'Casinha', type: 'poupanca', targetAmount: 12000, currentAmount: 2390, notes: 'Objetivos grandes requerem grandes esforços' },
  {
    name: 'Faculdade',
    type: 'poupanca',
    targetAmount: 3300,
    currentAmount: 0,
    totalInstallments: 12,
    installmentAmount: 275,
    paidInstallments: 0,
  },
  {
    name: 'Emergência',
    type: 'poupanca',
    targetAmount: 3000,
    currentAmount: 0,
    totalInstallments: 24,
    installmentAmount: 125,
    paidInstallments: 0,
  },
  {
    name: 'Ipva Moto',
    type: 'poupanca',
    targetAmount: 420,
    currentAmount: 0,
    notes: 'Pra moto n ser presa',
  },
  {
    name: 'Financiamento da moto',
    type: 'parcelamento',
    targetAmount: 36 * 780.3,
    totalInstallments: 36,
    installmentAmount: 780.3,
    paidInstallments: 10,
    notes: 'vai que um dia se pagar ela consegue comprar outro veiculo ne haha',
  },
];

async function upsertUser(name, password = COUPLE_PASSWORD, includeInHabits = true, team = 'principal') {
  let user = await User.findOne({ name });
  if (!user) {
    user = await User.create({ name, password, includeInHabits, team });
    console.log('Usuário criado:', name, '/', password);
  } else {
    // Comparar com o documento hidratado não basta: o Mongoose aplica o
    // default do schema em memória mesmo quando o campo nunca foi gravado no
    // banco, então `user.includeInHabits !== includeInHabits` pode dar falso
    // negativo e o campo nunca é persistido de fato. updateOne grava direto.
    await User.updateOne({ _id: user._id }, { $set: { includeInHabits, team } });
    user.includeInHabits = includeInHabits;
    user.team = team;
    console.log('Usuário já existia:', name);
  }
  return user;
}

async function seed() {
  await connectDB();

  const [victor, maria] = await Promise.all(COUPLE_NAMES.map((name) => upsertUser(name)));
  await Promise.all(TEST_USERS.map(({ name, password }) => upsertUser(name, password, true, TEST_TEAM)));

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

  const existingCategories = await FinanceCategory.countDocuments({ team: 'principal' });
  if (existingCategories === 0) {
    await FinanceCategory.insertMany(DEFAULT_FINANCE_CATEGORIES);
    console.log(`${DEFAULT_FINANCE_CATEGORIES.length} categorias financeiras padrão criadas`);
  } else {
    console.log('Já existem categorias financeiras no banco, nenhuma categoria padrão foi criada');
  }

  // Equipe de teste precisa das próprias categorias — sandbox isolado, não
  // reaproveita as categorias reais do casal principal.
  const existingTestCategories = await FinanceCategory.countDocuments({ team: TEST_TEAM });
  if (existingTestCategories === 0) {
    await FinanceCategory.insertMany(DEFAULT_FINANCE_CATEGORIES.map((c) => ({ ...c, team: TEST_TEAM })));
    console.log(`${DEFAULT_FINANCE_CATEGORIES.length} categorias financeiras padrão criadas para a equipe de teste`);
  } else {
    console.log('Já existem categorias financeiras da equipe de teste, nenhuma categoria padrão foi criada');
  }

  const categories = await FinanceCategory.find({ team: 'principal' });
  const categoryId = (name) => categories.find((c) => c.name === name)?._id;

  const existingEntries = await FinanceEntry.countDocuments();
  if (existingEntries === 0) {
    const receitas = BUDGET_INCOME.map((item) => ({
      type: 'receita',
      description: item.description,
      amount: item.amount,
      category: categoryId(item.category),
      date: BUDGET_REFERENCE_DATE,
      paidBy: victor._id,
      creator: victor._id,
    }));

    const despesas = BUDGET_EXPENSES.map((item) => ({
      type: 'despesa',
      description: item.description,
      amount: item.amount,
      category: categoryId(item.category),
      date: BUDGET_REFERENCE_DATE,
      paidBy: victor._id,
      creator: victor._id,
    }));

    const necessidades = BUDGET_NECESSITIES.map((item) => ({
      type: 'despesa',
      description: item.description,
      amount: item.amount,
      category: categoryId(item.category),
      date: BUDGET_REFERENCE_DATE,
      wishType: 'necessidade',
      reason: item.reason,
      paidBy: victor._id,
      creator: victor._id,
    }));

    const desejos = BUDGET_WISHES.map((item) => ({
      type: 'despesa',
      description: item.description,
      amount: item.amount,
      category: categoryId(item.category),
      date: BUDGET_REFERENCE_DATE,
      wishType: 'desejo',
      reason: item.reason,
      paidBy: victor._id,
      creator: victor._id,
    }));

    const allEntries = [...receitas, ...despesas, ...necessidades, ...desejos];
    await FinanceEntry.insertMany(allEntries);
    console.log(`${allEntries.length} lançamentos financeiros migrados da planilha`);
  } else {
    console.log('Já existem lançamentos financeiros no banco, nenhum lançamento da planilha foi criado');
  }

  const existingGoals = await FinanceGoal.countDocuments();
  if (existingGoals === 0) {
    const goals = BUDGET_GOALS.map((goal) => ({ ...goal, creator: victor._id }));
    await FinanceGoal.insertMany(goals);
    console.log(`${goals.length} objetivos financeiros migrados da planilha`);
  } else {
    console.log('Já existem objetivos financeiros no banco, nenhum objetivo da planilha foi criado');
  }

  await mongoose.disconnect();
  console.log('Seed concluído');
}

seed().catch((err) => {
  console.error('Erro ao rodar seed:', err.message);
  process.exit(1);
});
