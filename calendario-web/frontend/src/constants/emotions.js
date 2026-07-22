export const EMOTIONS = {
  feliz: { label: 'Feliz', emoji: '😊', color: '#FFC93C', category: 'positiva' },
  animado: { label: 'Animado', emoji: '🤩', color: '#FF9F45', category: 'positiva' },
  alegre: { label: 'Alegre', emoji: '😄', color: '#FFD866', category: 'positiva' },
  grato: { label: 'Grato', emoji: '🙏', color: '#4CAF7D', category: 'positiva' },
  motivado: { label: 'Motivado', emoji: '💪', color: '#FF7A45', category: 'positiva' },
  calmo: { label: 'Calmo', emoji: '😌', color: '#7FC7D9', category: 'positiva' },
  confiante: { label: 'Confiante', emoji: '😎', color: '#4A90D9', category: 'positiva' },
  esperancoso: { label: 'Esperançoso', emoji: '🌱', color: '#8FD9C4', category: 'positiva' },
  amado: { label: 'Amado', emoji: '🥰', color: '#F576A8', category: 'positiva' },
  orgulhoso: { label: 'Orgulhoso', emoji: '🦁', color: '#C79BF2', category: 'positiva' },

  pensativo: { label: 'Pensativo', emoji: '🤔', color: '#9C9DB8', category: 'neutra' },
  cansado: { label: 'Cansado', emoji: '😴', color: '#8A8794', category: 'neutra' },
  confuso: { label: 'Confuso', emoji: '😵', color: '#B7A8D9', category: 'neutra' },
  indiferente: { label: 'Indiferente', emoji: '😐', color: '#B0B0B0', category: 'neutra' },
  surpreso: { label: 'Surpreso', emoji: '😲', color: '#F2C744', category: 'neutra' },
  curioso: { label: 'Curioso', emoji: '🧐', color: '#7FB8D9', category: 'neutra' },
  nostalgico: { label: 'Nostálgico', emoji: '🌇', color: '#C9A98F', category: 'neutra' },

  triste: { label: 'Triste', emoji: '😢', color: '#3B6FA0', category: 'dificil' },
  ansioso: { label: 'Ansioso', emoji: '😰', color: '#8E5CC7', category: 'dificil' },
  estressado: { label: 'Estressado', emoji: '😖', color: '#D9534F', category: 'dificil' },
  irritado: { label: 'Irritado', emoji: '😠', color: '#E63946', category: 'dificil' },
  frustrado: { label: 'Frustrado', emoji: '😤', color: '#C7515C', category: 'dificil' },
  solitario: { label: 'Solitário', emoji: '🥺', color: '#4A5568', category: 'dificil' },
  preocupado: { label: 'Preocupado', emoji: '😟', color: '#7A6FA0', category: 'dificil' },
  desanimado: { label: 'Desanimado', emoji: '😞', color: '#6B7280', category: 'dificil' },
  sobrecarregado: { label: 'Sobrecarregado', emoji: '😩', color: '#5C4A72', category: 'dificil' },
};

export const EMOTION_CATEGORY_LABELS = {
  positiva: 'Positivas',
  neutra: 'Neutras',
  dificil: 'Difíceis',
};

export const EMOTION_CATEGORY_ORDER = ['positiva', 'neutra', 'dificil'];

// Cor de destaque por categoria (sublinhado das abas na seleção de emoção)
export const EMOTION_CATEGORY_ACCENT = {
  positiva: '#8FD9C4',
  neutra: '#9C9DB8',
  dificil: '#8E5CC7',
};
