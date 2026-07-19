import { useState } from 'react';
import { Button } from '../../components/ui/index.js';
import { api } from '../../services/api.js';
import { useToast } from '../../hooks/useToast.js';

export function UpdateForm({ onCreated }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError('Informe um título para o pedido');
      return;
    }

    setSaving(true);
    try {
      await api.createUpdateRequest({ title: trimmedTitle, description: description.trim() });
      setTitle('');
      setDescription('');
      await onCreated();
      showToast('Pedido enviado', 'success');
    } catch (err) {
      setError(err.message);
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="card update-form" onSubmit={handleSubmit}>
      <div className="field">
        <label htmlFor="update-title">Título</label>
        <input
          type="text"
          id="update-title"
          required
          placeholder="Ex: mostrar o clima no dia"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
      </div>
      <div className="field">
        <label htmlFor="update-description">Descrição (opcional)</label>
        <textarea
          id="update-description"
          placeholder="Detalhe o que você quer, se precisar"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
      </div>
      <p className="error-text">{error}</p>
      <Button type="submit" loading={saving}>
        Pedir atualização
      </Button>
    </form>
  );
}
