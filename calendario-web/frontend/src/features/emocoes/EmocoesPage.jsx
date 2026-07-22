import { useCallback, useEffect, useState } from 'react';
import { Modal } from '../../components/ui/index.js';
import { api } from '../../services/api.js';
import { useCalendarData } from '../../hooks/useCalendarData.js';
import { useAuth } from '../../hooks/useAuth.js';
import { useToast } from '../../hooks/useToast.js';
import { EmotionJar } from './EmotionJar.jsx';
import { EmotionPeriodPrompt } from './EmotionPeriodPrompt.jsx';
import { EmotionEntryForm } from './EmotionEntryForm.jsx';
import { EmotionDaySummary } from './EmotionDaySummary.jsx';
import { EmotionHistoryList } from './EmotionHistoryList.jsx';
import { PERIOD_LABELS, groupEntriesByDay, groupEntriesByPeriod, toDayKey } from './emocoesUtils.js';

const TABS = [
  { value: 'hoje', label: 'Hoje' },
  { value: 'historico', label: 'Histórico' },
];

export function EmocoesPage() {
  const { users } = useCalendarData();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('hoje');
  const [viewScope, setViewScope] = useState(() => user?._id ?? null);
  const [entries, setEntries] = useState([]);
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

  async function handleSaved() {
    setActivePeriod(null);
    await reloadEntries();
    showToast('Emoção registrada', 'success');
  }

  return (
    <section className="view emotion-page">
      <div className="emotion-page-header">
        <div>
          <h2>Emoções do Dia</h2>
          <p>Registre como você está se sentindo e acompanhe sua jarra emocional.</p>
        </div>
      </div>

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

      <div className="emotion-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            className={`emotion-tab-btn${activeTab === tab.value ? ' is-active' : ''}`}
            onClick={() => setActiveTab(tab.value)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'hoje' && (
        <>
          <EmotionJar entries={todayEntries} />
          {isMyView ? (
            <EmotionPeriodPrompt periodsData={groupEntriesByPeriod(todayEntries)} onAddClick={setActivePeriod} />
          ) : (
            <p className="emotion-summary-empty">Você está vendo a jarra de {otherUser?.name}.</p>
          )}
          <EmotionDaySummary entries={todayEntries} />
        </>
      )}

      {activeTab === 'historico' && <EmotionHistoryList days={historyDays} />}

      <Modal
        open={Boolean(activePeriod)}
        onClose={() => setActivePeriod(null)}
        title={activePeriod ? `Como você está — ${PERIOD_LABELS[activePeriod]}` : ''}
      >
        {activePeriod && (
          <EmotionEntryForm day={todayKey} period={activePeriod} onSaved={handleSaved} onCancel={() => setActivePeriod(null)} />
        )}
      </Modal>
    </section>
  );
}
