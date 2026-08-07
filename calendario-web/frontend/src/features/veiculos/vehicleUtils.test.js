import { describe, expect, test } from 'vitest';
import { maintenanceUrgency } from './vehicleUtils.js';

describe('maintenanceUrgency', () => {
  test('mostra o km absoluto de vencimento junto com o quanto falta', () => {
    const item = { status: 'pendente', dueOdometer: 30500, dueDate: null };
    const urgency = maintenanceUrgency(item, 30000);

    expect(urgency.label).toBe('Vence aos 30.500 km (faltam 500 km)');
    expect(urgency.overdue).toBe(false);
  });

  test('item vencido mostra o km absoluto e quanto passou', () => {
    const item = { status: 'pendente', dueOdometer: 30500, dueDate: null };
    const urgency = maintenanceUrgency(item, 31000);

    expect(urgency.label).toBe('Venceu aos 30.500 km (500 km atrasada)');
    expect(urgency.overdue).toBe(true);
  });

  test('recém aplicado (dueOdometer = odômetro atual + intervalo) mostra o alvo absoluto, não só o intervalo', () => {
    // Regressão do print do usuário: "Limpar e lubrificar a corrente" com
    // recurrenceKm 500 aplicado a um veículo com 30.000 km deve deixar claro
    // que o vencimento é 30.500 km, não só repetir "500 km".
    const item = { status: 'pendente', dueOdometer: 30500, dueDate: null, recurrenceKm: 500 };
    const urgency = maintenanceUrgency(item, 30000);

    expect(urgency.label).toContain('30.500 km');
  });
});
