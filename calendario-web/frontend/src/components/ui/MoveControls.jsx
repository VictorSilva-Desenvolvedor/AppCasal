import { Icon } from './Icon.jsx';
import { IconButton } from './IconButton.jsx';

// Alternativa ao arrastar-e-soltar dos quadros kanban: o drag nativo do HTML5 não
// funciona em toque (Android) nem por teclado, então cada card também move por botão.
export function MoveControls({ prevLabel, nextLabel, onMovePrev, onMoveNext, disabled = false, className = '' }) {
  if (!prevLabel && !nextLabel) return null;

  return (
    <div className={['move-controls', className].filter(Boolean).join(' ')} role="group" aria-label="Mover de coluna">
      {prevLabel && (
        <IconButton
          className="move-controls-btn"
          aria-label={`Mover para ${prevLabel}`}
          title={`Mover para ${prevLabel}`}
          disabled={disabled}
          onClick={onMovePrev}
        >
          <Icon name="chevron-left" />
        </IconButton>
      )}
      {nextLabel && (
        <IconButton
          className="move-controls-btn move-controls-btn--next"
          aria-label={`Mover para ${nextLabel}`}
          title={`Mover para ${nextLabel}`}
          disabled={disabled}
          onClick={onMoveNext}
        >
          <Icon name="chevron-right" />
        </IconButton>
      )}
    </div>
  );
}
