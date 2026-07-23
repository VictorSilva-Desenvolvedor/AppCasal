import { useEffect, useMemo, useState } from 'react';
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
  nature: 'unica',
  wishType: '',
  reason: '',
  sharedWith: '',
  splitAmount: '',
};

export function FinanceEntryForm({ categories, users, monthLocked, editingEntry, forcedType, onSaved, onCancelEdit }) {
  const { user } = useAuth();
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [removeImage, setRemoveImage] = useState(false);
  const { showToast } = useToast();

  const existingImage = editingEntry?.image || null;
  const imagePreviewUrl = useMemo(() => (imageFile ? URL.createObjectURL(imageFile) : null), [imageFile]);

  useEffect(() => {
    return () => {
      if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    };
  }, [imagePreviewUrl]);

  useEffect(() => {
    setImageFile(null);
    setRemoveImage(false);
    if (editingEntry) {
      setForm({
        type: editingEntry.type,
        description: editingEntry.description,
        amount: String(editingEntry.amount),
        category: editingEntry.category?._id || '',
        date: toDateInputValue(editingEntry.date),
        paidAmount: editingEntry.paidAmount ? String(editingEntry.paidAmount) : '',
        nature: editingEntry.nature || 'unica',
        wishType: editingEntry.wishType || '',
        reason: editingEntry.reason || '',
        sharedWith: editingEntry.sharedWith?._id || '',
        splitAmount: editingEntry.splitAmount ? String(editingEntry.splitAmount) : '',
      });
    } else {
      setForm({ ...EMPTY_FORM, type: forcedType || 'despesa' });
    }
  }, [editingEntry, forcedType, user]);

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

    setSaving(true);
    try {
      let image = removeImage ? null : existingImage;
      if (imageFile) {
        image = await api.uploadFile(imageFile);
      }

      const payload = {
        type: form.type,
        description: form.description.trim(),
        amount: Number(form.amount),
        category: form.category,
        date: form.date,
        paidAmount: form.paidAmount ? Number(form.paidAmount) : 0,
        nature: form.type === 'despesa' ? form.nature : 'unica',
        wishType: form.wishType || null,
        reason: form.reason,
        image,
        sharedWith: form.sharedWith || null,
        splitAmount: form.sharedWith ? Number(form.splitAmount) : null,
      };

      if (editingEntry) {
        await api.updateFinanceEntry(editingEntry._id, payload);
        showToast('Lançamento atualizado', 'success');
        onCancelEdit();
      } else {
        await api.createFinanceEntry(payload);
        showToast('Lançamento criado', 'success');
      }
      setForm({ ...EMPTY_FORM, type: forcedType || 'despesa' });
      setImageFile(null);
      setRemoveImage(false);
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
      {!forcedType && (
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
      )}

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
          <Field label="Natureza da despesa" htmlFor="finance-nature">
            <select id="finance-nature" value={form.nature} onChange={(event) => update('nature', event.target.value)}>
              <option value="unica">Única</option>
              <option value="fixa">Fixa (repete todo mês)</option>
              <option value="com_prazo">Com prazo</option>
              <option value="a_decidir">A decidir</option>
            </select>
          </Field>
        </div>
      )}

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

      {form.type === 'despesa' && form.wishType && (
        <Field label="Imagem (opcional)" htmlFor="finance-image">
          <input
            id="finance-image"
            type="file"
            accept="image/*"
            onChange={(event) => {
              setImageFile(event.target.files[0] || null);
              setRemoveImage(false);
            }}
          />
          {(imagePreviewUrl || (existingImage && !removeImage)) && (
            <div className="finance-image-field-preview">
              <img
                className="finance-entry-thumb"
                src={imagePreviewUrl || existingImage.url}
                alt={existingImage?.name || 'Imagem'}
              />
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setImageFile(null);
                  setRemoveImage(true);
                }}
              >
                Remover imagem
              </Button>
            </div>
          )}
        </Field>
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
