import { useState } from 'react';
import { Button, Card, IconButton, Icon } from '../../components/ui/index.js';
import { api } from '../../services/api.js';
import { useToast } from '../../hooks/useToast.js';
import { formatCurrency } from './financeUtils.js';

function GoalCard({ goal, onChanged, readOnly }) {
  const [contribution, setContribution] = useState('');
  const { showToast } = useToast();
  const hasInstallments = Boolean(goal.totalInstallments);

  const progress = goal.targetAmount ? Math.min(100, (goal.currentAmount / goal.targetAmount) * 100) : 0;

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

  async function handlePayInstallment() {
    try {
      await api.updateFinanceGoal(goal._id, {
        paidInstallments: goal.paidInstallments + 1,
        currentAmount: goal.currentAmount + (goal.installmentAmount || 0),
      });
      await onChanged();
      showToast('Parcela marcada como paga', 'success');
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
          <IconButton onClick={handleDelete} title="Excluir objetivo">
            <Icon name="trash" />
          </IconButton>
        )}
      </div>

      <div className="finance-goal-progress-track">
        <div className="finance-goal-progress-fill" style={{ width: `${progress}%` }} />
      </div>

      <span className="finance-entry-item-meta">
        {formatCurrency(goal.currentAmount)} de {formatCurrency(goal.targetAmount)}
      </span>
      {hasInstallments && (
        <span className="finance-entry-item-meta">
          {goal.paidInstallments} de {goal.totalInstallments} parcelas
          {goal.installmentAmount ? ` (${formatCurrency(goal.installmentAmount)}/mês)` : ''}
        </span>
      )}

      {goal.notes && <span className="finance-entry-item-meta">{goal.notes}</span>}

      {!readOnly && (
        <div className="finance-goal-actions">
          {hasInstallments && (
            <Button variant="secondary" onClick={handlePayInstallment}>
              Marcar parcela paga
            </Button>
          )}
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

export function FinanceGoals({ goals, onChanged, readOnly }) {
  if (goals.length === 0) {
    return <p className="sidebar-empty">Nenhum objetivo cadastrado ainda</p>;
  }

  return (
    <div className="finance-goal-list">
      {goals.map((goal) => (
        <GoalCard key={goal._id} goal={goal} onChanged={onChanged} readOnly={readOnly} />
      ))}
    </div>
  );
}
