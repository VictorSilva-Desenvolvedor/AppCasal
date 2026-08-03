const INTENSITY_SEGMENTS = [1, 2, 3, 4, 5];

// Sem `onChange` é só um indicador (uso na linha do resumo). Com `onChange` os
// segmentos viram botões reais — é o único jeito de corrigir a intensidade de
// um registro já salvo, e de quebra funciona por teclado.
export function EmotionIntensityBar({ intensity, color, onChange, disabled = false }) {
  if (!onChange) {
    return (
      <div className="emotion-intensity-bar">
        {INTENSITY_SEGMENTS.map((segment) => (
          <span
            key={segment}
            className="emotion-intensity-bar-segment"
            style={segment <= intensity ? { background: color } : undefined}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="emotion-intensity-bar is-editable" role="group" aria-label="Intensidade da emoção">
      {INTENSITY_SEGMENTS.map((segment) => (
        <button
          key={segment}
          type="button"
          className="emotion-intensity-bar-segment"
          aria-label={`Definir intensidade ${segment} de 5`}
          aria-pressed={segment === intensity}
          disabled={disabled}
          style={segment <= intensity ? { background: color } : undefined}
          onClick={() => onChange(segment)}
        />
      ))}
    </div>
  );
}
