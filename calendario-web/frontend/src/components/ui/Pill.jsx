export function Pill({ className = '', children, ...props }) {
  return (
    <span className={`pill ${className}`.trim()} {...props}>
      {children}
    </span>
  );
}
