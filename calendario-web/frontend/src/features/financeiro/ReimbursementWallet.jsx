import { useMemo, useState } from 'react';
import { Button, Card, Field, Pill } from '../../components/ui/index.js';
import { api } from '../../services/api.js';
import { useToast } from '../../hooks/useToast.js';
import { formatCurrency } from './financeUtils.js';

function computeNetBalances(reimbursements, users) {
  const pending = reimbursements.filter((r) => r.status === 'pendente');
  const balances = [];

  for (let i = 0; i < users.length; i += 1) {
    for (let j = i + 1; j < users.length; j += 1) {
      const a = users[i];
      const b = users[j];
      const aOwesB = pending
        .filter((r) => r.owedBy?._id === a._id && r.owedTo?._id === b._id)
        .reduce((sum, r) => sum + r.amount, 0);
      const bOwesA = pending
        .filter((r) => r.owedBy?._id === b._id && r.owedTo?._id === a._id)
        .reduce((sum, r) => sum + r.amount, 0);
      const net = aOwesB - bOwesA;
      if (net !== 0) {
        balances.push(net > 0 ? { from: a, to: b, amount: net } : { from: b, to: a, amount: -net });
      }
    }
  }

  return balances;
}

export function ReimbursementWallet({ reimbursements, users, onChanged }) {
  const [owedBy, setOwedBy] = useState('');
  const [owedTo, setOwedTo] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  const netBalances = useMemo(() => computeNetBalances(reimbursements, users), [reimbursements, users]);

  async function handleCreate(event) {
    event.preventDefault();
    setError('');

    if (!owedBy || !owedTo || owedBy === owedTo || !amount || !description.trim()) {
      setError('Preencha devedor, credor (diferentes), valor e descrição');
      return;
    }

    setSaving(true);
    try {
      await api.createReimbursement({ owedBy, owedTo, amount: Number(amount), description: description.trim() });
      setAmount('');
      setDescription('');
      await onChanged();
      showToast('Reembolso registrado', 'success');
    } catch (err) {
      setError(err.message);
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleSettle(id) {
    try {
      await api.settleReimbursement(id);
      await onChanged();
      showToast('Reembolso quitado', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Excluir este reembolso?')) return;
    try {
      await api.deleteReimbursement(id);
      await onChanged();
      showToast('Reembolso excluído', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  return (
    <div className="finance-wallet">
      <Card className="finance-wallet-balances">
        <h3>Quem deve pra quem</h3>
        {netBalances.length === 0 ? (
          <p className="sidebar-empty">Nenhuma pendência entre vocês</p>
        ) : (
          <ul className="finance-wallet-balance-list">
            {netBalances.map((balance) => (
              <li key={`${balance.from._id}-${balance.to._id}`}>
                <strong>{balance.from.name}</strong> deve <strong>{formatCurrency(balance.amount)}</strong> para{' '}
                <strong>{balance.to.name}</strong>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <h3>Registrar empréstimo</h3>
        <form className="finance-wallet-form" onSubmit={handleCreate}>
          <div className="finance-form-row">
            <Field label="Quem deve" htmlFor="reimb-owed-by">
              <select id="reimb-owed-by" value={owedBy} onChange={(event) => setOwedBy(event.target.value)}>
                <option value="">Selecione</option>
                {users.map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Para quem" htmlFor="reimb-owed-to">
              <select id="reimb-owed-to" value={owedTo} onChange={(event) => setOwedTo(event.target.value)}>
                <option value="">Selecione</option>
                {users.map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <div className="finance-form-row">
            <Field label="Valor" htmlFor="reimb-amount">
              <input
                id="reimb-amount"
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
              />
            </Field>
            <Field label="Descrição" htmlFor="reimb-description">
              <input
                id="reimb-description"
                type="text"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
            </Field>
          </div>
          <p className="error-text">{error}</p>
          <Button type="submit" loading={saving}>
            Registrar
          </Button>
        </form>
      </Card>

      <div className="finance-entry-list">
        {reimbursements.map((r) => (
          <Card className="finance-entry-item" key={r._id}>
            <div className="finance-entry-item-main">
              <div className="finance-entry-item-info">
                <strong>{r.description}</strong>
                <span className="finance-entry-item-meta">
                  {r.owedBy?.name} deve para {r.owedTo?.name}
                </span>
              </div>
            </div>
            <div className="finance-entry-item-side">
              <strong className="finance-value--negative">{formatCurrency(r.amount)}</strong>
              <Pill className={`finance-status-pill finance-status--${r.status === 'quitado' ? 'pago' : 'pendente'}`}>
                {r.status === 'quitado' ? 'Quitado' : 'Pendente'}
              </Pill>
              <div className="finance-entry-item-actions">
                {r.status === 'pendente' && (
                  <Button variant="secondary" onClick={() => handleSettle(r._id)}>
                    Quitar
                  </Button>
                )}
                <Button variant="danger" onClick={() => handleDelete(r._id)}>
                  Excluir
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
