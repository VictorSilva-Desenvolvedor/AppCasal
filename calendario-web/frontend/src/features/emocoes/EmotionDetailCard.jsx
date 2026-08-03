import { useState } from 'react';
import { Icon } from '../../components/ui/index.js';
import { useAuth } from '../../hooks/useAuth.js';
import { useCalendarData } from '../../hooks/useCalendarData.js';
import { useToast } from '../../hooks/useToast.js';
import { api } from '../../services/api.js';
import { EMOTIONS } from '../../constants/emotions.js';
import { personColorFor } from '../calendar/calendarUtils.js';
import { EmotionIntensityBar } from './EmotionIntensityBar.jsx';
import { EmotionChatBubble } from './EmotionChatBubble.jsx';
import { EmotionReasonTags } from './EmotionReasonTags.jsx';
import { PERIOD_LABELS, formatDayLabel, formatEntryTime, toDayKey } from './emocoesUtils.js';

export function EmotionDetailCard({ entry, onEntryUpdated }) {
  const { user } = useAuth();
  const { users } = useCalendarData();
  const { showToast } = useToast();
  const [savingIntensity, setSavingIntensity] = useState(false);

  const meta = EMOTIONS[entry.emotion];
  const isOwner = entry.user?._id === user?._id;
  const ownerColor = personColorFor(users, entry.user?._id);
  const helpAuthor = entry.helpTextBy ? users.find((u) => u._id === entry.helpTextBy) : null;
  const helpColor = helpAuthor ? personColorFor(users, helpAuthor._id) : 'var(--emo-brand)';
  const todayKey = toDayKey(new Date());

  async function handleSaveNote(value) {
    try {
      const updated = await api.updateEmotionEntry(entry._id, { note: value });
      onEntryUpdated(updated);
    } catch (err) {
      showToast(err.message, 'error');
      throw err;
    }
  }

  // Só o dono pode corrigir a intensidade — o backend já recusa (403), mas
  // deixar o controle inerte pro parceiro evita um erro previsível.
  async function handleChangeIntensity(value) {
    if (value === entry.intensity) return;
    setSavingIntensity(true);
    try {
      onEntryUpdated(await api.updateEmotionEntry(entry._id, { intensity: value }));
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSavingIntensity(false);
    }
  }

  async function handleSaveHelp(value) {
    try {
      const updated = await api.updateEmotionEntry(entry._id, { helpText: value });
      onEntryUpdated(updated);
    } catch (err) {
      showToast(err.message, 'error');
      throw err;
    }
  }

  return (
    <div className="emotion-detail-card">
      <div className="emotion-detail-header">
        <span className="emotion-detail-emoji" aria-hidden="true">
          {meta?.emoji}
        </span>
        <div>
          <p className="emotion-detail-emotion">{meta?.label}</p>
          <p className="emotion-detail-meta">
            {PERIOD_LABELS[entry.period]} · {entry.day === todayKey ? 'Hoje' : formatDayLabel(entry.day)}
          </p>
        </div>
      </div>

      <EmotionIntensityBar
        intensity={entry.intensity}
        color={meta?.color}
        onChange={isOwner ? handleChangeIntensity : undefined}
        disabled={savingIntensity}
      />

      <EmotionReasonTags entry={entry} className="emotion-detail-reasons" />

      <div className="emotion-detail-section">
        <p className="emotion-detail-section-label">
          <Icon name="file" /> Por que me sinto assim
        </p>
        <EmotionChatBubble
          align="left"
          authorName={entry.user?.name || 'Você'}
          authorColor={ownerColor}
          timestamp={formatEntryTime(entry.createdAt)}
          text={entry.note}
          emptyStateText="Ainda não há um motivo registrado — toca aqui pra escrever"
          editable={isOwner}
          onSave={handleSaveNote}
        />
      </div>

      <div className="emotion-detail-section">
        <p className="emotion-detail-section-label">
          <Icon name="heart" /> O que pode ajudar
        </p>
        <EmotionChatBubble
          align="right"
          authorName={entry.helpText ? helpAuthor?.name || 'Alguém' : user?.name || 'Você'}
          authorColor={helpColor}
          timestamp={entry.helpTextAt ? formatEntryTime(entry.helpTextAt) : null}
          text={entry.helpText}
          emptyStateText="Ainda não há nada escrito aqui — toca aqui pra escrever"
          editable
          onSave={handleSaveHelp}
        />
      </div>
    </div>
  );
}
