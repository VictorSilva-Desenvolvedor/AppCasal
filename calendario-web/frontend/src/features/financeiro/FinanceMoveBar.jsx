import { Icon } from '../../components/ui/index.js';

const NATURE_TARGETS = [
  { value: 'fixa', label: 'Fixa' },
  { value: 'a_decidir', label: 'A decidir' },
  { value: 'com_prazo', label: 'Com prazo' },
  { value: 'unica', label: 'Única' },
];

const WISH_TARGETS = [
  { value: 'none', label: 'Conta do mês' },
  { value: 'necessidade', label: 'Necessidade futura' },
  { value: 'desejo', label: 'Desejo futuro' },
];

function TargetGroup({ title, targets, dnd }) {
  if (targets.length === 0) return null;
  return (
    <div className="finance-move-bar-group">
      <span className="finance-move-bar-title">{title}</span>
      <div className="finance-move-bar-chips">
        {targets.map((target) => (
          <span
            key={target.key}
            className={`finance-move-bar-chip${dnd.isDropTarget(target.key) ? ' drag-over' : ''}${
              target.current ? ' is-current' : ''
            }`}
            {...dnd.dropProps(target.key)}
          >
            {target.label}
          </span>
        ))}
      </div>
    </div>
  );
}

/**
 * Só aparece enquanto um lançamento está sendo arrastado: reúne os destinos que
 * não têm uma seção visível na tela atual (categorias vazias, planejamento
 * futuro em outra aba), completando o arraste entre as seções já renderizadas.
 */
export function FinanceMoveBar({ entry, categories, dnd }) {
  if (!entry) return null;

  const isDespesa = entry.type === 'despesa';
  const categoryTargets = categories
    .filter((category) => category.type === entry.type)
    .map((category) => ({
      key: `category:${category._id}`,
      label: category.name,
      current: entry.category?._id === category._id,
    }));
  categoryTargets.push({
    key: 'category:sem-categoria',
    label: 'Sem categoria',
    current: !entry.category,
  });

  return (
    <div className="finance-move-bar">
      <div className="finance-move-bar-head">
        <Icon name="habit-swap" />
        Solte em um destino para mover &quot;{entry.description}&quot;
      </div>

      {isDespesa && (
        <TargetGroup
          title="Natureza"
          dnd={dnd}
          targets={NATURE_TARGETS.map((target) => ({
            key: `nature:${target.value}`,
            label: target.label,
            current: !entry.wishType && (entry.nature || 'unica') === target.value,
          }))}
        />
      )}

      <TargetGroup title="Categoria" targets={categoryTargets} dnd={dnd} />

      {isDespesa && (
        <TargetGroup
          title="Planejamento"
          dnd={dnd}
          targets={WISH_TARGETS.map((target) => ({
            key: `wish:${target.value}`,
            label: target.label,
            current: (entry.wishType || 'none') === target.value,
          }))}
        />
      )}
    </div>
  );
}
