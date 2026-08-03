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

// Agrupa por tipo, joga os concluídos para o fim de cada grupo e respeita a
// ordem manual do arraste. Ordenar por `order` aqui (e não só confiar na ordem
// que o backend mandou) é o que faz o update otimista reposicionar o item na
// hora, sem esperar o próximo GET. O sort é estável, então itens que nunca
// foram arrastados — todos com order 0 — mantêm a ordem de createdAt em que
// chegaram.
export function groupByKind(items) {
  const groups = { diaria: [], semanal: [], mensal: [], unica: [] };
  items.forEach((item) => {
    if (groups[item.kind]) groups[item.kind].push(item);
  });
  Object.values(groups).forEach((group) => {
    group.sort(
      (a, b) => Number(!!a.completed) - Number(!!b.completed) || (a.order ?? 0) - (b.order ?? 0)
    );
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

// belongsTo/createdBy chegam populados do backend, mas nem sempre — depois de
// um update otimista o objeto local pode carregar só o id.
function idOf(ref) {
  return ref?._id ?? ref;
}

// Uma "seção" é o que aparece junto na tela e compartilha a numeração de
// `order` no backend: mesma pessoa + mesmo tipo + (nas diárias) mesmo período.
// Devolve os itens já na ordem em que a tela mostra — é essa ordem que vira
// `order`, pra o que foi gravado bater com o que se vê.
export function sectionItemsInDisplayOrder(items, { belongsTo, kind, period }) {
  const owned = items.filter((item) => idOf(item.belongsTo) === belongsTo);
  const group = groupByKind(owned)[kind] ?? [];
  if (kind !== 'diaria') return group;
  return groupByPeriod(group)[period ?? DEFAULT_PERIOD] ?? [];
}

export function sectionIdsInDisplayOrder(items, section) {
  return sectionItemsInDisplayOrder(items, section).map((item) => item._id);
}

// Cérebro do arraste: devolve a lista completa com `period` e `order` já
// aplicados. Serve tanto pro update otimista quanto pro payload do PUT, então
// tela e banco não podem divergir.
export function moveTaskItem(items, { itemId, toKind, toPeriod, toIndex }) {
  const moving = items.find((item) => item._id === itemId);
  if (!moving) return items;

  const kind = toKind ?? moving.kind;
  const period = kind === 'diaria' ? (toPeriod ?? DEFAULT_PERIOD) : DEFAULT_PERIOD;
  const belongsTo = idOf(moving.belongsTo);
  const moved = { ...moving, kind, period };

  const target = sectionItemsInDisplayOrder(items, { belongsTo, kind, period }).filter(
    (item) => item._id !== itemId
  );

  const index = Math.max(0, Math.min(toIndex ?? target.length, target.length));
  target.splice(index, 0, moved);

  // Reaplica a regra da tela: concluída sempre no fim da seção. Sem isso,
  // soltar uma concluída no meio das pendentes gravaria uma ordem que a tela
  // desfaria na renderização seguinte.
  target.sort((a, b) => Number(!!a.completed) - Number(!!b.completed));

  const orderById = new Map(target.map((item, position) => [item._id, position]));
  return items.map((item) => {
    if (item._id === itemId) return { ...moved, order: orderById.get(itemId) };
    const position = orderById.get(item._id);
    return position === undefined ? item : { ...item, order: position };
  });
}

// Espelha canManage() do taskItemController: o dono da lista manda sempre,
// quem só adicionou mexe enquanto o item não foi concluído. Serve pra decidir
// se a linha mostra os botões de editar/excluir — o backend valida de novo.
export function canManageItem(item, userId) {
  if (!item || !userId) return false;
  if (idOf(item.belongsTo) === userId) return true;
  return idOf(item.createdBy) === userId && !item.completed;
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
