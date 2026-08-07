import { useState } from 'react';
import { Button, Card, Icon, IconButton, Pill } from '../../components/ui/index.js';
import { api } from '../../services/api.js';
import { useToast } from '../../hooks/useToast.js';
import { usePendingIds } from '../../hooks/usePendingIds.js';
import { formatDate, formatKm, categoryLabel, maintenanceUrgency, MAINTENANCE_CATEGORIES } from './vehicleUtils.js';

export function VehicleMaintenanceTab({ vehicle, maintenances, onChanged, onAdd, onEdit }) {
  const { showToast } = useToast();
  const { isPending, run } = usePendingIds();
  const [odometerInput, setOdometerInput] = useState(vehicle.currentOdometer);
  const [savingOdometer, setSavingOdometer] = useState(false);

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

  async function handleComplete(item) {
    try {
      await run(item._id, () => api.completeVehicleMaintenance(item._id, vehicle.currentOdometer));
      await onChanged();
      showToast('Manutenção concluída', 'success');
    } catch (err) {
      showToast(err.message, 'error');
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
        <Button variant="primary" onClick={onAdd}>
          <Icon name="plus" /> Adicionar
        </Button>
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
                  <Icon name="tool" />
                </span>
                <div>
                  <strong>{item.title}</strong>
                  <span className="vehicle-maintenance-meta">
                    {categoryLabel(MAINTENANCE_CATEGORIES, item.category)} · {urgency.label}
                  </span>
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
                <Button variant="primary" loading={isPending(item._id)} onClick={() => handleComplete(item)}>
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
                </div>
              </div>
              {item.cost != null && <Pill className="vehicle-cost-pill">R$ {item.cost.toFixed(2)}</Pill>}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
