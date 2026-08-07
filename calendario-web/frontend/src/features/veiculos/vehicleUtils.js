const currencyFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const kmFormatter = new Intl.NumberFormat('pt-BR');

export const MAINTENANCE_CATEGORIES = [
  { value: 'oleo', label: 'Troca de óleo', icon: 'droplet' },
  { value: 'revisao', label: 'Revisão geral', icon: 'settings' },
  { value: 'pneus', label: 'Pneus', icon: 'tire' },
  { value: 'freios', label: 'Freios', icon: 'disc' },
  { value: 'outros', label: 'Outros', icon: 'tool' },
];

export const PAYMENT_CATEGORIES = [
  { value: 'financiamento', label: 'Financiamento', icon: 'wallet' },
  { value: 'ipva', label: 'IPVA', icon: 'file' },
  { value: 'seguro', label: 'Seguro', icon: 'shield' },
  { value: 'outros', label: 'Outros', icon: 'wallet' },
];

export function formatCurrency(value) {
  return currencyFormatter.format(Number(value) || 0);
}

export function formatKm(value) {
  return `${kmFormatter.format(Math.round(Number(value) || 0))} km`;
}

export function formatDate(date) {
  if (!date) return '';
  return new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function categoryLabel(categories, value) {
  return categories.find((c) => c.value === value)?.label || value;
}

export function categoryIcon(categories, value) {
  return categories.find((c) => c.value === value)?.icon || 'tool';
}

function daysUntil(date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  return Math.round((target - today) / 86400000);
}

// Combina prazo por km e por data (o que vencer primeiro manda no rótulo).
// "urgent" cobre tanto vencido quanto perto de vencer (usado pro destaque
// laranja/vermelho da lista, igual à mockup de manutenção).
export function maintenanceUrgency(item, currentOdometer) {
  if (item.status === 'concluido') {
    return { label: 'Concluída', urgent: false, overdue: false };
  }

  const kmRemaining = item.dueOdometer != null ? item.dueOdometer - currentOdometer : null;
  const daysRemaining = item.dueDate != null ? daysUntil(item.dueDate) : null;

  const overdueKm = kmRemaining != null && kmRemaining <= 0;
  const overdueDate = daysRemaining != null && daysRemaining <= 0;
  const overdue = overdueKm || overdueDate;

  const nearKm = kmRemaining != null && kmRemaining > 0 && kmRemaining <= 500;
  const nearDate = daysRemaining != null && daysRemaining > 0 && daysRemaining <= 15;

  const parts = [];
  if (kmRemaining != null) {
    // Mostra o km absoluto de vencimento (não só a distância que falta) pra
    // ficar visível que o cálculo já partiu do odômetro atual do veículo.
    const target = formatKm(item.dueOdometer);
    parts.push(
      overdueKm
        ? `Venceu aos ${target} (${formatKm(Math.abs(kmRemaining))} atrasada)`
        : `Vence aos ${target} (faltam ${formatKm(kmRemaining)})`
    );
  }
  if (daysRemaining != null) {
    const days = Math.abs(daysRemaining);
    parts.push(overdueDate ? `Atrasada há ${days} dia${days === 1 ? '' : 's'}` : `${daysRemaining} dia${daysRemaining === 1 ? '' : 's'}`);
  }

  return {
    label: parts.length ? parts.join(' ou ') : 'Sem prazo definido',
    overdue,
    urgent: overdue || nearKm || nearDate,
  };
}

// % de manutenções pendentes que ainda estão dentro do prazo — usado no anel
// de "saúde" do dashboard. Sem pendências = 100%.
export function vehicleHealthPercent(maintenances, currentOdometer) {
  const pending = maintenances.filter((m) => m.status === 'pendente');
  if (!pending.length) return 100;
  const healthy = pending.filter((m) => !maintenanceUrgency(m, currentOdometer).overdue).length;
  return Math.round((healthy / pending.length) * 100);
}

export function recurrenceLabel(item) {
  if (item.recurrenceDays == null && item.recurrenceKm == null) return null;
  const parts = [];
  if (item.recurrenceKm != null) parts.push(formatKm(item.recurrenceKm));
  if (item.recurrenceDays != null) parts.push(`${item.recurrenceDays} dia${item.recurrenceDays === 1 ? '' : 's'}`);
  return `Repete a cada ${parts.join(' ou ')}`;
}

export function paymentDueInfo(payment) {
  if (payment.status === 'pago') return { label: 'Pago', urgent: false };
  const diffDays = daysUntil(payment.dueDate);

  if (diffDays < 0) {
    const days = Math.abs(diffDays);
    return { label: `Atrasado há ${days} dia${days > 1 ? 's' : ''}`, urgent: true };
  }
  if (diffDays === 0) return { label: 'Vence hoje', urgent: true };
  if (diffDays === 1) return { label: 'Vence amanhã', urgent: false };
  return { label: `Vence em ${diffDays} dias`, urgent: false };
}
