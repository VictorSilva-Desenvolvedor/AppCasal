// Categorias com que todo time começa — usadas pelo seed e pelo cadastro (uma
// conta nova sem categoria nenhuma não conseguia lançar a primeira despesa).
const DEFAULT_FINANCE_CATEGORIES = [
  { name: 'Salário', type: 'receita', color: '#16a34a' },
  { name: 'Outros', type: 'receita', color: '#0891b2' },
  { name: 'Moradia', type: 'despesa', color: '#2563eb' },
  { name: 'Transporte', type: 'despesa', color: '#f97316' },
  { name: 'Assinaturas', type: 'despesa', color: '#9333ea' },
  { name: 'Alimentação', type: 'despesa', color: '#ca8a04' },
  { name: 'Saúde', type: 'despesa', color: '#16a34a' },
  { name: 'Financiamento', type: 'despesa', color: '#dc2626' },
  { name: 'Educação', type: 'despesa', color: '#0891b2' },
  { name: 'Pessoal', type: 'despesa', color: '#db2777' },
  { name: 'Outros', type: 'despesa', color: '#64748b' },
];

module.exports = { DEFAULT_FINANCE_CATEGORIES };
