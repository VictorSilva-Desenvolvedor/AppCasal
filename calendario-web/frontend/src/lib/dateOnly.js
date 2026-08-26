// Datas "de dia inteiro" (data do evento, vencimento de conta) são gravadas no
// banco como um instante — em geral AAAA-MM-DDT00:00:00.000Z. Lidas com os
// getters LOCAIS em UTC-3, meia-noite UTC vira 21h do dia anterior e a interface
// inteira mostra um dia a menos. Os dígitos da data em si estão corretos: basta
// ler os componentes em UTC e remontar a data no fuso local, ancorada ao meio-dia
// (longe das bordas de horário de verão).
//
// Regra prática: valor que veio da API -> parseDateOnly/dateOnlyKey/formatDateOnly.
// Data construída aqui no navegador (new Date(), new Date(ano, mes, dia)) ->
// localDateKey. Instantes de verdade (createdAt, paidAt, updatedAt) não passam
// por aqui: neles a hora importa e a leitura local é a correta.

export function parseDateOnly(value) {
  if (!value) return null;
  const raw = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(raw.getTime())) return null;
  return new Date(raw.getUTCFullYear(), raw.getUTCMonth(), raw.getUTCDate(), 12, 0, 0);
}

export function localDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function dateOnlyKey(value) {
  const date = parseDateOnly(value);
  return date ? localDateKey(date) : '';
}

const DEFAULT_FORMAT = { day: '2-digit', month: '2-digit', year: 'numeric' };

export function formatDateOnly(value, options = DEFAULT_FORMAT) {
  const date = parseDateOnly(value);
  return date ? date.toLocaleDateString('pt-BR', options) : '';
}

export function compareDateOnly(a, b) {
  const first = parseDateOnly(a);
  const second = parseDateOnly(b);
  return (first ? first.getTime() : 0) - (second ? second.getTime() : 0);
}
