require('dotenv').config();

const mongoose = require('mongoose');
const connectDB = require('./config/db');
const User = require('./models/User');
const UpdateRequest = require('./models/UpdateRequest');

const ITEMS = [
  {
    title: 'Deixar mais claro qual é o dia de hoje no calendário',
    description: 'Hoje não dá para saber rápido qual é o dia atual só de olhar a grade do calendário.',
  },
  {
    title: 'Trocar o visual do filtro "Só com anexo"',
    description: 'O quadradinho de checkbox do filtro está feio, precisa de um componente mais bonito (toggle/chip).',
  },
  {
    title: 'Detalhe visual especial para datas importantes (aniversários)',
    description: 'Datas importantes/recorrentes (tipo aniversário) poderiam ter um destaque visual bem legal no calendário.',
  },
  {
    title: 'Avisar 5, 3 e 1 dia antes de uma data importante',
    description: 'Programar um aviso dentro do próprio app quando faltarem 5, 3 ou 1 dia para uma data importante.',
  },
  {
    title: 'Melhorar o visual da opção de recorrência',
    description: 'O seletor de repetição do evento (não repete / uma vez / todo ano) está feio, precisa de um redesign.',
  },
  {
    title: 'Consultas e eventos temporários que somem depois do dia',
    description: 'Adicionar eventos temporários (ex: consultas) que apagam de verdade depois que o dia passa.',
  },
  {
    title: 'Escolher uma cor para cada evento/data',
    description: 'Hoje a cor do evento é só a do criador. Poder escolher uma cor específica para cada evento.',
  },
];

async function seedUpdateRequests() {
  await connectDB();

  const victor = await User.findOne({ name: 'Victor' });
  if (!victor) {
    throw new Error('Usuário "Victor" não encontrado — rode o seed principal primeiro.');
  }

  let created = 0;
  for (const item of ITEMS) {
    const exists = await UpdateRequest.findOne({ title: item.title });
    if (exists) {
      console.log('Já existe, pulando:', item.title);
      continue;
    }
    await UpdateRequest.create({ ...item, creator: victor._id });
    created += 1;
    console.log('Criado:', item.title);
  }

  console.log(`${created} pedido(s) de atualização criado(s)`);
  await mongoose.disconnect();
}

seedUpdateRequests().catch((err) => {
  console.error('Erro ao rodar seed de pedidos de atualização:', err.message);
  process.exit(1);
});
