import { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Field } from '../../components/ui/index.js';
import { api } from '../../services/api.js';
import { useAuth } from '../../hooks/useAuth.js';
import { useToast } from '../../hooks/useToast.js';
import { dateOnlyKey, localDateKey } from '../../lib/dateOnly.js';
import { parseMoneyInput } from './financeUtils.js';

// Data de vencimento vinda da API é dia inteiro (meia-noite UTC) e se lê em UTC;
// o "hoje" do usuário é local. Misturar os dois (o antigo toISOString em cima de
// `new Date()`) fazia o campo abrir com um dia de diferença à noite.

const EMPTY_FORM = {
  type: 'despesa',
  description: '',
  amount: '',
  category: '',
  date: localDateKey(new Date()),
  paidAmount: '',
  nature: 'unica',
  wishType: '',
  reason: '',
  linkedGoal: '',
  sharedWith: '',
  splitAmount: '',
};

export function FinanceEntryForm({
  categories,
  users,
  goals = [],
  monthLocked,
  editingEntry,
  forcedType,
  forcedWishType,
  onSaved,
  onCancelEdit,
}) {
  const { user } = useAuth();
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');
  const [invalidFields, setInvalidFields] = useState([]);
  const [moreOpen, setMoreOpen] = useState(false);
  const formRef = useRef(null);
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
        date: dateOnlyKey(editingEntry.date),
        paidAmount: editingEntry.paidAmount ? String(editingEntry.paidAmount) : '',
        nature: editingEntry.nature || 'unica',
        wishType: editingEntry.wishType || '',
        reason: editingEntry.reason || '',
        linkedGoal: editingEntry.linkedGoal?._id || '',
        sharedWith: editingEntry.sharedWith?._id || '',
        splitAmount: editingEntry.splitAmount ? String(editingEntry.splitAmount) : '',
      });
      setMoreOpen(
        Boolean(
          editingEntry.paidAmount ||
            (editingEntry.nature && editingEntry.nature !== 'unica') ||
            editingEntry.wishType ||
            editingEntry.linkedGoal ||
            editingEntry.sharedWith
        )
      );
    } else {
      setMoreOpen(Boolean(forcedWishType));
      setForm({ ...EMPTY_FORM, type: forcedType || 'despesa', wishType: forcedWishType || '' });
    }
  }, [editingEntry, forcedType, forcedWishType, user]);

  const filteredCategories = categories.filter((category) => category.type === form.type);
  const otherUsers = users.filter((u) => u._id !== user?._id);

  // Mapeia o campo do form pro id do input, pra limpar a marca de inválido
  // assim que a pessoa corrige (antes ficava vermelho até o próximo envio).
  const FIELD_IDS = {
    description: 'finance-description',
    amount: 'finance-amount',
    date: 'finance-date',
    category: 'finance-category',
    paidAmount: 'finance-paid',
    splitAmount: 'finance-split',
  };

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    const fieldId = FIELD_IDS[field];
    if (fieldId && invalidFields.includes(fieldId)) {
      const remaining = invalidFields.filter((id) => id !== fieldId);
      setInvalidFields(remaining);
      // Tudo corrigido: a mensagem também sai (antes ficava até o próximo envio).
      if (remaining.length === 0) setError('');
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    // Diz exatamente o que falta e leva o foco ao primeiro campo — a mensagem
    // genérica deixava a pessoa caçando o campo.
    const amount = parseMoneyInput(form.amount);
    const paidAmount = form.paidAmount ? parseMoneyInput(form.paidAmount) : 0;
    const splitAmount = form.sharedWith ? parseMoneyInput(form.splitAmount) : null;
    const checks = [
      ['finance-description', 'escreva a descrição', !form.description.trim()],
      ['finance-amount', 'informe o valor', !(amount > 0)],
      ['finance-date', 'escolha a data', !form.date],
      ['finance-category', 'escolha a categoria', !form.category],
      ['finance-paid', 'corrija o valor já pago', Number.isNaN(paidAmount) || paidAmount < 0],
      ['finance-split', 'informe quanto a outra pessoa deve', form.sharedWith && !(splitAmount > 0)],
    ].filter(([, , failed]) => failed);

    if (checks.length) {
      const fieldIds = checks.map(([id]) => id);
      setInvalidFields(fieldIds);
      // Campo inválido escondido em "Mais opções": abre para a pessoa ver.
      if (fieldIds.some((id) => id === 'finance-paid' || id === 'finance-split')) setMoreOpen(true);
      setError(
        !form.category && !filteredCategories.length
          ? 'Nenhuma categoria cadastrada. Crie uma no botão "Categorias", acima da lista de lançamentos.'
          : `Para salvar, ${checks.map(([, action]) => action).join(', ')}.`
      );
      formRef.current?.querySelector(`#${fieldIds[0]}`)?.focus();
      return;
    }
    setInvalidFields([]);

    setSaving(true);
    try {
      let image = removeImage ? null : existingImage;
      if (imageFile) {
        image = await api.uploadFile(imageFile);
      }

      const payload = {
        type: form.type,
        description: form.description.trim(),
        amount,
        category: form.category,
        date: form.date,
        paidAmount,
        nature: form.type === 'despesa' || form.nature === 'fixa' ? form.nature : 'unica',
        wishType: form.wishType || null,
        reason: form.reason,
        image,
        linkedGoal: form.linkedGoal || null,
        sharedWith: form.sharedWith || null,
        splitAmount,
      };

      if (editingEntry) {
        await api.updateFinanceEntry(editingEntry._id, payload);
        showToast('Lançamento atualizado', 'success');
        onCancelEdit();
      } else {
        await api.createFinanceEntry(payload);
        showToast('Lançamento criado', 'success');
      }
      setForm({ ...EMPTY_FORM, type: forcedType || 'despesa', wishType: forcedWishType || '' });
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
    <form ref={formRef} className="card finance-entry-form" onSubmit={handleSubmit} noValidate>
      {!forcedType && (
        <div className="finance-type-toggle">
          <button
            type="button"
            aria-pressed={form.type === 'despesa'}
            className={`finance-type-toggle-btn${form.type === 'despesa' ? ' is-active' : ''}`}
            onClick={() => update('type', 'despesa')}
          >
            Despesa
          </button>
          <button
            type="button"
            aria-pressed={form.type === 'receita'}
            className={`finance-type-toggle-btn${form.type === 'receita' ? ' is-active' : ''}`}
            onClick={() => update('type', 'receita')}
          >
            Receita
          </button>
        </div>
      )}

      <Field label="Descrição" htmlFor="finance-description" required>
        <input
          id="finance-description"
            aria-required="true"
          aria-invalid={invalidFields.includes('finance-description')}
          type="text"
          placeholder="Ex: Internet, Salário..."
          value={form.description}
          onChange={(event) => update('description', event.target.value)}
        />
      </Field>

      <div className="finance-form-row">
        <Field label="Valor" htmlFor="finance-amount" required>
          <input
            id="finance-amount"
            aria-required="true"
            aria-invalid={invalidFields.includes('finance-amount')}
            type="text"
            inputMode="decimal"
            autoComplete="off"
            placeholder="0,00"
            value={form.amount}
            onChange={(event) => update('amount', event.target.value)}
          />
        </Field>
        <Field label="Data" htmlFor="finance-date" required>
          <input
            id="finance-date"
            aria-required="true"
            aria-invalid={invalidFields.includes('finance-date')}
            type="date"
            value={form.date}
            onChange={(event) => update('date', event.target.value)}
          />
        </Field>
      </div>

      <div className="finance-form-row">
        <Field label="Categoria" htmlFor="finance-category" required>
          <select
            id="finance-category"
            aria-required="true"
            aria-invalid={invalidFields.includes('finance-category')}
            value={form.category}
            onChange={(event) => update('category', event.target.value)}
          >
            <option value="">Selecione</option>
            {filteredCategories.map((category) => (
              <option key={category._id} value={category._id}>
                {category.name}
              </option>
            ))}
          </select>
        </Field>
      </div>

      {/* Só o essencial à vista (descrição, valor, data, categoria); o resto fica
          em "Mais opções" — os termos de planejamento confundiam quem só quer
          anotar um gasto (12 de 12 personas). */}
      <details className="more-options" open={moreOpen} onToggle={(e) => setMoreOpen(e.currentTarget.open)}>
        <summary>Mais opções</summary>
      <Field label="Valor já pago" htmlFor="finance-paid">
        <input
          id="finance-paid"
          aria-invalid={invalidFields.includes('finance-paid')}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          placeholder="0,00"
          value={form.paidAmount}
          onChange={(event) => update('paidAmount', event.target.value)}
        />
      </Field>
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

      {form.type === 'receita' && (
        <div className="finance-form-row">
          <Field label="Recorrência da receita" htmlFor="finance-income-nature">
            <select
              id="finance-income-nature"
              value={form.nature === 'fixa' ? 'fixa' : 'unica'}
              onChange={(event) => update('nature', event.target.value)}
            >
              <option value="unica">Única</option>
              <option value="fixa">Fixa (repete todo mês)</option>
            </select>
          </Field>
        </div>
      )}

      {form.type === 'despesa' && goals.length > 0 && (
        <div className="finance-form-row">
          <Field label="Vincular a objetivo (opcional)" htmlFor="finance-linked-goal">
            <select
              id="finance-linked-goal"
              value={form.linkedGoal}
              onChange={(event) => update('linkedGoal', event.target.value)}
            >
              <option value="">Nenhum</option>
              {goals.map((goal) => (
                <option key={goal._id} value={goal._id}>
                  {goal.name}
                </option>
              ))}
            </select>
          </Field>
        </div>
      )}

      {form.type === 'despesa' && (
        <div className="finance-form-row">
          {!forcedWishType && (
            <Field label="Tipo (planejamento futuro)" htmlFor="finance-wish">
              <select
                id="finance-wish"
                value={form.wishType}
                onChange={(event) => update('wishType', event.target.value)}
              >
                <option value="">Conta do mês</option>
                <option value="necessidade">Necessidade futura</option>
                <option value="desejo">Desejo futuro</option>
              </select>
            </Field>
          )}
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
            aria-invalid={invalidFields.includes('finance-split')}
            type="text"
            inputMode="decimal"
            autoComplete="off"
            value={form.splitAmount}
            onChange={(event) => update('splitAmount', event.target.value)}
          />
        </Field>
      )}

      </details>

      <p className="field-hint">* obrigatório</p>
      {error && (
        <p className="error-text" role="alert">
          {error}
        </p>
      )}
      {monthLocked && <p className="error-text">Este mês está finalizado — reabra para lançar ou editar.</p>}

      <div className="finance-form-actions">
        <Button type="submit" loading={saving} disabled={monthLocked}>
          {editingEntry ? 'Salvar alterações' : form.type === 'receita' ? 'Adicionar receita' : 'Adicionar despesa'}
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
