import { Card } from '../../components/ui/index.js';
import { EMOTIONS } from '../../constants/emotions.js';
import { PERIODS, PERIOD_LABELS, groupEntriesByPeriod, mostIntenseEntry, predominantEmotion } from './emocoesUtils.js';

export function EmotionDaySummary({ entries }) {
  if (!entries.length) {
    return (
      <Card className="emotion-summary-card">
        <p className="emotion-summary-empty">Nenhum registro hoje ainda.</p>
      </Card>
    );
  }

  const predominant = predominantEmotion(entries);
  const mostIntense = mostIntenseEntry(entries);
  const byPeriod = groupEntriesByPeriod(entries);

  return (
    <Card className="emotion-summary-card">
      <h3>Resumo do dia</h3>

      <div className="emotion-summary-row">
        <span className="emotion-summary-label">Emoção predominante</span>
        <span className="emotion-summary-value">
          <span aria-hidden="true">{EMOTIONS[predominant]?.emoji}</span> {EMOTIONS[predominant]?.label}
        </span>
      </div>

      {mostIntense && (
        <div className="emotion-summary-row">
          <span className="emotion-summary-label">Emoção mais intensa</span>
          <span className="emotion-summary-value">
            <span aria-hidden="true">{EMOTIONS[mostIntense.emotion]?.emoji}</span> {EMOTIONS[mostIntense.emotion]?.label} (
            {mostIntense.intensity}/5)
          </span>
        </div>
      )}

      <div className="emotion-summary-periods">
        {PERIODS.map((period) => (
          <div key={period} className="emotion-summary-period">
            <span className="emotion-summary-period-label">{PERIOD_LABELS[period]}</span>
            <div className="emotion-period-chip-list">
              {byPeriod[period].length ? (
                byPeriod[period].map((entry) => (
                  <span key={entry._id} className="emotion-chip" style={{ '--chip-color': EMOTIONS[entry.emotion]?.color }}>
                    <span aria-hidden="true">{EMOTIONS[entry.emotion]?.emoji}</span> {EMOTIONS[entry.emotion]?.label}
                  </span>
                ))
              ) : (
                <span className="emotion-summary-period-empty">—</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
