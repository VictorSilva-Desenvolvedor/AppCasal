export const KIND_LABELS = {
  diaria: 'Diária',
  semanal: 'Semanal',
  mensal: 'Mensal',
  unica: 'Única',
};

export const KIND_ORDER = ['diaria', 'semanal', 'mensal', 'unica'];

// Sub-listas das diárias, na ordem em que o dia acontece. 'dia-todo' fecha a
// lista por ser o balde do que não tem hora marcada.
export const PERIOD_LABELS = {
  manha: 'Manhã',
  tarde: 'Tarde',
  noite: 'Noite',
  'dia-todo': 'O dia todo',
};

export const PERIOD_ORDER = ['manha', 'tarde', 'noite', 'dia-todo'];

export const DEFAULT_PERIOD = 'dia-todo';

// Agrupa por tipo e joga os concluídos para o fim de cada grupo. O sort é
// estável, então dentro de cada metade a ordem original (createdAt asc, vinda
// do backend) é preservada — o que sobra pra fazer fica sempre no topo.
export function groupByKind(items) {
  const groups = { diaria: [], semanal: [], mensal: [], unica: [] };
  items.forEach((item) => {
    if (groups[item.kind]) groups[item.kind].push(item);
  });
  Object.values(groups).forEach((group) => {
    group.sort((a, b) => Number(!!a.completed) - Number(!!b.completed));
  });
  return groups;
}

// Divide as diárias nas sub-listas do dia. Itens criados antes do campo
// `period` existir chegam sem ele — caem em 'dia-todo', que é onde estavam
// implicitamente antes. A ordem dentro de cada período vem pronta do
// groupByKind (pendentes primeiro, createdAt asc dentro de cada metade).
export function groupByPeriod(items) {
  const groups = { manha: [], tarde: [], noite: [], 'dia-todo': [] };
  items.forEach((item) => {
    const period = groups[item.period] ? item.period : DEFAULT_PERIOD;
    groups[period].push(item);
  });
  return groups;
}

// Espelha canManage() do taskItemController: o dono da lista manda sempre,
// quem só adicionou mexe enquanto o item não foi concluído. Serve pra decidir
// se a linha mostra os botões de editar/excluir — o backend valida de novo.
export function canManageItem(item, userId) {
  if (!item || !userId) return false;
  const ownerId = item.belongsTo?._id ?? item.belongsTo;
  const creatorId = item.createdBy?._id ?? item.createdBy;
  if (ownerId === userId) return true;
  return creatorId === userId && !item.completed;
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
