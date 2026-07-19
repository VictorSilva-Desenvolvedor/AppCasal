const VARIANT_CLASS = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  danger: 'btn-danger',
};

export function Button({
  variant = 'primary',
  block = false,
  loading = false,
  className = '',
  disabled,
  children,
  ...props
}) {
  const classes = [
    'btn',
    VARIANT_CLASS[variant],
    block && 'btn-block',
    loading && 'is-loading',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button className={classes} disabled={disabled || loading} {...props}>
      {children}
    </button>
  );
}
