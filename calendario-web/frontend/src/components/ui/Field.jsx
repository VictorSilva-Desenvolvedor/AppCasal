import { InfoTooltip } from './InfoTooltip.jsx';

export function Field({ label, htmlFor, error, hint, required = false, children }) {
  return (
    <div className="field">
      {label && (
        <label htmlFor={htmlFor}>
          {label}
          {/* Asterisco via CSS (::before) para não entrar no texto do rótulo; o campo
              leva aria-required, então o leitor de tela já anuncia. */}
          {required && <span className="field-required" aria-hidden="true" />}
          {hint && <InfoTooltip text={hint} />}
        </label>
      )}
      {children}
      {error !== undefined && <p className="error-text">{error || ''}</p>}
    </div>
  );
}
