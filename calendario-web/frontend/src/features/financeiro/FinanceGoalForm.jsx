import { useEffect, useState } from 'react';
import { Button, Card, Field } from '../../components/ui/index.js';
import { api } from '../../services/api.js';
import { useToast } from '../../hooks/useToast.js';

export function FinanceGoalForm({ onCreated }) {
  const [name, setName] = useState('');
  const [type, setType] = useState('poupanca');
  const [targetAmount, setTargetAmount] = useState('');
  const [totalInstallments, setTotalInstallments] = useState('');
  const [installmentAmount, setInstallmentAmount] = useState('');
  const [installmentAmountTouched, setInstallmentAmountTouched] = useState(false);
  const [paidInstallments, setPaidInstallments] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (installmentAmountTouched || !targetAmount || !totalInstallments) return;
    const computed = Number(targetAmount) / Number(totalInstallments);
    if (Number.isFinite(computed)) setInstallmentAmount(computed.toFixed(2));
  }, [targetAmount, totalInstallments, installmentAmountTouched]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    if (!name.trim() || !targetAmount) {
      setError('Informe nome e valor alvo');
      return;
    }

    setSaving(true);
    try {
      await api.createFinanceGoal({
        name: name.trim(),
        type,
        targetAmount: Number(targetAmount),
        totalInstallments: totalInstallments ? Number(totalInstallments) : null,
        installmentAmount: installmentAmount ? Number(installmentAmount) : null,
        paidInstallments: paidInstallments ? Number(paidInstallments) : 0,
        notes: notes.trim(),
      });
      setName('');
      setTargetAmount('');
      setTotalInstallments('');
      setInstallmentAmount('');
      setInstallmentAmountTouched(false);
      setPaidInstallments('');
      setNotes('');
      await onCreated();
      showToast('Objetivo criado', 'success');
    } catch (err) {
      setError(err.message);
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="finance-goal-form-card">
      <h3>Novo objetivo</h3>
      <form className="finance-goal-form" onSubmit={handleSubmit}>
        <Field label="Nome" htmlFor="goal-name">
          <input id="goal-name" type="text" value={name} onChange={(event) => setName(event.target.value)} />
        </Field>

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

        <Field label="Valor alvo" htmlFor="goal-target">
          <input
            id="goal-target"
            type="number"
            min="0"
            step="0.01"
            value={targetAmount}
            onChange={(event) => setTargetAmount(event.target.value)}
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
              value={totalInstallments}
              onChange={(event) => setTotalInstallments(event.target.value)}
            />
          </Field>
          <Field label="Valor da parcela (opcional)" htmlFor="goal-installment-amount">
            <input
              id="goal-installment-amount"
              type="number"
              min="0"
              step="0.01"
              value={installmentAmount}
              onChange={(event) => {
                setInstallmentAmountTouched(true);
                setInstallmentAmount(event.target.value);
              }}
            />
          </Field>
        </div>

        <Field label="Parcelas já pagas (opcional)" htmlFor="goal-paid-installments">
          <input
            id="goal-paid-installments"
            type="number"
            min="0"
            value={paidInstallments}
            onChange={(event) => setPaidInstallments(event.target.value)}
          />
        </Field>

        <Field label="Observações (opcional)" htmlFor="goal-notes">
          <input id="goal-notes" type="text" value={notes} onChange={(event) => setNotes(event.target.value)} />
        </Field>

        <p className="error-text">{error}</p>
        <Button type="submit" loading={saving}>
          Criar objetivo
        </Button>
      </form>
    </Card>
  );
}
