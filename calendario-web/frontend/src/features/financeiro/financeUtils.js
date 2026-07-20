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
