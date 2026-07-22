import { useCallback, useEffect, useState } from 'react';
import { Icon } from '../../components/ui/index.js';
import { api } from '../../services/api.js';
import { useCalendarData } from '../../hooks/useCalendarData.js';
import { useAuth } from '../../hooks/useAuth.js';
import { useToast } from '../../hooks/useToast.js';
import { EMOTIONS } from '../../constants/emotions.js';
import { EmotionJar } from './EmotionJar.jsx';
import { EmotionBottomSheet } from './EmotionBottomSheet.jsx';
import { EmotionEntryForm } from './EmotionEntryForm.jsx';
import { EmotionDaySummary } from './EmotionDaySummary.jsx';
import { EmotionHistoryList } from './EmotionHistoryList.jsx';
import { PERIOD_ICONS, PERIOD_LABELS, PERIOD_QUESTIONS, currentPeriod, groupEntriesByDay, toDayKey } from './emocoesUtils.js';

export function EmocoesPage() {
  const { users } = useCalendarData();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('hoje');
  const [viewScope, setViewScope] = useState(() => user?._id ?? null);
  const [entries, setEntries] = useState([]);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [activePeriod, setActivePeriod] = useState(null);

  const isMyView = viewScope === user?._id;
  const otherUser = users.find((u) => u._id !== user?._id);
  const todayKey = toDayKey(new Date());

  const reloadEntries = useCallback(async () => {
    if (!viewScope) return;
    setEntries(await api.getEmotionEntries({ user: viewScope }));
  }, [viewScope]);

  useEffect(() => {
    reloadEntries();
  }, [reloadEntries]);

  const todayEntries = entries.filter((entry) => entry.day === todayKey);
  const historyDays = groupEntriesByDay(entries);

  function handleOpenSheet() {
    setActivePeriod(currentPeriod());
    setSheetOpen(true);
  }

  function handleCloseSheet() {
    setSheetOpen(false);
    setActivePeriod(null);
  }

  async function handleSaved() {
    await reloadEntries();
    showToast('Emoção registrada', 'success');
    handleCloseSheet();
  }

  return (
    <section className="view emotion-page">
      <div className="emotion-page-header">
        <h2 className="emotion-page-title">Emoções do Dia</h2>

        <div className="emotion-header-actions">
          {otherUser && (
            <div className="emotion-view-toggle">
              <button
                type="button"
                className={`emotion-type-toggle-btn${isMyView ? ' is-active' : ''}`}
                onClick={() => setViewScope(user._id)}
              >
                Meu
              </button>
              <button
                type="button"
                className={`emotion-type-toggle-btn${!isMyView ? ' is-active' : ''}`}
                onClick={() => setViewScope(otherUser._id)}
              >
                {otherUser.name}
              </button>
            </div>
          )}

          <button
            type="button"
            className="icon-btn emotion-history-btn"
            onClick={() => setActiveTab(activeTab === 'historico' ? 'hoje' : 'historico')}
            aria-label={activeTab === 'historico' ? 'Voltar' : 'Ver histórico'}
          >
            <Icon name={activeTab === 'historico' ? 'x' : 'calendar'} />
          </button>
        </div>
      </div>

      {activeTab === 'hoje' && (
        <div className="emotion-hero">
          <span className="emotion-period-chip">
            <Icon name={PERIOD_ICONS[currentPeriod()]} />
            {PERIOD_LABELS[currentPeriod()]}
          </span>

          <h1 className="emotion-hero-question">{PERIOD_QUESTIONS[currentPeriod()]}</h1>

          <EmotionJar entries={todayEntries} resetKey={viewScope} />

          {todayEntries.length > 0 && (
            <div className="emotion-mini-summary">
              {todayEntries.slice(-3).map((entry) => (
                <span
                  key={entry._id}
                  className="emotion-mini-dot"
                  style={{ background: EMOTIONS[entry.emotion]?.color }}
                />
              ))}
            </div>
          )}

          {isMyView ? (
            <button type="button" className="emotion-fab" onClick={handleOpenSheet} aria-label="Registrar emoção">
              <Icon name="plus" />
            </button>
          ) : (
            <p className="emotion-summary-empty">Você está vendo a jarra de {otherUser?.name}.</p>
          )}

          <EmotionDaySummary entries={todayEntries} />
        </div>
      )}

      {activeTab === 'historico' && <EmotionHistoryList days={historyDays} />}

      <EmotionBottomSheet open={sheetOpen} onClose={handleCloseSheet}>
        {activePeriod && <EmotionEntryForm day={todayKey} period={activePeriod} onSaved={handleSaved} />}
      </EmotionBottomSheet>
    </section>
  );
}
