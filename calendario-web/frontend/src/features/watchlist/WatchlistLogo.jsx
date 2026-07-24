// Emblema da feature: três círculos sobrepostos (terracota/petróleo/rosa — os
// 3 tipos de conteúdo) com um coração vinho na interseção, remetendo a
// "gostos diferentes, uma watchlist só". Puramente decorativo.
export function WatchlistLogo({ size = 40 }) {
  return (
    <svg className="watchlist-logo" width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
      <circle cx="14" cy="16" r="10" fill="#D97757" opacity="0.85" />
      <circle cx="26" cy="16" r="10" fill="#3B6E8F" opacity="0.85" />
      <circle cx="20" cy="25" r="10" fill="#C97B9A" opacity="0.85" />
      <path
        d="M20 24.5c-2.4-1.6-4-3-4-4.9a2.3 2.3 0 0 1 4-1.4 2.3 2.3 0 0 1 4 1.4c0 1.9-1.6 3.3-4 4.9Z"
        style={{ fill: 'var(--watch-vinho)' }}
      />
    </svg>
  );
}
