import { useCallback, useEffect, useState } from 'react';
import { Button, Icon, Pill } from '../../components/ui/index.js';
import { api } from '../../services/api.js';
import { useCalendarData } from '../../hooks/useCalendarData.js';
import { useToast } from '../../hooks/useToast.js';
import { FinanceSummary } from './FinanceSummary.jsx';
import { FinanceCategoryManager } from './FinanceCategoryManager.jsx';
import { FinanceEntryForm } from './FinanceEntryForm.jsx';
import { FinanceEntryList } from './FinanceEntryList.jsx';
import { ReimbursementWallet } from './ReimbursementWallet.jsx';
import { FinanceGoalForm } from './FinanceGoalForm.jsx';
import { FinanceGoals } from './FinanceGoals.jsx';
import { FinanceImportModal } from './FinanceImportModal.jsx';
import { currentMonthYear, monthLabel } from './financeUtils.js';

const TABS = [
  { value: 'resumo', label: 'Resumo' },
  { value: 'lancamentos', label: 'Lançamentos' },
  { value: 'reembolsos', label: 'Carteira' },
  { value: 'objetivos', label: 'Objetivos' },
];

function shiftMonthYear({ month, year }, direction) {
  const total = month - 1 + direction;
  const newYear = year + Math.floor(total / 12);
  const newMonth = ((total % 12) + 12) % 12;
  return { month: newMonth + 1, year: newYear };
}

export function FinanceiroPage() {
  const { users } = useCalendarData();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('resumo');
  const [monthYear, setMonthYear] = useState(currentMonthYear);
  const [categories, setCategories] = useState([]);
  const [entries, setEntries] = useState([]);
  const [report, setReport] = useState(null);
  const [reimbursements, setReimbursements] = useState([]);
  const [goals, setGoals] = useState([]);
  const [months, setMonths] = useState([]);
  const [editingEntry, setEditingEntry] = useState(null);
  const [togglingMonth, setTogglingMonth] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  const reloadCategories = useCallback(async () => setCategories(await api.getFinanceCategories()), []);
  const reloadReimbursements = useCallback(async () => setReimbursements(await api.getReimbursements()), []);
  const reloadGoals = useCallback(async () => setGoals(await api.getFinanceGoals()), []);
  const reloadMonths = useCallback(async () => setMonths(await api.getFinanceMonths()), []);

  const reloadEntries = useCallback(async () => {
    setEntries(await api.getFinanceEntries({ month: monthYear.month, year: monthYear.year }));
  }, [monthYear]);

  const reloadReport = useCallback(async () => {
    setReport(await api.getFinanceReport(monthYear.month, monthYear.year));
  }, [monthYear]);

  useEffect(() => {
    reloadCategories();
    reloadMonths();
    reloadReimbursements();
    reloadGoals();
  }, [reloadCategories, reloadMonths, reloadReimbursements, reloadGoals]);

  useEffect(() => {
    reloadEntries();
    reloadReport();
    setEditingEntry(null);
  }, [reloadEntries, reloadReport]);

  const currentMonthRecord = months.find((m) => m.month === monthYear.month && m.year === monthYear.year);
  const isClosed = currentMonthRecord?.status === 'fechado';

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
        </div>
      </div>

      <FinanceImportModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        categories={categories}
        monthYear={monthYear}
        onImported={handleImported}
      />

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

      {activeTab === 'resumo' && <FinanceSummary report={report} />}

      {activeTab === 'lancamentos' && (
        <div className="finance-entries-tab">
          <FinanceCategoryManager categories={categories} onChanged={reloadCategories} />
          <FinanceEntryForm
            categories={categories}
            users={users}
            monthLocked={isClosed}
            editingEntry={editingEntry}
            onSaved={handleEntrySaved}
            onCancelEdit={() => setEditingEntry(null)}
          />
          <FinanceEntryList
            entries={entries}
            monthLocked={isClosed}
            onEdit={setEditingEntry}
            onDeleted={handleEntryDeleted}
          />
        </div>
      )}

      {activeTab === 'reembolsos' && (
        <ReimbursementWallet reimbursements={reimbursements} users={users} onChanged={reloadReimbursements} />
      )}

      {activeTab === 'objetivos' && (
        <div className="finance-goals-tab">
          <FinanceGoalForm onCreated={reloadGoals} />
          <FinanceGoals goals={goals} onChanged={reloadGoals} />
        </div>
      )}
    </section>
  );
}
