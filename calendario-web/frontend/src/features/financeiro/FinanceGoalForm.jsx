import { useEffect, useState } from 'react';
import { Button, Card, Field } from '../../components/ui/index.js';
import { api } from '../../services/api.js';
import { useToast } from '../../hooks/useToast.js';

const EMPTY_FORM = {
  name: '',
  targetAmount: '',
  totalInstallments: '',
  installmentAmount: '',
  paidInstallments: '',
  notes: '',
};

export function FinanceGoalForm({ editingGoal, forcedType, onSaved, onCancelEdit }) {
  const [type, setType] = useState(editingGoal?.type || forcedType || 'poupanca');
  const [form, setForm] = useState(EMPTY_FORM);
  const [installmentAmountTouched, setInstallmentAmountTouched] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    setInstallmentAmountTouched(false);
    if (editingGoal) {
      setType(editingGoal.type);
      setForm({
        name: editingGoal.name,
        targetAmount: String(editingGoal.targetAmount),
        totalInstallments: editingGoal.totalInstallments ? String(editingGoal.totalInstallments) : '',
        installmentAmount: editingGoal.installmentAmount ? String(editingGoal.installmentAmount) : '',
        paidInstallments: editingGoal.paidInstallments ? String(editingGoal.paidInstallments) : '',
        notes: editingGoal.notes || '',
      });
      setInstallmentAmountTouched(true);
    } else {
      setType(forcedType || 'poupanca');
      setForm(EMPTY_FORM);
    }
  }, [editingGoal, forcedType]);

  useEffect(() => {
    if (installmentAmountTouched || !form.targetAmount || !form.totalInstallments) return;
    const computed = Number(form.targetAmount) / Number(form.totalInstallments);
    if (Number.isFinite(computed)) {
      setForm((prev) => ({ ...prev, installmentAmount: computed.toFixed(2) }));
    }
  }, [form.targetAmount, form.totalInstallments, installmentAmountTouched]);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    if (!form.name.trim() || !form.targetAmount) {
      setError('Informe nome e valor alvo');
      return;
    }

    const payload = {
      name: form.name.trim(),
      type,
      targetAmount: Number(form.targetAmount),
      totalInstallments: form.totalInstallments ? Number(form.totalInstallments) : null,
      installmentAmount: form.installmentAmount ? Number(form.installmentAmount) : null,
      paidInstallments: form.paidInstallments ? Number(form.paidInstallments) : 0,
      notes: form.notes.trim(),
    };

    setSaving(true);
    try {
      if (editingGoal) {
        await api.updateFinanceGoal(editingGoal._id, payload);
        showToast('Objetivo atualizado', 'success');
      } else {
        await api.createFinanceGoal(payload);
        showToast('Objetivo criado', 'success');
      }
      setForm(EMPTY_FORM);
      setType(forcedType || 'poupanca');
      await onSaved();
    } catch (err) {
      setError(err.message);
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="finance-goal-form-card">
      <h3>{editingGoal ? 'Editar objetivo' : 'Novo objetivo'}</h3>
      <form className="finance-goal-form" onSubmit={handleSubmit}>
        <Field label="Nome" htmlFor="goal-name">
          <input id="goal-name" type="text" value={form.name} onChange={(event) => update('name', event.target.value)} />
        </Field>

        {(!forcedType || editingGoal) && (
          <div className="finance-type-toggle">
            <button
              type="button"
              className={`finance-type-toggle-btn${type === 'poupanca' ? ' is-active' : ''}`}
              onClick={() => setType('poupanca')}
            >
              Poupança
            </button>
            <button
              type="button"
              className={`finance-type-toggle-btn${type === 'parcelamento' ? ' is-active' : ''}`}
              onClick={() => setType('parcelamento')}
            >
              Financiamento
            </button>
          </div>
        )}

        <Field label="Valor alvo" htmlFor="goal-target">
          <input
            id="goal-target"
            type="number"
            min="0"
            step="0.01"
            value={form.targetAmount}
            onChange={(event) => update('targetAmount', event.target.value)}
          />
        </Field>

        <p className="finance-goal-form-hint">
          Se o objetivo tem um valor fixo por período (ex: parcela do financiamento, aporte mensal da poupança),
          preencha os campos abaixo — eles são opcionais e valem tanto pra poupança quanto pra financiamento.
        </p>
        <div className="finance-form-row">
          <Field label="Total de parcelas (opcional)" htmlFor="goal-installments">
            <input
              id="goal-installments"
              type="number"
              min="1"
              value={form.totalInstallments}
              onChange={(event) => update('totalInstallments', event.target.value)}
            />
          </Field>
          <Field label="Valor da parcela (opcional)" htmlFor="goal-installment-amount">
            <input
              id="goal-installment-amount"
              type="number"
              min="0"
              step="0.01"
              value={form.installmentAmount}
              onChange={(event) => {
                setInstallmentAmountTouched(true);
                update('installmentAmount', event.target.value);
              }}
            />
          </Field>
        </div>

        <Field label="Parcelas já pagas (opcional)" htmlFor="goal-paid-installments">
          <input
            id="goal-paid-installments"
            type="number"
            min="0"
            value={form.paidInstallments}
            onChange={(event) => update('paidInstallments', event.target.value)}
          />
        </Field>

        <Field label="Observações (opcional)" htmlFor="goal-notes">
          <input id="goal-notes" type="text" value={form.notes} onChange={(event) => update('notes', event.target.value)} />
        </Field>

        <p className="error-text">{error}</p>
        <div className="finance-form-actions">
          <Button type="submit" loading={saving}>
            {editingGoal ? 'Salvar alterações' : 'Criar objetivo'}
          </Button>
          {editingGoal && (
            <Button type="button" variant="secondary" onClick={onCancelEdit}>
              Cancelar
            </Button>
          )}
        </div>
      </form>
    </Card>
  );
}
