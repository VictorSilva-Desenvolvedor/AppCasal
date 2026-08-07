import { useCallback, useEffect, useState } from 'react';
import { Button, HeartLoader, Icon, Modal } from '../../components/ui/index.js';
import { api } from '../../services/api.js';
import { useToast } from '../../hooks/useToast.js';
import { VehicleForm } from './VehicleForm.jsx';
import { VehicleDashboardTab } from './VehicleDashboardTab.jsx';
import { VehicleMaintenanceTab } from './VehicleMaintenanceTab.jsx';
import { VehicleMaintenanceForm } from './VehicleMaintenanceForm.jsx';
import { VehiclePaymentsTab } from './VehiclePaymentsTab.jsx';
import { VehiclePaymentForm } from './VehiclePaymentForm.jsx';

const TABS = [
  { value: 'dashboard', label: 'Dashboard' },
  { value: 'manutencao', label: 'Manutenção' },
  { value: 'pagamentos', label: 'Pagamentos' },
];

export function VeiculosPage() {
  const { showToast } = useToast();

  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState(null);
  const [maintenances, setMaintenances] = useState([]);
  const [payments, setPayments] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);

  const [addingVehicle, setAddingVehicle] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [addingMaintenance, setAddingMaintenance] = useState(false);
  const [editingMaintenance, setEditingMaintenance] = useState(null);
  const [addingPayment, setAddingPayment] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);

  const reloadVehicles = useCallback(async () => {
    const list = await api.getVehicles();
    setVehicles(list);
    return list;
  }, []);

  const reloadMaintenances = useCallback(async (vehicleId) => {
    if (!vehicleId) return setMaintenances([]);
    setMaintenances(await api.getVehicleMaintenances({ vehicle: vehicleId }));
  }, []);

  const reloadPayments = useCallback(async (vehicleId) => {
    if (!vehicleId) return setPayments([]);
    setPayments(await api.getVehiclePayments({ vehicle: vehicleId }));
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const list = await reloadVehicles();
        if (list.length) setSelectedVehicleId(list[0]._id);
      } catch (err) {
        showToast(err.message, 'error');
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedVehicleId) return;
    reloadMaintenances(selectedVehicleId);
    reloadPayments(selectedVehicleId);
  }, [selectedVehicleId, reloadMaintenances, reloadPayments]);

  if (loading) {
    return (
      <section className="view vehicle-page">
        <HeartLoader />
      </section>
    );
  }

  const selectedVehicle = vehicles.find((v) => v._id === selectedVehicleId) || null;

  async function handleVehicleSaved(vehicle) {
    const list = await reloadVehicles();
    setSelectedVehicleId(vehicle._id);
    setAddingVehicle(false);
    setEditingVehicle(null);
    return list;
  }

  async function handleMaintenanceSaved() {
    await reloadMaintenances(selectedVehicleId);
    setAddingMaintenance(false);
    setEditingMaintenance(null);
  }

  async function handlePaymentSaved() {
    await reloadPayments(selectedVehicleId);
    setAddingPayment(false);
    setEditingPayment(null);
  }

  return (
    <section className="view vehicle-page">
      <div className="vehicle-page-header">
        <div>
          <h2>Veículos</h2>
          <p>Manutenção, revisões e pagamentos dos seus veículos.</p>
        </div>
        <Button variant="secondary" onClick={() => setAddingVehicle(true)}>
          <Icon name="plus" /> Novo veículo
        </Button>
      </div>

      {vehicles.length === 0 ? (
        <div className="vehicle-empty-state">
          <Icon name="tool" />
          <p>Nenhum veículo cadastrado ainda.</p>
          <Button variant="primary" onClick={() => setAddingVehicle(true)}>
            Cadastrar veículo
          </Button>
        </div>
      ) : (
        <>
          {vehicles.length > 1 && (
            <div className="vehicle-selector">
              {vehicles.map((vehicle) => (
                <button
                  key={vehicle._id}
                  type="button"
                  className={`vehicle-selector-pill${vehicle._id === selectedVehicleId ? ' is-active' : ''}`}
                  onClick={() => setSelectedVehicleId(vehicle._id)}
                >
                  {vehicle.name}
                </button>
              ))}
            </div>
          )}

          {selectedVehicle && (
            <>
              <div className="vehicle-tabs">
                {TABS.map((tab) => (
                  <button
                    key={tab.value}
                    type="button"
                    className={`vehicle-tab-btn${activeTab === tab.value ? ' is-active' : ''}`}
                    onClick={() => setActiveTab(tab.value)}
                  >
                    {tab.label}
                  </button>
                ))}
                <button
                  type="button"
                  className="vehicle-tab-edit-btn"
                  title="Editar veículo"
                  aria-label="Editar veículo"
                  onClick={() => setEditingVehicle(selectedVehicle)}
                >
                  <Icon name="edit" />
                </button>
              </div>

              {activeTab === 'dashboard' && (
                <VehicleDashboardTab
                  vehicle={selectedVehicle}
                  maintenances={maintenances}
                  payments={payments}
                  onGoToMaintenance={() => setActiveTab('manutencao')}
                  onGoToPayments={() => setActiveTab('pagamentos')}
                />
              )}

              {activeTab === 'manutencao' && (
                <VehicleMaintenanceTab
                  vehicle={selectedVehicle}
                  maintenances={maintenances}
                  onChanged={async () => {
                    await Promise.all([reloadMaintenances(selectedVehicleId), reloadVehicles()]);
                  }}
                  onAdd={() => setAddingMaintenance(true)}
                  onEdit={setEditingMaintenance}
                />
              )}

              {activeTab === 'pagamentos' && (
                <VehiclePaymentsTab
                  payments={payments}
                  onChanged={() => reloadPayments(selectedVehicleId)}
                  onAdd={() => setAddingPayment(true)}
                  onEdit={setEditingPayment}
                />
              )}
            </>
          )}
        </>
      )}

      <Modal open={addingVehicle} onClose={() => setAddingVehicle(false)} title="Novo veículo">
        {addingVehicle && <VehicleForm onSaved={handleVehicleSaved} onCancel={() => setAddingVehicle(false)} />}
      </Modal>

      <Modal open={Boolean(editingVehicle)} onClose={() => setEditingVehicle(null)} title="Editar veículo">
        {editingVehicle && (
          <VehicleForm
            editingVehicle={editingVehicle}
            onSaved={handleVehicleSaved}
            onCancel={() => setEditingVehicle(null)}
          />
        )}
      </Modal>

      <Modal open={addingMaintenance} onClose={() => setAddingMaintenance(false)} title="Nova manutenção">
        {addingMaintenance && (
          <VehicleMaintenanceForm
            vehicleId={selectedVehicleId}
            onSaved={handleMaintenanceSaved}
            onCancel={() => setAddingMaintenance(false)}
          />
        )}
      </Modal>

      <Modal open={Boolean(editingMaintenance)} onClose={() => setEditingMaintenance(null)} title="Editar manutenção">
        {editingMaintenance && (
          <VehicleMaintenanceForm
            vehicleId={selectedVehicleId}
            editingItem={editingMaintenance}
            onSaved={handleMaintenanceSaved}
            onCancel={() => setEditingMaintenance(null)}
          />
        )}
      </Modal>

      <Modal open={addingPayment} onClose={() => setAddingPayment(false)} title="Novo pagamento">
        {addingPayment && (
          <VehiclePaymentForm
            vehicleId={selectedVehicleId}
            onSaved={handlePaymentSaved}
            onCancel={() => setAddingPayment(false)}
          />
        )}
      </Modal>

      <Modal open={Boolean(editingPayment)} onClose={() => setEditingPayment(null)} title="Editar pagamento">
        {editingPayment && (
          <VehiclePaymentForm
            vehicleId={selectedVehicleId}
            editingItem={editingPayment}
            onSaved={handlePaymentSaved}
            onCancel={() => setEditingPayment(null)}
          />
        )}
      </Modal>
    </section>
  );
}
