import { useState } from 'react';
import { Button } from '../../components/ui/index.js';
import { KIND_LABELS, KIND_ORDER, PERIOD_LABELS, PERIOD_ORDER, DEFAULT_PERIOD } from './tarefasUtils.js';

export function TarefaAddForm({ onAdd, targetName }) {
  const [title, setTitle] = useState('');
  const [kind, setKind] = useState('diaria');
  const [period, setPeriod] = useState(DEFAULT_PERIOD);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);
    try {
      await onAdd(title.trim(), kind, period);
      // Só limpa depois do sucesso: onAdd relança o erro justamente pra o texto
      // digitado sobreviver a uma falha de rede.
      setTitle('');
    } catch {
      // o erro já virou toast em quem chamou
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="tarefa-add-bar">
      {targetName && <p className="tarefa-add-target">Adicionando na lista de {targetName}</p>}
      <form className="tarefa-add-form" onSubmit={handleSubmit}>
        <select aria-label="Tipo da tarefa" value={kind} onChange={(e) => setKind(e.target.value)}>
          {KIND_ORDER.map((k) => (
            <option key={k} value={k}>
              {KIND_LABELS[k]}
            </option>
          ))}
        </select>
        {/* Período só existe dentro das diárias — nos outros tipos o seletor
            sairia sobrando e o backend ignoraria o valor de qualquer jeito. */}
        {kind === 'diaria' && (
          <select aria-label="Período do dia" value={period} onChange={(e) => setPeriod(e.target.value)}>
            {PERIOD_ORDER.map((p) => (
              <option key={p} value={p}>
                {PERIOD_LABELS[p]}
              </option>
            ))}
          </select>
        )}
        <input
          type="text"
          aria-label="Título da nova tarefa"
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
