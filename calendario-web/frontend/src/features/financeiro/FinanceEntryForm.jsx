import { useEffect, useState } from 'react';
import { Button, Field } from '../../components/ui/index.js';
import { api } from '../../services/api.js';
import { useAuth } from '../../hooks/useAuth.js';
import { useToast } from '../../hooks/useToast.js';

function toDateInputValue(date) {
  return new Date(date).toISOString().slice(0, 10);
}

const EMPTY_FORM = {
  type: 'despesa',
  description: '',
  amount: '',
  category: '',
  date: toDateInputValue(new Date()),
  paidAmount: '',
  wishType: '',
  reason: '',
  sharedWith: '',
  splitAmount: '',
};

export function FinanceEntryForm({ categories, users, monthLocked, editingEntry, onSaved, onCancelEdit }) {
  const { user } = useAuth();
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (editingEntry) {
      setForm({
        type: editingEntry.type,
        description: editingEntry.description,
        amount: String(editingEntry.amount),
        category: editingEntry.category?._id || '',
        date: toDateInputValue(editingEntry.date),
        paidAmount: editingEntry.paidAmount ? String(editingEntry.paidAmount) : '',
        wishType: editingEntry.wishType || '',
        reason: editingEntry.reason || '',
        sharedWith: editingEntry.sharedWith?._id || '',
        splitAmount: editingEntry.splitAmount ? String(editingEntry.splitAmount) : '',
      });
    } else {
      setForm(EMPTY_FORM);
    }
  }, [editingEntry, user]);

  const filteredCategories = categories.filter((category) => category.type === form.type);
  const otherUsers = users.filter((u) => u._id !== user?._id);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    if (!form.description.trim() || !form.amount || !form.category || !form.date) {
      setError('Preencha descrição, valor, categoria e data');
      return;
    }
    if (form.sharedWith && !form.splitAmount) {
      setError('Informe o valor que a outra pessoa deve ao compartilhar a despesa');
      return;
    }

    const payload = {
      type: form.type,
      description: form.description.trim(),
      amount: Number(form.amount),
      category: form.category,
      date: form.date,
      paidAmount: form.paidAmount ? Number(form.paidAmount) : 0,
      wishType: form.wishType || null,
      reason: form.reason,
      sharedWith: form.sharedWith || null,
      splitAmount: form.sharedWith ? Number(form.splitAmount) : null,
    };

    setSaving(true);
    try {
      if (editingEntry) {
        await api.updateFinanceEntry(editingEntry._id, payload);
        showToast('Lançamento atualizado', 'success');
        onCancelEdit();
      } else {
        await api.createFinanceEntry(payload);
        showToast('Lançamento criado', 'success');
      }
      setForm(EMPTY_FORM);
      await onSaved();
    } catch (err) {
      setError(err.message);
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="card finance-entry-form" onSubmit={handleSubmit}>
      <div className="finance-type-toggle">
        <button
          type="button"
          className={`finance-type-toggle-btn${form.type === 'despesa' ? ' is-active' : ''}`}
          onClick={() => update('type', 'despesa')}
        >
          Despesa
        </button>
        <button
          type="button"
          className={`finance-type-toggle-btn${form.type === 'receita' ? ' is-active' : ''}`}
          onClick={() => update('type', 'receita')}
        >
          Receita
        </button>
      </div>

      <Field label="Descrição" htmlFor="finance-description">
        <input
          id="finance-description"
          type="text"
          placeholder="Ex: Internet, Salário..."
          value={form.description}
          onChange={(event) => update('description', event.target.value)}
        />
      </Field>

      <div className="finance-form-row">
        <Field label="Valor" htmlFor="finance-amount">
          <input
            id="finance-amount"
            type="number"
            min="0"
            step="0.01"
            value={form.amount}
            onChange={(event) => update('amount', event.target.value)}
          />
        </Field>
        <Field label="Data" htmlFor="finance-date">
          <input
            id="finance-date"
            type="date"
            value={form.date}
            onChange={(event) => update('date', event.target.value)}
          />
        </Field>
      </div>

      <div className="finance-form-row">
        <Field label="Categoria" htmlFor="finance-category">
          <select id="finance-category" value={form.category} onChange={(event) => update('category', event.target.value)}>
            <option value="">Selecione</option>
            {filteredCategories.map((category) => (
              <option key={category._id} value={category._id}>
                {category.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Valor já pago" htmlFor="finance-paid">
          <input
            id="finance-paid"
            type="number"
            min="0"
            step="0.01"
            placeholder="0"
            value={form.paidAmount}
            onChange={(event) => update('paidAmount', event.target.value)}
          />
        </Field>
      </div>

      {form.type === 'despesa' && (
        <div className="finance-form-row">
          <Field label="Tipo (planejamento futuro)" htmlFor="finance-wish">
            <select id="finance-wish" value={form.wishType} onChange={(event) => update('wishType', event.target.value)}>
              <option value="">Conta do mês</option>
              <option value="necessidade">Necessidade futura</option>
              <option value="desejo">Desejo futuro</option>
            </select>
          </Field>
          {form.wishType && (
            <Field label="Por quê?" htmlFor="finance-reason">
              <input
                id="finance-reason"
                type="text"
                value={form.reason}
                onChange={(event) => update('reason', event.target.value)}
              />
            </Field>
          )}
        </div>
      )}

      <div className="finance-form-row">
        <Field label="Compartilhado com" htmlFor="finance-sharedwith">
          <select
            id="finance-sharedwith"
            value={form.sharedWith}
            onChange={(event) => update('sharedWith', event.target.value)}
          >
            <option value="">Não compartilhado</option>
            {otherUsers.map((u) => (
              <option key={u._id} value={u._id}>
                {u.name}
              </option>
            ))}
          </select>
        </Field>
      </div>

      {form.sharedWith && (
        <Field label="Valor que essa pessoa deve" htmlFor="finance-split">
          <input
            id="finance-split"
            type="number"
            min="0"
            step="0.01"
            value={form.splitAmount}
            onChange={(event) => update('splitAmount', event.target.value)}
          />
        </Field>
      )}

      <p className="error-text">{error}</p>
      {monthLocked && <p className="error-text">Este mês está finalizado — reabra para lançar ou editar.</p>}

      <div className="finance-form-actions">
        <Button type="submit" loading={saving} disabled={monthLocked}>
          {editingEntry ? 'Salvar alterações' : 'Adicionar lançamento'}
        </Button>
        {editingEntry && (
          <Button type="button" variant="secondary" onClick={onCancelEdit}>
            Cancelar
          </Button>
        )}
      </div>
    </form>
  );
}
