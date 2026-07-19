export function Field({ label, htmlFor, error, children }) {
  return (
    <div className="field">
      {label && <label htmlFor={htmlFor}>{label}</label>}
      {children}
      {error !== undefined && <p className="error-text">{error || ''}</p>}
    </div>
  );
}
