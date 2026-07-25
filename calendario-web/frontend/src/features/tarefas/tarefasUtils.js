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
