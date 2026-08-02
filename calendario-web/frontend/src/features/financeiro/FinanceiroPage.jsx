import { useCallback, useEffect, useState } from 'react';
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

  useEffect(() => {
    reloadCategories();
    reloadMonths();
    reloadReimbursements();
  }, [reloadCategories, reloadMonths, reloadReimbursements]);

  useEffect(() => {
    reloadGoals();
  }, [reloadGoals]);

  useEffect(() => {
    Promise.all([reloadEntries(), reloadReport(), reloadHistory()]).finally(() => setLoading(false));
    setEditingEntry(null);
  }, [reloadEntries, reloadReport, reloadHistory]);

  const dnd = useDragAndDrop({ onDrop: handleMoveDrop });

  if (loading) {
    return (
      <section className="view finance-page">
        <HeartLoader />
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

  async function handleEntrySaved() {
    await Promise.all([reloadEntries(), reloadReport(), reloadReimbursements()]);
  }

  async function handleEntryDeleted() {
    await Promise.all([reloadEntries(), reloadReport(), reloadReimbursements()]);
  }

  async function handleImported() {
    await Promise.all([reloadEntries(), reloadReport(), reloadReimbursements(), reloadGoals()]);
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
          <p>Orçamento compartilhado, lançamentos, carteira de reembolsos e objetivos do casal.</p>
        </div>

        <div className="finance-month-nav">
          <Button variant="secondary" onClick={() => setMonthYear((prev) => shiftMonthYear(prev, -1))}>
            <Icon name="chevron-left" />
          </Button>
          <strong>{monthLabel(monthYear.month, monthYear.year)}</strong>
          <Button variant="secondary" onClick={() => setMonthYear((prev) => shiftMonthYear(prev, 1))}>
            <Icon name="chevron-right" />
          </Button>
          {isClosed && <Pill className="finance-status-pill finance-status--pago">Finalizado</Pill>}
          <Button variant={isClosed ? 'secondary' : 'primary'} loading={togglingMonth} onClick={handleToggleMonth}>
            {isClosed ? 'Reabrir mês' : 'Finalizar mês'}
          </Button>
          <Button variant="secondary" onClick={() => setImportOpen(true)}>
            Importar planilha
          </Button>
          <IconButton
            onClick={() => updatePreferences({ hideFinanceValues: !hideFinanceValues })}
            title={hideFinanceValues ? 'Mostrar valores financeiros' : 'Ocultar valores financeiros'}
            aria-label={hideFinanceValues ? 'Mostrar valores financeiros' : 'Ocultar valores financeiros'}
          >
            <Icon name={hideFinanceValues ? 'eye-off' : 'eye'} />
          </IconButton>
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
        <div className="finance-view-toggle">
          <button
            type="button"
            className={`finance-type-toggle-btn${isMyView ? ' is-active' : ''}`}
            onClick={() => setViewScope(user._id)}
          >
            Meu
          </button>
          <button
            type="button"
            className={`finance-type-toggle-btn${!isMyView ? ' is-active' : ''}`}
            onClick={() => setViewScope(otherUser._id)}
          >
            {otherUser.name}
          </button>
        </div>
      )}

      <div className="finance-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            className={`finance-tab-btn${activeTab === tab.value ? ' is-active' : ''}`}
            onClick={() => setActiveTab(tab.value)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'resumo' && (
        <FinanceSummary report={report} goals={goals} history={history} hideFinanceValues={hideFinanceValues} />
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
            groupByNature
            dnd={dnd}
          />
        </div>
      )}

      {activeTab === 'reembolsos' && (
        <ReimbursementWallet reimbursements={reimbursements} users={users} onChanged={reloadReimbursements} />
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
          <FinanceGoals goals={goals} onChanged={reloadGoals} onEdit={setEditingGoal} onArchive={setArchivingGoal} />
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
