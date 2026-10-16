import { useCallback, useEffect, useRef, useState } from 'react';
import { Button, Card, Icon, IconButton, Modal, Pill, HeartLoader } from '../../components/ui/index.js';
import { api } from '../../services/api.js';
import { useCalendarData } from '../../hooks/useCalendarData.js';
import { useAuth } from '../../hooks/useAuth.js';
import { useTheme } from '../../hooks/useTheme.js';
import { useToast } from '../../hooks/useToast.js';
import { FinanceSummary } from './FinanceSummary.jsx';
import { FinanceCategoryManager } from './FinanceCategoryManager.jsx';
import { FinanceEntryForm } from './FinanceEntryForm.jsx';
import { FinanceEntryList } from './FinanceEntryList.jsx';
import { FinancePagarContas } from './FinancePagarContas.jsx';
import { ReimbursementWallet } from './ReimbursementWallet.jsx';
import { FinanceGoalForm } from './FinanceGoalForm.jsx';
import { FinanceGoals } from './FinanceGoals.jsx';
import { ArchiveGoalForm } from './ArchiveGoalForm.jsx';
import { FinanceSimulation } from './FinanceSimulation.jsx';
import { FinanceImportModal } from './FinanceImportModal.jsx';
import { FinanceMoveBar } from './FinanceMoveBar.jsx';
import { useDragAndDrop } from '../../hooks/useDragAndDrop.js';
import { currentMonthYear, isGoalArchived, monthLabel } from './financeUtils.js';

const TABS = [
  { value: 'resumo', label: 'Resumo' },
  { value: 'pagar-contas', label: 'Pagar Contas' },
  { value: 'lancamentos', label: 'Lançamentos' },
  { value: 'reembolsos', label: 'Carteira' },
  { value: 'objetivos', label: 'Objetivos' },
  { value: 'comodidades', label: 'Comodidades' },
  { value: 'simulacao', label: 'Simulação' },
];

function shiftMonthYear({ month, year }, direction) {
  const total = month - 1 + direction;
  const newYear = year + Math.floor(total / 12);
  const newMonth = ((total % 12) + 12) % 12;
  return { month: newMonth + 1, year: newYear };
}

// Menu "Mais" do topo: ações raras que não merecem botão permanente.
function FinanceMoreMenu({ items }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    function handleClick(event) {
      if (ref.current && !ref.current.contains(event.target)) setOpen(false);
    }
    function handleKey(event) {
      if (event.key === 'Escape') setOpen(false);
    }
    document.addEventListener('click', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  return (
    <div className="finance-more" ref={ref}>
      <Button variant="secondary" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        Mais
      </Button>
      {open && (
        <div className="finance-more-menu" role="menu">
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              role="menuitem"
              disabled={item.disabled}
              onClick={() => {
                setOpen(false);
                item.onSelect();
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function FinanceiroPage() {
  const { users } = useCalendarData();
  const { user } = useAuth();
  const { financeDefaultScope, hideFinanceValues, updatePreferences } = useTheme();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('resumo');
  const [monthYear, setMonthYear] = useState(currentMonthYear);
  const [viewScope, setViewScope] = useState(() => user?._id ?? null);
  const [scopeDefaultApplied, setScopeDefaultApplied] = useState(false);

  useEffect(() => {
    if (scopeDefaultApplied || !user || !users.length) return;
    if (financeDefaultScope === 'partner') {
      const partner = users.find((u) => u._id !== user._id);
      if (partner) setViewScope(partner._id);
    }
    setScopeDefaultApplied(true);
  }, [scopeDefaultApplied, financeDefaultScope, users, user]);
  const [categories, setCategories] = useState([]);
  const [entries, setEntries] = useState([]);
  const [report, setReport] = useState(null);
  const [history, setHistory] = useState([]);
  const [reimbursements, setReimbursements] = useState([]);
  const [goals, setGoals] = useState([]);
  const [months, setMonths] = useState([]);
  const [editingEntry, setEditingEntry] = useState(null);
  const [addType, setAddType] = useState(null);
  const [addWishType, setAddWishType] = useState(null);
  const [editingGoal, setEditingGoal] = useState(null);
  const [addGoalType, setAddGoalType] = useState(null);
  const [archivingGoal, setArchivingGoal] = useState(null);
  const [togglingMonth, setTogglingMonth] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const reloadCategories = useCallback(async () => setCategories(await api.getFinanceCategories()), []);
  const reloadReimbursements = useCallback(async () => setReimbursements(await api.getReimbursements()), []);
  const reloadGoals = useCallback(async () => setGoals(await api.getFinanceGoals(viewScope)), [viewScope]);
  const reloadMonths = useCallback(async () => setMonths(await api.getFinanceMonths()), []);

  const reloadEntries = useCallback(async () => {
    setEntries(await api.getFinanceEntries({ month: monthYear.month, year: monthYear.year, paidBy: viewScope }));
  }, [monthYear, viewScope]);

  const reloadReport = useCallback(async () => {
    setReport(await api.getFinanceReport(monthYear.month, monthYear.year, viewScope));
  }, [monthYear, viewScope]);

  const reloadHistory = useCallback(async () => {
    setHistory(await api.getFinanceHistory(monthYear.month, monthYear.year, 6, viewScope));
  }, [monthYear, viewScope]);

  // Qualquer carga que falhe vira estado de erro com "Tentar de novo" — antes a
  // rejeição escapava sem tratamento e a tela ficava em "Carregando…" ou com
  // listas falsamente vazias. retryKey refaz todas as cargas.
  const [loadError, setLoadError] = useState('');
  const [retryKey, setRetryKey] = useState(0);
  const failLoad = useCallback(() => {
    setLoadError('Não foi possível carregar o financeiro. Tente de novo em instantes.');
  }, []);

  useEffect(() => {
    Promise.all([reloadCategories(), reloadMonths(), reloadReimbursements()]).catch(failLoad);
  }, [reloadCategories, reloadMonths, reloadReimbursements, retryKey, failLoad]);

  useEffect(() => {
    reloadGoals().catch(failLoad);
  }, [reloadGoals, retryKey, failLoad]);

  useEffect(() => {
    // Lançamentos primeiro: essa chamada gera os fixos do mês, e o resumo em
    // paralelo poderia gerá-los de novo ao mesmo tempo (duplicando).
    reloadEntries()
      .then(() => Promise.all([reloadReport(), reloadHistory()]))
      .catch(failLoad)
      .finally(() => setLoading(false));
    setEditingEntry(null);
  }, [reloadEntries, reloadReport, reloadHistory, retryKey, failLoad]);

  const dnd = useDragAndDrop({ onDrop: handleMoveDrop });

  function handleRetry() {
    setLoadError('');
    setLoading(true);
    setRetryKey((key) => key + 1);
  }

  if (loading) {
    return (
      <section className="view finance-page">
        <HeartLoader />
      </section>
    );
  }

  if (loadError) {
    return (
      <section className="view finance-page">
        <Card className="finance-load-error" role="alert">
          <p>{loadError}</p>
          <Button type="button" variant="secondary" onClick={handleRetry}>
            Tentar de novo
          </Button>
        </Card>
      </section>
    );
  }

  const currentMonthRecord = months.find((m) => m.month === monthYear.month && m.year === monthYear.year);
  const isClosed = currentMonthRecord?.status === 'fechado';
  const isMyView = viewScope === user?._id;
  const otherUser = users.find((u) => u._id !== user?._id);

  const regularEntries = entries.filter((entry) => !entry.wishType);
  const necessidadeEntries = entries.filter((entry) => entry.wishType === 'necessidade');
  const desejoEntries = entries.filter((entry) => entry.wishType === 'desejo');
  const linkableGoals = goals.filter((goal) => !isGoalArchived(goal));

  async function handleToggleMonth() {
    setTogglingMonth(true);
    try {
      if (isClosed) {
        await api.reopenFinanceMonth(currentMonthRecord._id);
        showToast('Mês reaberto', 'success');
      } else {
        const record = currentMonthRecord || (await api.createFinanceMonth(monthYear));
        await api.closeFinanceMonth(record._id);
        showToast('Mês finalizado', 'success');
      }
      await reloadMonths();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setTogglingMonth(false);
    }
  }

  // O histórico entra junto: sem ele o gráfico de saldo ficava com o valor de
  // antes do lançamento enquanto o resumo já mostrava o novo saldo.
  async function handleEntrySaved() {
    await Promise.all([reloadEntries(), reloadReport(), reloadHistory(), reloadReimbursements()]);
  }

  async function handleEntryDeleted() {
    await Promise.all([reloadEntries(), reloadReport(), reloadHistory(), reloadReimbursements()]);
  }

  async function handleImported() {
    await Promise.all([reloadEntries(), reloadReport(), reloadHistory(), reloadReimbursements(), reloadGoals()]);
  }

  // Alvo de soltura codificado como "tipo:valor" (ex. "nature:fixa",
  // "category:<id>", "wish:desejo") — cada tipo vira um patch parcial.
  async function handleMoveDrop(entryId, targetKey) {
    const entry = entries.find((item) => item._id === entryId);
    if (!entry) return;

    const separator = targetKey.indexOf(':');
    const kind = targetKey.slice(0, separator);
    const value = targetKey.slice(separator + 1);
    let patch = null;

    if (kind === 'nature') {
      if (entry.type !== 'despesa') return;
      // Cair numa seção de natureza também tira o item do planejamento futuro.
      if ((entry.nature || 'unica') === value && !entry.wishType) return;
      patch = { nature: value, wishType: null };
    } else if (kind === 'category') {
      const category = value === 'sem-categoria' ? null : value;
      if ((entry.category?._id || null) === category) return;
      patch = { category };
    } else if (kind === 'wish') {
      const wishType = value === 'none' ? null : value;
      if ((entry.wishType || null) === wishType) return;
      patch = { wishType };
    }

    if (!patch) return;

    try {
      await api.moveFinanceEntry(entryId, patch);
      await handleEntrySaved();
      showToast('Lançamento movido', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  return (
    <section className="view finance-page">
      <div className="finance-page-header">
        <div>
          <h2>Financeiro</h2>
          <p>O dinheiro de vocês, mês a mês.</p>
        </div>

        <div className="finance-month-nav">
          <Button
            variant="secondary"
            aria-label="Mês anterior"
            title="Mês anterior"
            onClick={() => setMonthYear((prev) => shiftMonthYear(prev, -1))}
          >
            <Icon name="chevron-left" />
          </Button>
          <strong>{monthLabel(monthYear.month, monthYear.year)}</strong>
          <Button
            variant="secondary"
            aria-label="Próximo mês"
            title="Próximo mês"
            onClick={() => setMonthYear((prev) => shiftMonthYear(prev, 1))}
          >
            <Icon name="chevron-right" />
          </Button>
          {isClosed && <Pill className="finance-status-pill finance-status--pago">Finalizado</Pill>}
          <IconButton
            onClick={() => updatePreferences({ hideFinanceValues: !hideFinanceValues })}
            title={hideFinanceValues ? 'Mostrar valores financeiros' : 'Ocultar valores financeiros'}
            aria-label={hideFinanceValues ? 'Mostrar valores financeiros' : 'Ocultar valores financeiros'}
          >
            <Icon name={hideFinanceValues ? 'eye-off' : 'eye'} />
          </IconButton>
          {/* Finalizar e importar são raros (fim do mês, uma vez): ficam no menu, não
              como botão primário permanente no topo (critique). */}
          <FinanceMoreMenu
            items={[
              {
                label: isClosed ? 'Reabrir mês' : 'Finalizar mês',
                onSelect: handleToggleMonth,
                disabled: togglingMonth,
              },
              { label: 'Importar planilha', onSelect: () => setImportOpen(true) },
            ]}
          />
        </div>
      </div>

      <FinanceImportModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        categories={categories}
        monthYear={monthYear}
        onImported={handleImported}
      />

      {otherUser && (
        <div className="finance-view-toggle" role="tablist" aria-label="De quem são os dados">
          <button
            type="button"
            role="tab"
            aria-selected={isMyView}
            className={`finance-type-toggle-btn${isMyView ? ' is-active' : ''}`}
            onClick={() => setViewScope(user._id)}
          >
            Meu
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={!isMyView}
            className={`finance-type-toggle-btn${!isMyView ? ' is-active' : ''}`}
            onClick={() => setViewScope(otherUser._id)}
          >
            {otherUser.name}
          </button>
        </div>
      )}

      <div className="finance-tabs" role="tablist" aria-label="Seções do financeiro">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.value}
            className={`finance-tab-btn${activeTab === tab.value ? ' is-active' : ''}`}
            onClick={() => setActiveTab(tab.value)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'resumo' && (
        <FinanceSummary
          report={report}
          goals={goals}
          history={history}
          hideFinanceValues={hideFinanceValues}
          onStart={() => setActiveTab('lancamentos')}
        />
      )}

      {activeTab === 'pagar-contas' && (
        <FinancePagarContas
          entries={regularEntries}
          monthLocked={isClosed}
          onChanged={handleEntrySaved}
          hideFinanceValues={hideFinanceValues}
        />
      )}

      {activeTab === 'lancamentos' && (
        <div className="finance-entries-tab">
          <FinanceCategoryManager categories={categories} onChanged={reloadCategories} />
          {isMyView ? (
            <div className="finance-add-entry-actions">
              <Button variant="secondary" onClick={() => setAddType('despesa')}>
                <Icon name="plus" className="finance-value--negative" /> Despesa
              </Button>
              <Button variant="secondary" onClick={() => setAddType('receita')}>
                <Icon name="plus" className="finance-value--positive" /> Receita
              </Button>
            </div>
          ) : (
            <p className="finance-goal-form-hint">
              Você está vendo os lançamentos de {otherUser?.name}. Mude pra &quot;Meu&quot; pra adicionar um
              lançamento.
            </p>
          )}
          <FinanceEntryList
            entries={regularEntries}
            monthLocked={isClosed}
            onEdit={setEditingEntry}
            onDeleted={handleEntryDeleted}
            onChanged={handleEntrySaved}
            hideFinanceValues={hideFinanceValues}
            groupByNature
            dnd={dnd}
          />
        </div>
      )}

      {activeTab === 'reembolsos' && (
        <ReimbursementWallet
          reimbursements={reimbursements}
          users={users}
          onChanged={reloadReimbursements}
          hideFinanceValues={hideFinanceValues}
        />
      )}

      {activeTab === 'objetivos' && (
        <div className="finance-goals-tab">
          {isMyView ? (
            <div className="finance-add-entry-actions">
              <Button variant="secondary" onClick={() => setAddGoalType('poupanca')}>
                <Icon name="plus" /> Poupança
              </Button>
              <Button variant="secondary" onClick={() => setAddGoalType('parcelamento')}>
                <Icon name="plus" /> Financiamento
              </Button>
            </div>
          ) : (
            <p className="finance-goal-form-hint">
              Você está vendo os objetivos de {otherUser?.name}. Mude pra &quot;Meu&quot; pra adicionar um objetivo.
            </p>
          )}
          <FinanceGoals
            goals={goals}
            onChanged={reloadGoals}
            onEdit={setEditingGoal}
            onArchive={setArchivingGoal}
            hideFinanceValues={hideFinanceValues}
          />
        </div>
      )}

      {activeTab === 'comodidades' && (
        <div className="finance-wishlist-tab">
          {isMyView ? (
            <div className="finance-add-entry-actions">
              <Button variant="secondary" onClick={() => setAddWishType('necessidade')}>
                <Icon name="plus" /> Necessidade futura
              </Button>
              <Button variant="secondary" onClick={() => setAddWishType('desejo')}>
                <Icon name="plus" /> Desejo futuro
              </Button>
            </div>
          ) : (
            <p className="finance-goal-form-hint">
              Você está vendo as comodidades de {otherUser?.name}. Mude pra &quot;Meu&quot; pra adicionar um item.
            </p>
          )}
          <Card
            className={`finance-report-card${dnd.isDropTarget('wish:necessidade') ? ' drag-over' : ''}`}
            {...(isClosed ? {} : dnd.dropProps('wish:necessidade'))}
          >
            <h3>Necessidades futuras</h3>
            <FinanceEntryList
              entries={necessidadeEntries}
              monthLocked={isClosed}
              onEdit={setEditingEntry}
              onDeleted={handleEntryDeleted}
              onChanged={handleEntrySaved}
              hideFinanceValues={hideFinanceValues}
              dnd={dnd}
            />
          </Card>
          <Card
            className={`finance-report-card${dnd.isDropTarget('wish:desejo') ? ' drag-over' : ''}`}
            {...(isClosed ? {} : dnd.dropProps('wish:desejo'))}
          >
            <h3>Comodidades e desejos futuros</h3>
            <FinanceEntryList
              entries={desejoEntries}
              monthLocked={isClosed}
              onEdit={setEditingEntry}
              onDeleted={handleEntryDeleted}
              onChanged={handleEntrySaved}
              hideFinanceValues={hideFinanceValues}
              dnd={dnd}
            />
          </Card>
        </div>
      )}

      {activeTab === 'simulacao' && (
        <FinanceSimulation
          entries={regularEntries}
          report={report}
          monthYear={monthYear}
          hideFinanceValues={hideFinanceValues}
        />
      )}

      <Modal open={Boolean(editingEntry)} onClose={() => setEditingEntry(null)} title="Editar lançamento">
        {editingEntry && (
          <FinanceEntryForm
            categories={categories}
            users={users}
            goals={linkableGoals}
            monthLocked={isClosed}
            editingEntry={editingEntry}
            onSaved={async () => {
              await handleEntrySaved();
              setEditingEntry(null);
            }}
            onCancelEdit={() => setEditingEntry(null)}
          />
        )}
      </Modal>

      <Modal
        open={Boolean(addType)}
        onClose={() => setAddType(null)}
        title={addType === 'receita' ? 'Nova receita' : 'Nova despesa'}
      >
        {addType && (
          <FinanceEntryForm
            categories={categories}
            users={users}
            goals={linkableGoals}
            monthLocked={isClosed}
            editingEntry={null}
            forcedType={addType}
            onSaved={async () => {
              await handleEntrySaved();
              setAddType(null);
            }}
            onCancelEdit={() => setAddType(null)}
          />
        )}
      </Modal>

      <Modal
        open={Boolean(addWishType)}
        onClose={() => setAddWishType(null)}
        title={addWishType === 'desejo' ? 'Novo desejo futuro' : 'Nova necessidade futura'}
      >
        {addWishType && (
          <FinanceEntryForm
            categories={categories}
            users={users}
            goals={linkableGoals}
            monthLocked={isClosed}
            editingEntry={null}
            forcedType="despesa"
            forcedWishType={addWishType}
            onSaved={async () => {
              await handleEntrySaved();
              setAddWishType(null);
            }}
            onCancelEdit={() => setAddWishType(null)}
          />
        )}
      </Modal>

      <Modal open={Boolean(editingGoal)} onClose={() => setEditingGoal(null)} title="Editar objetivo">
        {editingGoal && (
          <FinanceGoalForm
            editingGoal={editingGoal}
            onSaved={async () => {
              await reloadGoals();
              setEditingGoal(null);
            }}
            onCancelEdit={() => setEditingGoal(null)}
          />
        )}
      </Modal>

      <Modal
        open={Boolean(addGoalType)}
        onClose={() => setAddGoalType(null)}
        title={addGoalType === 'parcelamento' ? 'Novo financiamento' : 'Novo objetivo de poupança'}
      >
        {addGoalType && (
          <FinanceGoalForm
            forcedType={addGoalType}
            onSaved={async () => {
              await reloadGoals();
              setAddGoalType(null);
            }}
            onCancelEdit={() => setAddGoalType(null)}
          />
        )}
      </Modal>

      <Modal open={Boolean(archivingGoal)} onClose={() => setArchivingGoal(null)} title="Arquivar objetivo">
        {archivingGoal && (
          <ArchiveGoalForm
            goal={archivingGoal}
            onArchived={async () => {
              await reloadGoals();
              setArchivingGoal(null);
            }}
            onCancel={() => setArchivingGoal(null)}
          />
        )}
      </Modal>

      <FinanceMoveBar
        entry={entries.find((entry) => entry._id === dnd.draggingId) || null}
        categories={categories}
        dnd={dnd}
      />
    </section>
  );
}
