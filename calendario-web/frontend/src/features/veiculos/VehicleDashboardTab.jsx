import { Button, Card, Icon } from '../../components/ui/index.js';
import { formatCurrency, formatKm, paymentDueInfo, vehicleHealthPercent } from './vehicleUtils.js';

const RING_RADIUS = 45;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

export function VehicleDashboardTab({ vehicle, maintenances, payments, onGoToMaintenance, onGoToPayments }) {
  const nextPayment = payments
    .filter((item) => item.status === 'pendente')
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))[0];

  const pendingMaintenanceCount = maintenances.filter((item) => item.status === 'pendente').length;
  const health = vehicleHealthPercent(maintenances, vehicle.currentOdometer);
  const ringOffset = RING_CIRCUMFERENCE * (1 - health / 100);

  return (
    <div className="vehicle-dashboard-tab">
      {vehicle.photoUrl && (
        <div className="vehicle-photo-hero">
          <img src={vehicle.photoUrl} alt={vehicle.name} />
        </div>
      )}

      <Card className="vehicle-hero-card">
        <span className="vehicle-label-caps">Odômetro atual</span>
        <div className="vehicle-hero-odometer">
          <Icon name="tool" />
          <strong>{formatKm(vehicle.currentOdometer)}</strong>
        </div>
        {(vehicle.brand || vehicle.model || vehicle.plate) && (
          <p className="vehicle-hero-subtitle">
            {[vehicle.brand, vehicle.model].filter(Boolean).join(' ')}
            {vehicle.plate ? ` · ${vehicle.plate}` : ''}
          </p>
        )}
      </Card>

      <div className="vehicle-dashboard-grid">
        <Card className="vehicle-dashboard-card">
          <span className="vehicle-label-caps">Próximo pagamento</span>
          {nextPayment ? (
            <>
              <strong className="vehicle-dashboard-card-value">{formatCurrency(nextPayment.amount)}</strong>
              <span className={`vehicle-due-pill${paymentDueInfo(nextPayment).urgent ? ' is-urgent' : ''}`}>
                <Icon name="alert-circle" /> {paymentDueInfo(nextPayment).label}
              </span>
              <Button variant="primary" block onClick={onGoToPayments}>
                Ver pagamentos
              </Button>
            </>
          ) : (
            <>
              <p className="sidebar-empty">Nenhum pagamento pendente 🎉</p>
              <Button variant="secondary" block onClick={onGoToPayments}>
                Ver pagamentos
              </Button>
            </>
          )}
        </Card>

        <Card className="vehicle-dashboard-card vehicle-health-card">
          <div className="vehicle-health-ring">
            <svg viewBox="0 0 100 100">
              <circle className="vehicle-health-ring-track" cx="50" cy="50" r={RING_RADIUS} />
              <circle
                className={`vehicle-health-ring-fill${health < 60 ? ' is-low' : ''}`}
                cx="50"
                cy="50"
                r={RING_RADIUS}
                strokeDasharray={RING_CIRCUMFERENCE}
                strokeDashoffset={ringOffset}
              />
            </svg>
            <span className="vehicle-health-ring-value">{health}%</span>
          </div>
          <div>
            <span className="vehicle-label-caps">Saúde do veículo</span>
            <p className="vehicle-health-hint">
              {pendingMaintenanceCount === 0
                ? 'Tudo em dia, sem manutenções pendentes.'
                : `${pendingMaintenanceCount} manutenção${pendingMaintenanceCount > 1 ? 'ões' : ''} pendente${pendingMaintenanceCount > 1 ? 's' : ''}.`}
            </p>
            <Button variant="secondary" block onClick={onGoToMaintenance}>
              Ver manutenção
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
