import { Icon } from '../../components/ui/index.js';
import { REASONS } from '../../constants/emotionReasons.js';

// Chips de motivo de um registro — usados tanto na linha do resumo do dia
// quanto no card de detalhe, pra os dois lugares não divergirem.
export function EmotionReasonTags({ entry, className = '' }) {
  const tags = (entry.reasons || []).map((key) => [key, REASONS[key]]).filter(([, reason]) => reason);
  if (!tags.length) return null;

  return (
    <div className={`emotion-summary-entry-reasons ${className}`.trim()}>
      {tags.map(([key, reason]) => (
        <span key={key} className="emotion-summary-entry-reason-tag">
          <Icon name={reason.icon} />
          {key === 'outro' && entry.reasonOther ? entry.reasonOther : reason.label}
        </span>
      ))}
    </div>
  );
}
