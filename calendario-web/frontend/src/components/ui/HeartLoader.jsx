const HEART_PATH =
  'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.8z';

export function HeartLoader({ label = 'Carregando...', className = '' }) {
  return (
    <div className={`heart-loader ${className}`.trim()}>
      <svg className="heart-loader-svg" viewBox="0 0 24 24" aria-hidden="true">
        <path className="heart-loader-fill" d={HEART_PATH} />
        <path className="heart-loader-outline" pathLength="1" d={HEART_PATH} />
      </svg>
      {label && <span className="heart-loader-label">{label}</span>}
    </div>
  );
}
