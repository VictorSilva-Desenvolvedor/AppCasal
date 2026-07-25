import { Spinner } from './Spinner.jsx';

export function IconButton({ className = '', loading = false, disabled, children, ...props }) {
  const classes = ['icon-btn', loading && 'is-loading', className].filter(Boolean).join(' ');

  return (
    <button type="button" className={classes} disabled={disabled || loading} {...props}>
      {loading ? <Spinner /> : children}
    </button>
  );
}
