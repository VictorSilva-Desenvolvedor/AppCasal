import { ringGeometry } from './tarefasUtils.js';

export function TarefaProgressRing({ done, total }) {
  const { pct, circumference, offset } = ringGeometry(done, total);

  return (
    <svg width="44" height="44" viewBox="0 0 40 40" className="tarefas-ring" aria-hidden="true">
      <circle cx="20" cy="20" r="16" fill="none" stroke="var(--color-border)" strokeWidth="4" />
      <circle
        cx="20"
        cy="20"
        r="16"
        fill="none"
        stroke="var(--tarefas-diaria)"
        strokeWidth="4"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 20 20)"
      />
      <text x="20" y="24" textAnchor="middle" fontSize="11" fill="var(--color-text)">
        {pct}%
      </text>
    </svg>
  );
}
