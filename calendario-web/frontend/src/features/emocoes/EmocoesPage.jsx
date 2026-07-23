import { useCallback, useEffect, useRef, useState } from 'react';
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
import { EmotionDeleteConfirmDialog } from './EmotionDeleteConfirmDialog.jsx';
import { EmotionDetailCard } from './EmotionDetailCard.jsx';
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
  const [deleteTarget, setDeleteTarget] = useState(null);
  // id -> timeoutId do DELETE real, agendado pra depois da janela de "Desfazer".
  const pendingDeleteRef = useRef(new Map());
  // Só o id — deriva o doc atual de `entries` a cada render, então o card
  // sempre reflete o estado mais recente sem precisar de um segundo canal.
  const [detailEntryId, setDetailEntryId] = useState(null);

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
  const detailEntry = entries.find((entry) => entry._id === detailEntryId) ?? null;

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

  function handleRequestDelete(entry) {
    setDeleteTarget(entry);
  }

  function handleCancelDelete() {
    setDeleteTarget(null);
  }

  async function finalizeDelete(id) {
    pendingDeleteRef.current.delete(id);
    try {
      await api.deleteEmotionEntry(id);
    } catch (err) {
      console.error('Falha ao remover registro de emoção', err);
    }
  }

  function handleUndoDelete(id) {
    const timeoutId = pendingDeleteRef.current.get(id);
    if (timeoutId) {
      clearTimeout(timeoutId);
      pendingDeleteRef.current.delete(id);
    }
    // Refetch em vez de reinserir o objeto manualmente — o DELETE real só
    // dispara depois da janela de 4s, então o servidor ainda tem o registro
    // intacto (evita reinserir um doc "stale" se ele foi editado em paralelo).
    reloadEntries();
  }

  function handleConfirmDelete() {
    const entry = deleteTarget;
    if (!entry) return;
    setDeleteTarget(null);
    // Otimista: some da UI (e a bolha correspondente "estoura" na jarra) na
    // hora; o DELETE real só é chamado se "Desfazer" não for clicado a tempo.
    setEntries((prev) => prev.filter((e) => e._id !== entry._id));
    showToast('Registro removido', 'info', {
      duration: 4000,
      action: { label: 'Desfazer', onClick: () => handleUndoDelete(entry._id) },
    });
    const timeoutId = setTimeout(() => finalizeDelete(entry._id), 4000);
    pendingDeleteRef.current.set(entry._id, timeoutId);
  }

  function handleOpenDetail(entry) {
    setDetailEntryId(entry._id);
  }

  function handleCloseDetail() {
    setDetailEntryId(null);
  }

  function handleEntryUpdated(updatedEntry) {
    setEntries((prev) => prev.map((e) => (e._id === updatedEntry._id ? updatedEntry : e)));
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

          <EmotionDaySummary
            entries={todayEntries}
            canDelete={isMyView}
            onRequestDelete={handleRequestDelete}
            onOpenDetail={handleOpenDetail}
          />
        </div>
      )}

      {activeTab === 'historico' && <EmotionHistoryList days={historyDays} />}

      <EmotionBottomSheet open={sheetOpen} onClose={handleCloseSheet}>
        {activePeriod && <EmotionEntryForm day={todayKey} period={activePeriod} onSaved={handleSaved} />}
      </EmotionBottomSheet>

      <EmotionDeleteConfirmDialog
        open={!!deleteTarget}
        entry={deleteTarget}
        onCancel={handleCancelDelete}
        onConfirm={handleConfirmDelete}
      />

      <EmotionBottomSheet open={!!detailEntry} onClose={handleCloseDetail}>
        {detailEntry && <EmotionDetailCard entry={detailEntry} onEntryUpdated={handleEntryUpdated} />}
      </EmotionBottomSheet>
    </section>
  );
}
