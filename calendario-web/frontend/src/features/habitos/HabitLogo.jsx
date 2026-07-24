// Emblema da feature Hábitos: dois círculos sobrepostos (coral e roxo — as
// cores dos dois parceiros) com um coração na interseção, remetendo ao
// conceito "dois se tornam um ritmo". Só um símbolo decorativo desta página,
// não substitui o favicon nem o logo do resto do AppCasal.
export function HabitLogo({ size = 40 }) {
  return (
    <svg
      className="habit-logo"
      width={size}
      height={size}
      viewBox="0 0 40 40"
      aria-hidden="true"
    >
      <circle cx="16" cy="20" r="13" fill="#FF6B6B" opacity="0.85" />
      <circle cx="24" cy="20" r="13" fill="#6C5B7B" opacity="0.85" />
      <path
        d="M20 24.5c-3-2-5-3.6-5-6a2.8 2.8 0 0 1 5-1.7A2.8 2.8 0 0 1 25 18.5c0 2.4-2 4-5 6Z"
        style={{ fill: 'var(--habit-bg)' }}
      />
    </svg>
  );
}
