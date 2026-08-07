// Checklists padrão de manutenção por modelo de veículo, usados pelo endpoint
// POST /api/vehicle-maintenances/apply-preset. Os intervalos são baseados no
// padrão geral de manutenção de motos de rua Honda 250cc no Brasil — não uma
// cópia literal do manual do proprietário. O usuário pode editar/remover
// qualquer item depois de aplicado.
module.exports = {
  'honda-cb-twister-250f-2019': {
    label: 'Honda CB Twister 250F (2019)',
    photoUrl: '/vehicle-photos/honda-cb-twister-2019.webp',
    items: [
      {
        title: 'Troca de óleo do motor',
        category: 'oleo',
        recurrenceKm: 3000,
        notes: 'Óleo 10W30 semissintético — confirmar especificação no manual do proprietário.',
      },
      {
        title: 'Troca do filtro de óleo',
        category: 'oleo',
        recurrenceKm: 6000,
        notes: 'Trocar a cada 2ª troca de óleo.',
      },
      { title: 'Calibrar pneus', category: 'pneus', recurrenceDays: 7, recurrenceKm: 500 },
      { title: 'Verificar pastilhas de freio', category: 'freios', recurrenceKm: 4000 },
      { title: 'Verificar fluido de freio', category: 'freios', recurrenceDays: 365, recurrenceKm: 10000 },
      { title: 'Limpar e lubrificar a corrente', category: 'outros', recurrenceKm: 500 },
      { title: 'Ajustar tensão da corrente', category: 'outros', recurrenceKm: 1000 },
      { title: 'Trocar vela de ignição', category: 'outros', recurrenceKm: 6000 },
      { title: 'Limpar filtro de ar', category: 'outros', recurrenceKm: 4000 },
      { title: 'Trocar filtro de ar', category: 'outros', recurrenceKm: 12000 },
      { title: 'Revisão geral', category: 'revisao', recurrenceKm: 6000 },
    ],
  },
};
