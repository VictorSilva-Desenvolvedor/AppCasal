import { useState } from 'react';
import { Card, Icon } from '../../components/ui/index.js';
import { EMOTIONS } from '../../constants/emotions.js';
import { PERIODS, PERIOD_ICONS, PERIOD_LABELS, groupEntriesByPeriod, mostIntenseEntry, predominantEmotion } from './emocoesUtils.js';
import { EmotionSummaryEntryRow } from './EmotionSummaryEntryRow.jsx';

export function EmotionDaySummary({ entries, canDelete = false, onRequestDelete, onOpenDetail }) {
  // Qual row está com o swipe revelado — sobe pra cá (em vez de ficar local
  // em cada row) pra poder fechar automaticamente qualquer outra já aberta.
  const [openRowId, setOpenRowId] = useState(null);

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
    <div className="emotion-summary">
      <h2 className="emotion-summary-title">Seu dia emocional</h2>

      <div className="emotion-summary-periods">
        {PERIODS.map((period) => (
          <Card key={period} className="emotion-summary-period-card">
            <Icon name={PERIOD_ICONS[period]} className="emotion-summary-period-icon" />
            <div className="emotion-summary-period-body">
              <span className="emotion-summary-period-label">{PERIOD_LABELS[period]}</span>
              {byPeriod[period].length ? (
                byPeriod[period].map((entry) => (
                  <EmotionSummaryEntryRow
                    key={entry._id}
                    entry={entry}
                    canDelete={canDelete}
                    isOpen={openRowId === entry._id}
                    onOpenChange={setOpenRowId}
                    onRequestDelete={onRequestDelete}
                    onOpenDetail={onOpenDetail}
                  />
                ))
              ) : (
                <span className="emotion-summary-period-empty">Sem registro</span>
              )}
            </div>
          </Card>
        ))}
      </div>

      <div className="emotion-summary-highlights">
        <Card
          className="emotion-summary-highlight-card"
          style={{ '--highlight-color': EMOTIONS[mostIntense.emotion]?.color }}
        >
          <span className="emotion-summary-highlight-label">Emoção mais intensa</span>
          <span className="emotion-summary-highlight-value">
            <span aria-hidden="true">{EMOTIONS[mostIntense.emotion]?.emoji}</span> {EMOTIONS[mostIntense.emotion]?.label}
          </span>
        </Card>
        <Card className="emotion-summary-highlight-card emotion-summary-highlight-card--brand">
          <span className="emotion-summary-highlight-label">Emoção predominante</span>
          <span className="emotion-summary-highlight-value">
            <span aria-hidden="true">{EMOTIONS[predominant]?.emoji}</span> {EMOTIONS[predominant]?.label}
          </span>
        </Card>
      </div>
    </div>
  );
}
