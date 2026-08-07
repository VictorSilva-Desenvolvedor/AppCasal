import { useState } from 'react';
import { Field, Button } from '../../components/ui/index.js';
import { api } from '../../services/api.js';
import { useToast } from '../../hooks/useToast.js';
import { MAINTENANCE_CATEGORIES } from './vehicleUtils.js';

export function VehicleMaintenanceForm({ vehicleId, editingItem, onSaved, onCancel }) {
  const { showToast } = useToast();
  const [title, setTitle] = useState(editingItem?.title || '');
  const [category, setCategory] = useState(editingItem?.category || 'revisao');
  const [dueDate, setDueDate] = useState(editingItem?.dueDate ? editingItem.dueDate.slice(0, 10) : '');
  const [dueOdometer, setDueOdometer] = useState(editingItem?.dueOdometer ?? '');
  const [cost, setCost] = useState(editingItem?.cost ?? '');
  const [notes, setNotes] = useState(editingItem?.notes || '');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      showToast('Dê um título à manutenção', 'error');
      return;
    }
    if (!dueDate && dueOdometer === '') {
      showToast('Defina um prazo por data ou por km', 'error');
      return;
    }

    const payload = {
      vehicle: vehicleId,
      title: trimmedTitle,
      category,
      dueDate: dueDate || null,
      dueOdometer: dueOdometer === '' ? null : Number(dueOdometer),
      cost: cost === '' ? null : Number(cost),
      notes: notes.trim(),
    };

    setSaving(true);
    try {
      const item = editingItem
        ? await api.updateVehicleMaintenance(editingItem._id, payload)
        : await api.createVehicleMaintenance(payload);
      showToast(editingItem ? 'Manutenção atualizada' : 'Manutenção agendada', 'success');
      onSaved(item);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="vehicle-form" onSubmit={handleSubmit}>
      <Field label="Título" htmlFor="maintenance-title">
        <input
          id="maintenance-title"
          type="text"
          maxLength={100}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Ex: Troca de óleo"
          autoFocus
        />
      </Field>

      <Field label="Categoria">
        <div className="vehicle-category-toggle">
          {MAINTENANCE_CATEGORIES.map((option) => (
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
        <Field label="Vencimento por data (opcional)" htmlFor="maintenance-due-date">
          <input
            id="maintenance-due-date"
            type="date"
            value={dueDate}
            onChange={(event) => setDueDate(event.target.value)}
          />
        </Field>
        <Field label="Vencimento por km (opcional)" htmlFor="maintenance-due-km">
          <input
            id="maintenance-due-km"
            type="number"
            min={0}
            value={dueOdometer}
            onChange={(event) => setDueOdometer(event.target.value)}
            placeholder="Ex: 15000"
          />
        </Field>
      </div>

      <Field label="Custo estimado (opcional)" htmlFor="maintenance-cost">
        <input
          id="maintenance-cost"
          type="number"
          min={0}
          step="0.01"
          value={cost}
          onChange={(event) => setCost(event.target.value)}
        />
      </Field>

      <Field label="Notas (opcional)" htmlFor="maintenance-notes">
        <textarea
          id="maintenance-notes"
          maxLength={500}
          rows={3}
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
        />
      </Field>

      <div className="vehicle-form-actions">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" loading={saving}>
          {editingItem ? 'Salvar' : 'Agendar'}
        </Button>
      </div>
    </form>
  );
}
