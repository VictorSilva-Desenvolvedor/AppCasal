export function IconButton({ className = '', children, ...props }) {
  return (
    <button type="button" className={`icon-btn ${className}`.trim()} {...props}>
      {children}
    </button>
  );
}
