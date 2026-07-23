import { useState } from 'react';
import { Button, Card, IconButton, Icon } from '../../components/ui/index.js';
import { api } from '../../services/api.js';
import { useToast } from '../../hooks/useToast.js';
import { formatCurrency } from './financeUtils.js';

function InstallmentGrid({ total, paid, onSetPaid, readOnly }) {
  return (
    <div className="finance-installment-grid">
      {Array.from({ length: total }, (_, i) => i + 1).map((n) => (
        <button
          key={n}
          type="button"
          className={`finance-installment-cell${n <= paid ? ' is-paid' : ''}`}
          disabled={readOnly}
          title={`Parcela ${n}`}
          onClick={() => onSetPaid(n === paid ? n - 1 : n)}
        >
          {n}
        </button>
      ))}
    </div>
  );
}

function GoalCard({ goal, onChanged, onEdit, readOnly }) {
  const [contribution, setContribution] = useState('');
  const { showToast } = useToast();
  const hasInstallments = Boolean(goal.totalInstallments);

  const progress = goal.targetAmount ? Math.min(100, (goal.currentAmount / goal.targetAmount) * 100) : 0;
  const remainingInstallments = hasInstallments ? Math.max(0, goal.totalInstallments - goal.paidInstallments) : null;
  const remainingAmount =
    hasInstallments && goal.installmentAmount
      ? remainingInstallments * goal.installmentAmount
      : Math.max(0, goal.targetAmount - goal.currentAmount);

  async function handleAddContribution() {
    const value = Number(contribution);
    if (!value) return;
    try {
      await api.updateFinanceGoal(goal._id, { currentAmount: goal.currentAmount + value });
      setContribution('');
      await onChanged();
      showToast('Progresso atualizado', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  async function handleSetPaidInstallments(n) {
    const clamped = Math.max(0, Math.min(goal.totalInstallments, n));
    try {
      await api.updateFinanceGoal(goal._id, {
        paidInstallments: clamped,
        currentAmount: clamped * (goal.installmentAmount || 0),
      });
      await onChanged();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  async function handleDelete() {
    if (!window.confirm('Excluir este objetivo?')) return;
    try {
      await api.deleteFinanceGoal(goal._id);
      await onChanged();
      showToast('Objetivo excluído', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  return (
    <Card className="finance-goal-card">
      <div className="finance-goal-card-header">
        <strong>{goal.name}</strong>
        {!readOnly && (
          <div className="finance-entry-item-actions">
            <IconButton onClick={() => onEdit(goal)} title="Editar objetivo">
              <Icon name="tool" />
            </IconButton>
            <IconButton onClick={handleDelete} title="Excluir objetivo">
              <Icon name="trash" />
            </IconButton>
          </div>
        )}
      </div>

      <div className="finance-goal-progress-track">
        <div className="finance-goal-progress-fill" style={{ width: `${progress}%` }} />
      </div>

      <span className="finance-entry-item-meta">
        {formatCurrency(goal.currentAmount)} de {formatCurrency(goal.targetAmount)}
      </span>
      {hasInstallments && (
        <>
          <span className="finance-entry-item-meta">
            {goal.paidInstallments} de {goal.totalInstallments} parcelas
            {goal.installmentAmount ? ` (${formatCurrency(goal.installmentAmount)}/mês)` : ''}
          </span>
          <InstallmentGrid
            total={goal.totalInstallments}
            paid={goal.paidInstallments}
            onSetPaid={handleSetPaidInstallments}
            readOnly={readOnly}
          />
        </>
      )}

      <span className="finance-entry-item-meta finance-goal-remaining">
        Faltam {formatCurrency(remainingAmount)}
        {hasInstallments
          ? ` · ${remainingInstallments} parcela${remainingInstallments === 1 ? '' : 's'} restante${remainingInstallments === 1 ? '' : 's'}`
          : ''}
      </span>

      {goal.notes && <span className="finance-entry-item-meta">{goal.notes}</span>}

      {!readOnly && !hasInstallments && (
        <div className="finance-goal-actions">
          <input
            type="number"
            min="0"
            step="0.01"
            placeholder="Valor"
            value={contribution}
            onChange={(event) => setContribution(event.target.value)}
          />
          <Button variant="secondary" onClick={handleAddContribution}>
            Adicionar
          </Button>
        </div>
      )}
    </Card>
  );
}

export function FinanceGoals({ goals, onChanged, onEdit, readOnly }) {
  if (goals.length === 0) {
    return <p className="sidebar-empty">Nenhum objetivo cadastrado ainda</p>;
  }

  return (
    <div className="finance-goal-list">
      {goals.map((goal) => (
        <GoalCard key={goal._id} goal={goal} onChanged={onChanged} onEdit={onEdit} readOnly={readOnly} />
      ))}
    </div>
  );
}
