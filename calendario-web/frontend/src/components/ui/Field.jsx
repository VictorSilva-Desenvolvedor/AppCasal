import { InfoTooltip } from './InfoTooltip.jsx';

export function Field({ label, htmlFor, error, hint, children }) {
  return (
    <div className="field">
      {label && (
        <label htmlFor={htmlFor}>
          {label}
          {hint && <InfoTooltip text={hint} />}
        </label>
      )}
      {children}
      {error !== undefined && <p className="error-text">{error || ''}</p>}
    </div>
  );
}
