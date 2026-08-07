import { useState } from 'react';
import { Button, Card, Field, Icon, IconButton, Modal, Pill } from '../../components/ui/index.js';
import { api } from '../../services/api.js';
import { useToast } from '../../hooks/useToast.js';
import { usePendingIds } from '../../hooks/usePendingIds.js';
import {
  formatDate,
  formatKm,
  categoryLabel,
  categoryIcon,
  maintenanceUrgency,
  recurrenceLabel,
  MAINTENANCE_CATEGORIES,
} from './vehicleUtils.js';

export function VehicleMaintenanceTab({ vehicle, maintenances, onChanged, onAdd, onEdit }) {
  const { showToast } = useToast();
  const { isPending, run } = usePendingIds();
  const [odometerInput, setOdometerInput] = useState(vehicle.currentOdometer);
  const [savingOdometer, setSavingOdometer] = useState(false);
  const [applyingPreset, setApplyingPreset] = useState(false);
  const [completingItem, setCompletingItem] = useState(null);
  const [completingOdometer, setCompletingOdometer] = useState(vehicle.currentOdometer);
  const [completingNotes, setCompletingNotes] = useState('');
  const [completing, setCompleting] = useState(false);

  const pending = maintenances
    .filter((item) => item.status === 'pendente')
    .map((item) => ({ item, urgency: maintenanceUrgency(item, vehicle.currentOdometer) }))
    .sort((a, b) => Number(b.urgency.overdue) - Number(a.urgency.overdue) || Number(b.urgency.urgent) - Number(a.urgency.urgent));
  const history = maintenances
    .filter((item) => item.status === 'concluido')
    .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));

  async function handleUpdateOdometer(event) {
    event.preventDefault();
    const value = Number(odometerInput);
    if (Number.isNaN(value) || value < vehicle.currentOdometer) {
      showToast('Informe um valor de odômetro válido', 'error');
      return;
    }
    setSavingOdometer(true);
    try {
      await api.updateVehicle(vehicle._id, { currentOdometer: value });
      await onChanged();
      showToast('Odômetro atualizado', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSavingOdometer(false);
    }
  }

  function handleStartComplete(item) {
    setCompletingItem(item);
    setCompletingOdometer(vehicle.currentOdometer);
    setCompletingNotes('');
  }

  async function handleConfirmComplete(event) {
    event.preventDefault();
    setCompleting(true);
    try {
      await api.completeVehicleMaintenance(completingItem._id, Number(completingOdometer), completingNotes.trim());
      await onChanged();
      showToast('Manutenção concluída', 'success');
      setCompletingItem(null);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setCompleting(false);
    }
  }

  async function handleDelete(item) {
    try {
      await run(item._id, () => api.deleteVehicleMaintenance(item._id));
      await onChanged();
      showToast('Manutenção removida', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  async function handleApplyPreset() {
    setApplyingPreset(true);
    try {
      const { created, skipped } = await api.applyVehicleMaintenancePreset(
        vehicle._id,
        'honda-cb-twister-250f-2019'
      );
      await onChanged();
      if (created.length === 0) {
        showToast('Esse checklist já estava todo aplicado', 'success');
      } else {
        showToast(
          `${created.length} manutenção${created.length > 1 ? 'ões' : ''} adicionada${created.length > 1 ? 's' : ''}` +
            (skipped.length ? ` · ${skipped.length} já existiam` : ''),
          'success'
        );
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setApplyingPreset(false);
    }
  }

  return (
    <div className="vehicle-maintenance-tab">
      <Card className="vehicle-odometer-card">
        <span className="vehicle-label-caps">Odômetro atual</span>
        <div className="vehicle-odometer-value">
          <Icon name="clock" />
          <strong>{formatKm(vehicle.currentOdometer)}</strong>
        </div>
        <form className="vehicle-odometer-form" onSubmit={handleUpdateOdometer}>
          <input
            type="number"
            min={vehicle.currentOdometer}
            value={odometerInput}
            onChange={(event) => setOdometerInput(event.target.value)}
          />
          <Button type="submit" variant="secondary" loading={savingOdometer}>
            Atualizar km
          </Button>
        </form>
      </Card>

      <div className="vehicle-section-header">
        <h3>Próximos serviços</h3>
        <div className="vehicle-section-header-actions">
          <Button variant="secondary" loading={applyingPreset} onClick={handleApplyPreset}>
            <Icon name="repeat" /> Checklist Honda CB Twister 250F
          </Button>
          <Button variant="primary" onClick={onAdd}>
            <Icon name="plus" /> Adicionar
          </Button>
        </div>
      </div>

      {pending.length === 0 ? (
        <p className="sidebar-empty">Nenhuma manutenção pendente 🎉</p>
      ) : (
        <div className="vehicle-maintenance-list">
          {pending.map(({ item, urgency }) => (
            <Card
              key={item._id}
              className={`vehicle-maintenance-item${urgency.overdue ? ' is-overdue' : urgency.urgent ? ' is-urgent' : ''}`}
            >
              <div className="vehicle-maintenance-item-main">
                <span className="vehicle-maintenance-icon">
                  <Icon name={categoryIcon(MAINTENANCE_CATEGORIES, item.category)} />
                </span>
                <div>
                  <strong>{item.title}</strong>
                  <span className="vehicle-maintenance-meta">
                    {categoryLabel(MAINTENANCE_CATEGORIES, item.category)} · {urgency.label}
                  </span>
                  {recurrenceLabel(item) && (
                    <Pill className="vehicle-recurrence-pill">
                      <Icon name="repeat" /> {recurrenceLabel(item)}
                    </Pill>
                  )}
                </div>
              </div>
              <div className="vehicle-maintenance-item-actions">
                <IconButton title="Editar" aria-label="Editar" onClick={() => onEdit(item)}>
                  <Icon name="edit" />
                </IconButton>
                <IconButton
                  title="Remover"
                  aria-label="Remover"
                  loading={isPending(item._id)}
                  onClick={() => handleDelete(item)}
                >
                  <Icon name="trash" />
                </IconButton>
                <Button variant="primary" onClick={() => handleStartComplete(item)}>
                  Concluir
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <h3 className="vehicle-section-header">Histórico</h3>
      {history.length === 0 ? (
        <p className="sidebar-empty">Nenhuma manutenção concluída ainda</p>
      ) : (
        <div className="vehicle-maintenance-list">
          {history.map((item) => (
            <Card key={item._id} className="vehicle-maintenance-item is-done">
              <div className="vehicle-maintenance-item-main">
                <span className="vehicle-maintenance-icon vehicle-maintenance-icon--done">
                  <Icon name="check-circle" />
                </span>
                <div>
                  <strong>{item.title}</strong>
                  <span className="vehicle-maintenance-meta">
                    Concluída em {formatDate(item.completedAt)}
                    {item.completedOdometer != null ? ` · ${formatKm(item.completedOdometer)}` : ''}
                  </span>
                  {item.notes && <p className="vehicle-maintenance-notes">{item.notes}</p>}
                </div>
              </div>
              <div className="vehicle-maintenance-item-actions">
                {item.cost != null && <Pill className="vehicle-cost-pill">R$ {item.cost.toFixed(2)}</Pill>}
                <IconButton title="Editar anotação" aria-label="Editar anotação" onClick={() => onEdit(item)}>
                  <Icon name="edit" />
                </IconButton>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={Boolean(completingItem)} onClose={() => setCompletingItem(null)} title="Concluir manutenção">
        {completingItem && (
          <form className="vehicle-form" onSubmit={handleConfirmComplete}>
            <p className="vehicle-modal-subtitle">{completingItem.title}</p>
            <Field label="Odômetro na conclusão" htmlFor="complete-odometer">
              <input
                id="complete-odometer"
                type="number"
                min={0}
                value={completingOdometer}
                onChange={(event) => setCompletingOdometer(event.target.value)}
              />
            </Field>
            <Field
              label="Observação (opcional)"
              htmlFor="complete-notes"
              hint="Algo que percebeu e vale revisar depois — fica registrado no histórico"
            >
              <textarea
                id="complete-notes"
                maxLength={500}
                rows={3}
                value={completingNotes}
                onChange={(event) => setCompletingNotes(event.target.value)}
                placeholder="Ex: pastilha de freio já fina, olhar na próxima"
              />
            </Field>
            <div className="vehicle-form-actions">
              <Button type="button" variant="secondary" onClick={() => setCompletingItem(null)}>
                Cancelar
              </Button>
              <Button type="submit" loading={completing}>
                Concluir
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
