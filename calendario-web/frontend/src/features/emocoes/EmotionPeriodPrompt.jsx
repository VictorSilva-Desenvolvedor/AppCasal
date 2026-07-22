import { Card, Icon } from '../../components/ui/index.js';
import { EMOTIONS } from '../../constants/emotions.js';
import { PERIODS, PERIOD_LABELS, PERIOD_QUESTIONS, isPeriodLoggable } from './emocoesUtils.js';

export function EmotionPeriodPrompt({ periodsData, onAddClick }) {
  return (
    <div className="emotion-period-grid">
      {PERIODS.map((period) => {
        const loggable = isPeriodLoggable(period);
        const periodEntries = periodsData[period];

        return (
          <Card key={period} className="emotion-period-card">
            <div className="emotion-period-card-header">
              <h3>{PERIOD_LABELS[period]}</h3>
              <button
                type="button"
                className="icon-btn emotion-period-add-btn"
                title={loggable ? 'Registrar emoção' : 'Este período ainda não chegou'}
                aria-label="Registrar emoção"
                disabled={!loggable}
                onClick={() => onAddClick(period)}
              >
                <Icon name="plus" />
              </button>
            </div>

            <p className="emotion-period-question">{PERIOD_QUESTIONS[period]}</p>

            {periodEntries.length > 0 ? (
              <div className="emotion-period-chip-list">
                {periodEntries.map((entry) => {
                  const meta = EMOTIONS[entry.emotion];
                  return (
                    <span key={entry._id} className="emotion-chip" style={{ '--chip-color': meta?.color }}>
                      <span aria-hidden="true">{meta?.emoji}</span> {meta?.label}
                    </span>
                  );
                })}
              </div>
            ) : (
              <p className="emotion-period-empty">{loggable ? 'Nenhum registro ainda' : 'Ainda não chegou'}</p>
            )}
          </Card>
        );
      })}
    </div>
  );
}
