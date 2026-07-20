import { useState } from 'react';
import { Button } from '../../components/ui/index.js';
import { api } from '../../services/api.js';
import { useToast } from '../../hooks/useToast.js';

export function UpdateForm({ onCreated }) {
  const [idea, setIdea] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const { showToast } = useToast();

  async function handleGenerate() {
    const trimmedIdea = idea.trim();
    if (!trimmedIdea) {
      setError('Descreva a ideia para gerar com IA');
      return;
    }

    setError('');
    setGenerating(true);
    try {
      const draft = await api.generateUpdateRequestDraft(trimmedIdea);
      setTitle(draft.title);
      setDescription(draft.description);
    } catch (err) {
      setError(err.message);
      showToast(err.message, 'error');
    } finally {
      setGenerating(false);
    }
  }

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
      setIdea('');
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
        <label htmlFor="update-idea">Ideia rápida</label>
        <textarea
          id="update-idea"
          placeholder="Ex: botão de anexo do calendário está feio"
          value={idea}
          onChange={(event) => setIdea(event.target.value)}
        />
        <Button type="button" variant="secondary" loading={generating} onClick={handleGenerate}>
          Gerar com IA
        </Button>
      </div>
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
