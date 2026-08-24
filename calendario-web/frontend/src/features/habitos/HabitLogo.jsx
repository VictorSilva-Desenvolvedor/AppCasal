// Emblema da feature Hábitos: dois círculos sobrepostos (as cores dos dois
// parceiros, vindas dos tokens do tema ativo) com um coração vazado na
// interseção, remetendo ao conceito "dois se tornam um ritmo". Só um símbolo
// decorativo desta página, não substitui o favicon nem o logo do AppCasal.
export function HabitLogo({ size = 40 }) {
  return (
    <svg
      className="habit-logo"
      width={size}
      height={size}
      viewBox="0 0 40 40"
      aria-hidden="true"
    >
      <circle cx="16" cy="20" r="13" style={{ fill: 'var(--habit-coral)' }} opacity="0.85" />
      <circle cx="24" cy="20" r="13" style={{ fill: 'var(--habit-purple)' }} opacity="0.85" />
      <path
        d="M20 24.5c-3-2-5-3.6-5-6a2.8 2.8 0 0 1 5-1.7A2.8 2.8 0 0 1 25 18.5c0 2.4-2 4-5 6Z"
        style={{ fill: 'var(--color-bg)' }}
      />
    </svg>
  );
}
