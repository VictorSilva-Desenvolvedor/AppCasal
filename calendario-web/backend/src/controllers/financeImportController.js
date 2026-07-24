const FinanceCategory = require('../models/FinanceCategory');
const FinanceEntry = require('../models/FinanceEntry');
const FinanceGoal = require('../models/FinanceGoal');
const { assertMonthOpen } = require('./financeEntryController');
const { parseBudgetWorkbook, suggestCategory } = require('../services/financeImportParser');
const { notifyPartner } = require('../services/notificationService');

function withSuggestion(items, categories, type) {
  return items.map((item) => ({ ...item, suggestedCategory: suggestCategory(item.description, categories, type) }));
}

async function preview(req, res) {
  if (!req.file) {
    const err = new Error('Nenhum arquivo enviado');
    err.status = 400;
    throw err;
  }

  const parsed = await parseBudgetWorkbook(req.file.buffer);
  const categories = await FinanceCategory.find({ team: req.userTeam });

  res.json({
    income: withSuggestion(parsed.income, categories, 'receita'),
    expenses: withSuggestion(parsed.expenses, categories, 'despesa'),
    necessities: withSuggestion(parsed.necessities, categories, 'despesa'),
    wishes: withSuggestion(parsed.wishes, categories, 'despesa'),
    goals: parsed.goals,
    warnings: parsed.warnings,
  });
}

function validateEntryPayload(entry) {
  if (!entry.description || !String(entry.description).trim()) return 'Descrição é obrigatória';
  if (typeof entry.amount !== 'number' || !Number.isFinite(entry.amount) || entry.amount < 0) {
    return 'Valor inválido';
  }
  if (entry.type !== 'receita' && entry.type !== 'despesa') return 'Tipo inválido';
  return null;
}

function validateGoalPayload(goal) {
  if (!goal.name || !String(goal.name).trim()) return 'Nome do objetivo é obrigatório';
  if (typeof goal.targetAmount !== 'number' || !Number.isFinite(goal.targetAmount) || goal.targetAmount < 0) {
    return 'Valor-alvo do objetivo inválido';
  }
  return null;
}

async function commit(req, res) {
  const { date, entries = [], goals = [] } = req.body;

  if (!date) {
    const err = new Error('Informe a data/mês de destino da importação');
    err.status = 400;
    throw err;
  }
  if (entries.length === 0 && goals.length === 0) {
    const err = new Error('Nenhum item selecionado para importar');
    err.status = 400;
    throw err;
  }

  for (const entry of entries) {
    const message = validateEntryPayload(entry);
    if (message) {
      const err = new Error(message);
      err.status = 400;
      throw err;
    }
  }
  for (const goal of goals) {
    const message = validateGoalPayload(goal);
    if (message) {
      const err = new Error(message);
      err.status = 400;
      throw err;
    }
  }

  await assertMonthOpen(date, req.userTeam);

  const entryDocs = entries.map((entry) => ({
    type: entry.type,
    description: String(entry.description).trim(),
    amount: entry.amount,
    category: entry.category || null,
    date,
    wishType: entry.wishType || null,
    reason: entry.reason || '',
    paidBy: req.userId,
    creator: req.userId,
    team: req.userTeam,
  }));

  const goalDocs = goals.map((goal) => ({
    name: String(goal.name).trim(),
    type: goal.type === 'parcelamento' ? 'parcelamento' : 'poupanca',
    targetAmount: goal.targetAmount,
    currentAmount: goal.currentAmount || 0,
    totalInstallments: goal.totalInstallments || null,
    paidInstallments: goal.paidInstallments || 0,
    installmentAmount: goal.installmentAmount || null,
    notes: goal.notes || '',
    creator: req.userId,
    team: req.userTeam,
  }));

  const [createdEntries, createdGoals] = await Promise.all([
    entryDocs.length ? FinanceEntry.insertMany(entryDocs) : Promise.resolve([]),
    goalDocs.length ? FinanceGoal.insertMany(goalDocs) : Promise.resolve([]),
  ]);

  res.json({ entriesCreated: createdEntries.length, goalsCreated: createdGoals.length });

  if (createdEntries.length > 0 || createdGoals.length > 0) {
    notifyPartner({
      actorId: req.userId,
      title: 'Importação financeira',
      body: `💰 Importou ${createdEntries.length} lançamento(s) e ${createdGoals.length} objetivo(s) no financeiro.`,
      link: '/app/financeiro',
      category: 'finance',
    }).catch((err) => console.error('Falha ao notificar importação financeira:', err.message));
  }
}

module.exports = { preview, commit };
