import { useState } from 'react';
import { Button, Field } from '../../components/ui/index.js';
import { KIND_LABELS, KIND_ORDER, PERIOD_LABELS, PERIOD_ORDER, DEFAULT_PERIOD } from './tarefasUtils.js';

// Substitui a barra sticky do rodapé, que espremia dois <select> nativos e um
// input numa linha só e quebrava feio no celular. Aqui cada escolha é um botão
// de verdade, com alvo de toque decente.
export function TarefaFormModal({ me, partner, defaultBelongsTo, defaultKind, defaultPeriod, onAdd, onClose }) {
  const [title, setTitle] = useState('');
  const [kind, setKind] = useState(defaultKind ?? 'diaria');
  const [period, setPeriod] = useState(defaultPeriod ?? DEFAULT_PERIOD);
  const [belongsTo, setBelongsTo] = useState(defaultBelongsTo ?? me._id);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    try {
      await onAdd({ title: title.trim(), kind, period, belongsTo });
      onClose();
    } catch {
      // onAdd relança depois de mostrar o toast — o modal fica aberto com o
      // que foi digitado, em vez de fechar e perder o texto.
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="tarefa-form" onSubmit={handleSubmit}>
      <Field label="O que precisa ser feito?" htmlFor="tarefa-titulo">
        <input
          id="tarefa-titulo"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ex.: escovar os dentes"
          maxLength={120}
          autoFocus
        />
      </Field>

      <Field label="Com que frequência?">
        <div className="tarefa-toggle">
          {KIND_ORDER.map((k) => (
            <button
              key={k}
              type="button"
              className={`tarefa-toggle-btn${kind === k ? ' is-active' : ''}`}
              style={{ '--toggle-color': `var(--tarefas-${k})` }}
              aria-pressed={kind === k}
              onClick={() => setKind(k)}
            >
              {KIND_LABELS[k]}
            </button>
          ))}
        </div>
      </Field>

      {kind === 'diaria' && (
        <Field label="Em que parte do dia?">
          <div className="tarefa-toggle">
            {PERIOD_ORDER.map((p) => (
              <button
                key={p}
                type="button"
                className={`tarefa-toggle-btn${period === p ? ' is-active' : ''}`}
                aria-pressed={period === p}
                onClick={() => setPeriod(p)}
              >
                {PERIOD_LABELS[p]}
              </button>
            ))}
          </div>
        </Field>
      )}

      {partner && (
        <Field label="Na lista de quem?">
          <div className="tarefa-toggle">
            <button
              type="button"
              className={`tarefa-toggle-btn${belongsTo === me._id ? ' is-active' : ''}`}
              aria-pressed={belongsTo === me._id}
              onClick={() => setBelongsTo(me._id)}
            >
              Minha
            </button>
            <button
              type="button"
              className={`tarefa-toggle-btn${belongsTo === partner._id ? ' is-active' : ''}`}
              aria-pressed={belongsTo === partner._id}
              onClick={() => setBelongsTo(partner._id)}
            >
              {partner.name}
            </button>
          </div>
        </Field>
      )}

      <div className="modal-actions">
        <Button type="button" variant="secondary" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit" loading={saving} disabled={!title.trim()}>
          Adicionar
        </Button>
      </div>
    </form>
  );
}
