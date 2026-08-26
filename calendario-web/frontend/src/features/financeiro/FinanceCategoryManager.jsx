import { useState } from 'react';
import { Button, Card, ConfirmDialog, IconButton, Icon } from '../../components/ui/index.js';
import { api } from '../../services/api.js';
import { useToast } from '../../hooks/useToast.js';
import { usePendingIds } from '../../hooks/usePendingIds.js';

export function FinanceCategoryManager({ categories, onChanged }) {
  const [expanded, setExpanded] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState('despesa');
  const [color, setColor] = useState('#64748b');
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const { showToast } = useToast();
  const { isPending, run } = usePendingIds();

  async function handleSubmit(event) {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;

    setSaving(true);
    try {
      await api.createFinanceCategory({ name: trimmed, type, color });
      setName('');
      await onChanged();
      showToast('Categoria criada', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleConfirmDelete() {
    const id = deleteTarget._id;
    setDeleteTarget(null);
    try {
      await run(id, () => api.deleteFinanceCategory(id));
      await onChanged();
      showToast('Categoria excluída', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  return (
    <Card className="finance-category-manager">
      <button type="button" className="finance-collapsible-toggle" onClick={() => setExpanded((v) => !v)}>
        <Icon name={expanded ? 'chevron-left' : 'chevron-right'} />
        Categorias
      </button>

      {expanded && (
        <div className="finance-category-manager-body">
          <ul className="finance-category-chip-list">
            {categories.map((category) => (
              <li key={category._id} className="finance-category-chip">
                <span className="finance-category-chip-dot" style={{ background: category.color }} />
                {category.name}
                <span className="finance-category-chip-type">{category.type === 'receita' ? 'receita' : 'despesa'}</span>
                <IconButton
                  onClick={() => setDeleteTarget(category)}
                  title="Excluir categoria"
                  loading={isPending(category._id)}
                >
                  <Icon name="trash" />
                </IconButton>
              </li>
            ))}
          </ul>

          <form className="finance-category-form" onSubmit={handleSubmit}>
            <input
              type="text"
              placeholder="Nova categoria"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
            <select value={type} onChange={(event) => setType(event.target.value)}>
              <option value="despesa">Despesa</option>
              <option value="receita">Receita</option>
            </select>
            <input type="color" value={color} onChange={(event) => setColor(event.target.value)} />
            <Button type="submit" variant="secondary" loading={saving}>
              Adicionar
            </Button>
          </form>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Excluir categoria"
        message={
          deleteTarget
            ? `A categoria "${deleteTarget.name}" será removida. Os lançamentos que usam ela ficam sem categoria.`
            : ''
        }
        confirmLabel="Excluir"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
      />
    </Card>
  );
}
