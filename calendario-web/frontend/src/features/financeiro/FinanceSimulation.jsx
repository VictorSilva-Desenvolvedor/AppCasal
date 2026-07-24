import { useEffect, useState } from 'react';
import { Button, Card, Icon } from '../../components/ui/index.js';
import { api } from '../../services/api.js';
import { useToast } from '../../hooks/useToast.js';
import { computeSimulatedTotals, formatCurrency, monthLabel } from './financeUtils.js';

export function FinanceSimulation({ entries, report, monthYear }) {
  const { showToast } = useToast();
  const [simulations, setSimulations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [name, setName] = useState('');
  const [excludedIds, setExcludedIds] = useState(new Set());
  const [hypotheticalEntries, setHypotheticalEntries] = useState([]);
  const [hypoType, setHypoType] = useState('despesa');
  const [hypoDescription, setHypoDescription] = useState('');
  const [hypoAmount, setHypoAmount] = useState('');
  const [saving, setSaving] = useState(false);

  async function reloadSimulations() {
    setSimulations(await api.getFinanceSimulations());
  }

  useEffect(() => {
    reloadSimulations();
  }, []);

  function handleNewSimulation() {
    setActiveId(null);
    setName('');
    setExcludedIds(new Set());
    setHypotheticalEntries([]);
  }

  function handleLoadSimulation(id) {
    if (!id) {
      handleNewSimulation();
      return;
    }
    const sim = simulations.find((s) => s._id === id);
    if (!sim) return;
    setActiveId(sim._id);
    setName(sim.name);
    setExcludedIds(new Set(sim.excludedEntryIds || []));
    setHypotheticalEntries((sim.hypotheticalEntries || []).map((h) => ({ ...h, id: h._id })));
  }

  function toggleEntry(id) {
    setExcludedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleAddHypothetical() {
    const value = Number(hypoAmount);
    if (!hypoDescription.trim() || !value) return;
    setHypotheticalEntries((prev) => [
      ...prev,
      { id: `local-${Date.now()}`, type: hypoType, description: hypoDescription.trim(), amount: value },
    ]);
    setHypoDescription('');
    setHypoAmount('');
  }

  function handleRemoveHypothetical(id) {
    setHypotheticalEntries((prev) => prev.filter((entry) => entry.id !== id));
  }

  async function handleSave(asNew) {
    if (!name.trim()) {
      showToast('Dê um nome pra simulação antes de salvar', 'error');
      return;
    }
    const payload = {
      name: name.trim(),
      month: monthYear.month,
      year: monthYear.year,
      excludedEntryIds: Array.from(excludedIds),
      hypotheticalEntries: hypotheticalEntries.map(({ type, description, amount }) => ({ type, description, amount })),
    };
    setSaving(true);
    try {
      if (activeId && !asNew) {
        await api.updateFinanceSimulation(activeId, payload);
        showToast('Simulação atualizada', 'success');
      } else {
        const created = await api.createFinanceSimulation(payload);
        setActiveId(created._id);
        showToast('Simulação salva', 'success');
      }
      await reloadSimulations();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!activeId || !window.confirm('Excluir esta simulação?')) return;
    try {
      await api.deleteFinanceSimulation(activeId);
      showToast('Simulação excluída', 'success');
      handleNewSimulation();
      await reloadSimulations();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  const totals = computeSimulatedTotals(entries, excludedIds, hypotheticalEntries);
  const realSaldo = report?.saldo ?? 0;
  const delta = totals.saldo - realSaldo;

  return (
    <div className="finance-simulation-tab">
      <Card className="finance-report-card">
        <div className="finance-simulation-scenario-bar">
          <select value={activeId || ''} onChange={(event) => handleLoadSimulation(event.target.value)}>
            <option value="">Nova simulação</option>
            {simulations.map((sim) => (
              <option key={sim._id} value={sim._id}>
                {sim.name} ({monthLabel(sim.month, sim.year)})
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Nome da simulação"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <Button variant="secondary" loading={saving} onClick={() => handleSave(false)}>
            {activeId ? 'Atualizar cenário' : 'Salvar cenário'}
          </Button>
          {activeId && (
            <>
              <Button variant="secondary" onClick={() => handleSave(true)}>
                Salvar como novo
              </Button>
              <Button variant="danger" onClick={handleDelete}>
                Excluir
              </Button>
            </>
          )}
        </div>
        <p className="finance-goal-form-hint">
          Marque quais lançamentos de {monthLabel(monthYear.month, monthYear.year)} entram na simulação e adicione
          itens hipotéticos pra ver o impacto no saldo.
        </p>
      </Card>

      <Card className="finance-report-card">
        <h3>Lançamentos do mês</h3>
        {entries.length === 0 ? (
          <p className="sidebar-empty">Nenhum lançamento neste mês</p>
        ) : (
          <div className="finance-entry-list">
            {entries.map((entry) => (
              <label key={entry._id} className="finance-simulation-entry-row">
                <input type="checkbox" checked={!excludedIds.has(entry._id)} onChange={() => toggleEntry(entry._id)} />
                <span className="finance-entry-item-meta">{entry.description}</span>
                <span className={entry.type === 'receita' ? 'finance-value--positive' : 'finance-value--negative'}>
                  {entry.type === 'receita' ? '+' : '-'} {formatCurrency(entry.amount)}
                </span>
              </label>
            ))}
          </div>
        )}
      </Card>

      <Card className="finance-report-card">
        <h3>Itens hipotéticos</h3>
        <div className="finance-type-toggle">
          <button
            type="button"
            className={`finance-type-toggle-btn${hypoType === 'despesa' ? ' is-active' : ''}`}
            onClick={() => setHypoType('despesa')}
          >
            Despesa
          </button>
          <button
            type="button"
            className={`finance-type-toggle-btn${hypoType === 'receita' ? ' is-active' : ''}`}
            onClick={() => setHypoType('receita')}
          >
            Receita
          </button>
        </div>
        <div className="finance-simulation-add-form">
          <input
            type="text"
            placeholder="Descrição (ex: conta de luz a mais)"
            value={hypoDescription}
            onChange={(event) => setHypoDescription(event.target.value)}
          />
          <input
            type="number"
            min="0"
            step="0.01"
            placeholder="Valor"
            value={hypoAmount}
            onChange={(event) => setHypoAmount(event.target.value)}
          />
          <Button variant="secondary" onClick={handleAddHypothetical}>
            <Icon name="plus" /> Adicionar
          </Button>
        </div>
        {hypotheticalEntries.length > 0 && (
          <div className="finance-entry-list">
            {hypotheticalEntries.map((entry) => (
              <div key={entry.id} className="finance-simulation-hypo-row">
                <span className="finance-entry-item-meta">{entry.description}</span>
                <span className={entry.type === 'receita' ? 'finance-value--positive' : 'finance-value--negative'}>
                  {entry.type === 'receita' ? '+' : '-'} {formatCurrency(entry.amount)}
                </span>
                <button type="button" onClick={() => handleRemoveHypothetical(entry.id)} title="Remover">
                  <Icon name="trash" />
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>

      <div className="finance-summary-cards">
        <Card className="finance-summary-card">
          <span className="finance-summary-card-label">Receita simulada</span>
          <strong className="finance-summary-card-value finance-value--positive">
            {formatCurrency(totals.totalReceitas)}
          </strong>
        </Card>
        <Card className="finance-summary-card">
          <span className="finance-summary-card-label">Despesa simulada</span>
          <strong className="finance-summary-card-value finance-value--negative">
            {formatCurrency(totals.totalDespesas)}
          </strong>
        </Card>
        <Card className="finance-summary-card">
          <span className="finance-summary-card-label">Saldo simulado</span>
          <strong
            className={`finance-summary-card-value ${totals.saldo >= 0 ? 'finance-value--positive' : 'finance-value--negative'}`}
          >
            {formatCurrency(totals.saldo)}
          </strong>
        </Card>
        <Card className="finance-summary-card">
          <span className="finance-summary-card-label">Diferença vs. saldo real</span>
          <strong
            className={`finance-summary-card-value ${delta >= 0 ? 'finance-value--positive' : 'finance-value--negative'}`}
          >
            {delta >= 0 ? '+' : ''}
            {formatCurrency(delta)}
          </strong>
        </Card>
      </div>
    </div>
  );
}
