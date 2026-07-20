const CALENDAR_SECTION_PREFIXES = [
  '/app/calendario',
  '/app/atividades',
  '/app/atualizacoes',
  '/app/convites',
  '/app/configuracoes',
];

export function getAppSection(pathname) {
  if (pathname.startsWith('/app/financeiro')) return 'financeiro';
  if (pathname.startsWith('/app/galeria')) return 'galeria';
  if (CALENDAR_SECTION_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return 'calendario';
  return 'calendario';
}
