const CALENDAR_SECTION_PREFIXES = [
  '/app/calendario',
  '/app/atividades',
  '/app/convites',
  '/app/configuracoes',
];

export function getAppSection(pathname) {
  if (pathname.startsWith('/app/financeiro')) return 'financeiro';
  if (pathname.startsWith('/app/emocoes')) return 'emocoes';
  if (pathname.startsWith('/app/habitos')) return 'habitos';
  if (pathname.startsWith('/app/watchlist')) return 'watchlist';
  if (pathname.startsWith('/app/doces')) return 'doces';
  if (pathname.startsWith('/app/tarefas')) return 'tarefas';
  if (pathname.startsWith('/app/resumo')) return 'resumo';
  if (pathname.startsWith('/app/veiculos')) return 'veiculos';
  if (pathname.startsWith('/app/galeria')) return 'galeria';
  if (pathname.startsWith('/app/atualizacoes')) return 'atualizacoes';
  if (CALENDAR_SECTION_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return 'calendario';
  return 'calendario';
}
