// Lista única dos módulos do app: usada no grid do lobby e na navegação da
// barra lateral, para as duas nunca saírem de sincronia.
export const APP_MODULES = [
  { to: '/app/resumo', icon: 'sunrise', label: 'Resumo da Semana' },
  { to: '/app/calendario', icon: 'calendar', label: 'Calendário' },
  { to: '/app/financeiro', icon: 'wallet', label: 'Financeiro' },
  { to: '/app/emocoes', icon: 'smile', label: 'Emoções do Dia' },
  { to: '/app/habitos', icon: 'repeat', label: 'Hábitos' },
  { to: '/app/watchlist', icon: 'film', label: 'Watchlist a Dois' },
  { to: '/app/doces', icon: 'candy', label: 'Doces' },
  { to: '/app/tarefas', icon: 'check-circle', label: 'Tarefas' },
  { to: '/app/veiculos', icon: 'moto', label: 'Veículos' },
  { to: '/app/galeria', icon: 'image', label: 'Galeria' },
  { to: '/app/atividades', icon: 'clock', label: 'Atividades' },
  { to: '/app/convites', icon: 'user-plus', label: 'Convites' },
  { to: '/app/atualizacoes', icon: 'tool', label: 'Atualizações' },
  { to: '/app/configuracoes', icon: 'settings', label: 'Configurações' },
];
