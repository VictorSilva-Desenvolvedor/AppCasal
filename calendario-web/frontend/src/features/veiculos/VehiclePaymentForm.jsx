import { useState } from 'react';
import { Field, Button } from '../../components/ui/index.js';
import { api } from '../../services/api.js';
import { useToast } from '../../hooks/useToast.js';
import { PAYMENT_CATEGORIES } from './vehicleUtils.js';

export function VehiclePaymentForm({ vehicleId, editingItem, onSaved, onCancel }) {
  const { showToast } = useToast();
  const [description, setDescription] = useState(editingItem?.description || '');
  const [category, setCategory] = useState(editingItem?.category || 'outros');
  const [amount, setAmount] = useState(editingItem?.amount ?? '');
  const [dueDate, setDueDate] = useState(editingItem?.dueDate ? editingItem.dueDate.slice(0, 10) : '');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    const trimmedDescription = description.trim();
    if (!trimmedDescription || amount === '' || !dueDate) {
      showToast('Preencha descrição, valor e vencimento', 'error');
      return;
    }

    const payload = {
      vehicle: vehicleId,
      description: trimmedDescription,
      category,
      amount: Number(amount),
      dueDate,
    };

    setSaving(true);
    try {
      const item = editingItem
        ? await api.updateVehiclePayment(editingItem._id, payload)
        : await api.createVehiclePayment(payload);
      showToast(editingItem ? 'Pagamento atualizado' : 'Pagamento adicionado', 'success');
      onSaved(item);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="vehicle-form" onSubmit={handleSubmit}>
      <Field label="Descrição" htmlFor="payment-description">
        <input
          id="payment-description"
          type="text"
          maxLength={100}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Ex: IPVA 2026"
          autoFocus
        />
      </Field>

      <Field label="Categoria">
        <div className="vehicle-category-toggle">
          {PAYMENT_CATEGORIES.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`vehicle-category-toggle-btn${category === option.value ? ' is-active' : ''}`}
              onClick={() => setCategory(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </Field>

      <div className="vehicle-form-row">
        <Field label="Valor" htmlFor="payment-amount">
          <input
            id="payment-amount"
            type="number"
            min={0}
            step="0.01"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
          />
        </Field>
        <Field label="Vencimento" htmlFor="payment-due-date">
          <input
            id="payment-due-date"
            type="date"
            value={dueDate}
            onChange={(event) => setDueDate(event.target.value)}
          />
        </Field>
      </div>

      <div className="vehicle-form-actions">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" loading={saving}>
          {editingItem ? 'Salvar' : 'Adicionar'}
        </Button>
      </div>
    </form>
  );
}
