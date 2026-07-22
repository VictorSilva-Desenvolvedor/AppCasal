import { Card } from '../../components/ui/index.js';
import { EMOTIONS } from '../../constants/emotions.js';
import { formatDayLabel, predominantEmotion, toDayKey } from './emocoesUtils.js';

export function EmotionHistoryList({ days }) {
  if (!days.length) {
    return <p className="emotion-summary-empty">Nenhum registro no histórico ainda.</p>;
  }

  const todayKey = toDayKey(new Date());

  return (
    <div className="emotion-history-list">
      {days.map(({ day, entries }) => {
        const predominant = predominantEmotion(entries);
        return (
          <Card key={day} className="emotion-history-card">
            <div className="emotion-history-card-header">
              <strong>{day === todayKey ? 'Hoje' : formatDayLabel(day)}</strong>
              <span className="emotion-history-card-predominant">
                <span aria-hidden="true">{EMOTIONS[predominant]?.emoji}</span> {EMOTIONS[predominant]?.label}
              </span>
            </div>
            <div className="emotion-history-jar">
              {entries.map((entry) => (
                <span
                  key={entry._id}
                  className="emotion-history-dot"
                  title={`${EMOTIONS[entry.emotion]?.label} (${entry.intensity}/5)`}
                  style={{
                    background: EMOTIONS[entry.emotion]?.color,
                    width: 10 + entry.intensity * 2,
                    height: 10 + entry.intensity * 2,
                  }}
                />
              ))}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
