export function Icon({ name, className = '', ...props }) {
  return (
    <svg className={`icon ${className}`.trim()} aria-hidden="true" {...props}>
      <use href={`/icons.svg#icon-${name}`} />
    </svg>
  );
}
