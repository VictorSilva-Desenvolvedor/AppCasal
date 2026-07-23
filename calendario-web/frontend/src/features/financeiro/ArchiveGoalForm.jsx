import { useState } from 'react';
import { Button, Field } from '../../components/ui/index.js';
import { api } from '../../services/api.js';
import { useToast } from '../../hooks/useToast.js';

export function ArchiveGoalForm({ goal, onArchived, onCancel }) {
  const [months, setMonths] = useState('3');
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  async function handleArchive() {
    const n = Number(months);
    if (!n || n < 1) return;
    const archivedUntil = new Date();
    archivedUntil.setMonth(archivedUntil.getMonth() + n);

    setSaving(true);
    try {
      await api.updateFinanceGoal(goal._id, { archivedUntil: archivedUntil.toISOString() });
      showToast('Objetivo arquivado', 'success');
      await onArchived();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="finance-archive-form">
      <p className="finance-goal-form-hint">
        &quot;{goal.name}&quot; vai sumir da lista de objetivos e não vai entrar nos cálculos do Resumo até a data
        escolhida.
      </p>
      <Field label="Por quantos meses?" htmlFor="archive-months">
        <input
          id="archive-months"
          type="number"
          min="1"
          value={months}
          onChange={(event) => setMonths(event.target.value)}
        />
      </Field>
      <div className="finance-form-actions">
        <Button onClick={handleArchive} loading={saving}>
          Arquivar
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}
