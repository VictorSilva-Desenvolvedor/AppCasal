export const KIND_LABELS = {
  diaria: 'Diária',
  semanal: 'Semanal',
  mensal: 'Mensal',
  unica: 'Única',
};

export const KIND_ORDER = ['diaria', 'semanal', 'mensal', 'unica'];

export function groupByKind(items) {
  const groups = { diaria: [], semanal: [], mensal: [], unica: [] };
  items.forEach((item) => {
    if (groups[item.kind]) groups[item.kind].push(item);
  });
  return groups;
}

export function countCompleted(items) {
  return { done: items.filter((item) => item.completed).length, total: items.length };
}

// Geometria do anel de progresso (SVG) — usado no cabeçalho para mostrar quanto
// das tarefas diárias da própria lista já foi concluído hoje.
export function ringGeometry(done, total, radius = 16) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;
  return { pct, circumference, offset };
}
