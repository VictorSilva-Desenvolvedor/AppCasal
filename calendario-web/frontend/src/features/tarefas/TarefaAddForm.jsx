import { useState } from 'react';
import { Button } from '../../components/ui/index.js';
import { KIND_LABELS, KIND_ORDER } from './tarefasUtils.js';

export function TarefaAddForm({ onAdd }) {
  const [title, setTitle] = useState('');
  const [kind, setKind] = useState('diaria');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);
    try {
      await onAdd(title.trim(), kind);
      setTitle('');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="tarefa-add-bar">
      <form className="tarefa-add-form" onSubmit={handleSubmit}>
        <select value={kind} onChange={(e) => setKind(e.target.value)}>
          {KIND_ORDER.map((k) => (
            <option key={k} value={k}>
              {KIND_LABELS[k]}
            </option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Nova tarefa..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={120}
        />
        <Button type="submit" loading={submitting}>
          Adicionar
        </Button>
      </form>
    </div>
  );
}
