import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Icon, HeartLoader } from '../../components/ui/index.js';
import { api } from '../../services/api.js';
import { useCalendarData } from '../../hooks/useCalendarData.js';
import { useAuth } from '../../hooks/useAuth.js';
import { useToast } from '../../hooks/useToast.js';
import { useEmotionClock } from '../../hooks/useEmotionClock.js';
import { EMOTIONS } from '../../constants/emotions.js';
import { EmotionJar } from './EmotionJar.jsx';
import { EmotionBottomSheet } from './EmotionBottomSheet.jsx';
import { EmotionEntryForm } from './EmotionEntryForm.jsx';
import { EmotionDaySummary } from './EmotionDaySummary.jsx';
import { EmotionHistoryList } from './EmotionHistoryList.jsx';
import { EmotionDeleteConfirmDialog } from './EmotionDeleteConfirmDialog.jsx';
import { EmotionDetailCard } from './EmotionDetailCard.jsx';
import { PERIOD_ICONS, PERIOD_LABELS, PERIOD_QUESTIONS, groupEntriesByDay } from './emocoesUtils.js';

// A janela de "Desfazer" precisa ser menor que a folga do DELETE real: o toast
// só COMEÇA a sair aos UNDO_TOAST_MS (o botão continua clicável durante a
// animação de saída), então usar o mesmo valor nos dois abria uma corrida em
// que o clique chegava depois do registro já ter sido apagado no servidor.
const UNDO_TOAST_MS = 4000;
const DELETE_GRACE_MS = 6000;

export function EmocoesPage() {
  const { users } = useCalendarData();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('hoje');
  const [viewScope, setViewScope] = useState(() => user?._id ?? null);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [activePeriod, setActivePeriod] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  // id -> timeoutId do DELETE real, agendado pra depois da janela de "Desfazer".
  const pendingDeleteRef = useRef(new Map());
  // Sequência da última requisição disparada: uma resposta que chega fora de
  // ordem (trocar Meu/parceiro duas vezes rápido) é descartada em vez de
  // sobrescrever a lista mais nova.
  const loadSeqRef = useRef(0);
  // Só o id — deriva o doc atual de `entries` a cada render, então o card
  // sempre reflete o estado mais recente sem precisar de um segundo canal.
  const [detailEntryId, setDetailEntryId] = useState(null);

  const { dayKey: todayKey, period } = useEmotionClock();
  const isMyView = viewScope === user?._id;
  const otherUser = users.find((u) => u._id !== user?._id);

  // Nunca lança: qualquer falha vira toast + estado de erro, então os callers
  // (save, desfazer, retry) não precisam de try/catch próprio.
  const reloadEntries = useCallback(
    async ({ showLoader = false } = {}) => {
      if (!viewScope) return;
      const seq = ++loadSeqRef.current;
      if (showLoader) setLoading(true);
      try {
        const data = await api.getEmotionEntries({ user: viewScope });
        if (seq !== loadSeqRef.current) return;
        setEntries(data);
        setLoadError(null);
      } catch (err) {
        if (seq !== loadSeqRef.current) return;
        setLoadError(err.message);
        showToast(err.message, 'error');
      } finally {
        // Só a requisição mais recente mexe no loader: sem esta guarda, uma
        // resposta antiga chegando atrasada escondia o loader com a requisição
        // nova ainda em voo, deixando a lista anterior na tela sem aviso.
        if (seq === loadSeqRef.current) setLoading(false);
      }
    },
    [viewScope, showToast]
  );

  useEffect(() => {
    reloadEntries({ showLoader: true });
  }, [reloadEntries]);

  // Ao sair da tela o "Desfazer" deixa de ser alcançável, então os deletes
  // ainda em espera são efetivados na hora — sem isso ficavam timers órfãos
  // apontando pra um componente que não existe mais.
  useEffect(() => {
    const pending = pendingDeleteRef.current;
    return () => {
      pending.forEach((timeoutId, id) => {
        clearTimeout(timeoutId);
        api.deleteEmotionEntry(id).catch((err) => console.error('Falha ao remover registro de emoção', err));
      });
      pending.clear();
    };
  }, []);

  const todayEntries = useMemo(() => entries.filter((entry) => entry.day === todayKey), [entries, todayKey]);
  const historyDays = useMemo(() => groupEntriesByDay(entries), [entries]);
  const detailEntry = useMemo(
    () => entries.find((entry) => entry._id === detailEntryId) ?? null,
    [entries, detailEntryId]
  );

  if (loading) {
    return (
      <section className="view emotion-page">
        <HeartLoader />
      </section>
    );
  }

  function handleOpenSheet() {
    setActivePeriod(period);
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
    // dispara depois de DELETE_GRACE_MS, então o servidor ainda tem o registro
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
      duration: UNDO_TOAST_MS,
      action: { label: 'Desfazer', onClick: () => handleUndoDelete(entry._id) },
    });
    const timeoutId = setTimeout(() => finalizeDelete(entry._id), DELETE_GRACE_MS);
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

      {loadError && !entries.length && (
        <div className="emotion-load-error" role="alert">
          <p>Não foi possível carregar os registros.</p>
          <p className="emotion-load-error-detail">{loadError}</p>
          <button
            type="button"
            className="emotion-reason-btn emotion-reason-btn--primary"
            onClick={() => reloadEntries({ showLoader: true })}
          >
            Tentar novamente
          </button>
        </div>
      )}

      {activeTab === 'hoje' && (
        <div className="emotion-hero">
          <span className="emotion-period-chip">
            <Icon name={PERIOD_ICONS[period]} />
            {PERIOD_LABELS[period]}
          </span>

          <h1 className="emotion-hero-question">{PERIOD_QUESTIONS[period]}</h1>

          <EmotionJar entries={todayEntries} resetKey={viewScope} />

          {todayEntries.length > 0 && (
            // Redundante com o resumo textual logo abaixo — rotular cada ponto
            // só geraria ruído pra quem usa leitor de tela.
            <div className="emotion-mini-summary" aria-hidden="true">
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

      <EmotionBottomSheet open={sheetOpen} onClose={handleCloseSheet} label="Registrar emoção">
        {activePeriod && <EmotionEntryForm day={todayKey} period={activePeriod} onSaved={handleSaved} />}
      </EmotionBottomSheet>

      <EmotionDeleteConfirmDialog
        open={!!deleteTarget}
        entry={deleteTarget}
        onCancel={handleCancelDelete}
        onConfirm={handleConfirmDelete}
      />

      <EmotionBottomSheet open={!!detailEntry} onClose={handleCloseDetail} label="Detalhes do registro">
        {detailEntry && <EmotionDetailCard entry={detailEntry} onEntryUpdated={handleEntryUpdated} />}
      </EmotionBottomSheet>
    </section>
  );
}
