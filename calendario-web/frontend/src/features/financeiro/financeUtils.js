const currencyFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

const MONTH_LABELS = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

export function formatCurrency(value) {
  return currencyFormatter.format(Number(value) || 0);
}

export function monthLabel(month, year) {
  return `${MONTH_LABELS[month - 1]} de ${year}`;
}

export function currentMonthYear() {
  const now = new Date();
  return { month: now.getMonth() + 1, year: now.getFullYear() };
}

export function paymentStatus(entry) {
  if (entry.paidAmount <= 0) return 'pendente';
  if (entry.paidAmount >= entry.amount) return 'pago';
  return 'parcial';
}

export function formatEntryDate(date) {
  return new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function isGoalArchived(goal) {
  return Boolean(goal.archivedUntil) && new Date(goal.archivedUntil) > new Date();
}

export function goalInstallmentAmount(goal) {
  if (goal.installmentAmount) return goal.installmentAmount;
  return goal.totalInstallments ? goal.targetAmount / goal.totalInstallments : 0;
}

export function goalCurrentAmount(goal) {
  if (goal.totalInstallments) return goal.paidInstallments * goalInstallmentAmount(goal);
  return goal.currentAmount;
}

export function computeSimulatedTotals(entries, excludedIds, hypotheticalEntries) {
  let totalReceitas = 0;
  let totalDespesas = 0;

  entries.forEach((entry) => {
    if (excludedIds.has(entry._id)) return;
    if (entry.type === 'receita') totalReceitas += entry.amount;
    else totalDespesas += entry.amount;
  });

  hypotheticalEntries.forEach((entry) => {
    if (entry.type === 'receita') totalReceitas += entry.amount;
    else totalDespesas += entry.amount;
  });

  return { totalReceitas, totalDespesas, saldo: totalReceitas - totalDespesas };
}
