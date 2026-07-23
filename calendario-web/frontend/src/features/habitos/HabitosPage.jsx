import { useCallback, useEffect, useState } from 'react';
import { Icon, Modal } from '../../components/ui/index.js';
import { api } from '../../services/api.js';
import { useCalendarData } from '../../hooks/useCalendarData.js';
import { useAuth } from '../../hooks/useAuth.js';
import { useToast } from '../../hooks/useToast.js';
import { HabitCard } from './HabitCard.jsx';
import { HabitForm } from './HabitForm.jsx';
import { HabitCheckinForm } from './HabitCheckinForm.jsx';
import { HabitSubtaskChecklist } from './HabitSubtaskChecklist.jsx';
import { HabitJointWaitingView } from './HabitJointWaitingView.jsx';
import { HabitHistoryView } from './HabitHistoryView.jsx';
import { HabitLogo } from './HabitLogo.jsx';
import { groupCheckinsByHabit, groupCheckinsByDay, isDayComplete, toDayKey } from './habitUtils.js';

const JOINT_CHECKIN_TYPES = ['casal', 'espelhado'];

export function HabitosPage() {
  const { users: allUsers } = useCalendarData();
  const users = allUsers.filter((u) => u.includeInHabits !== false);
  const { user } = useAuth();
  const { showToast } = useToast();

  const [habits, setHabits] = useState([]);
  const [checkins, setCheckins] = useState([]);
  const [showArchived, setShowArchived] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState(null);
  const [checkinHabit, setCheckinHabit] = useState(null);
  const [checkinMode, setCheckinMode] = useState('form'); // 'form' | 'waiting'
  const [historyHabit, setHistoryHabit] = useState(null);

  const reload = useCallback(async () => {
    const [habitsData, checkinsData] = await Promise.all([
      api.getHabits({ active: showArchived ? 'all' : 'true' }),
      api.getHabitCheckins(),
    ]);
    setHabits(habitsData);
    setCheckins(checkinsData);
  }, [showArchived]);

  useEffect(() => {
    reload();
  }, [reload]);

  const checkinsByHabit = groupCheckinsByHabit(checkins);

  function handleOpenCreate() {
    setEditingHabit(null);
    setFormOpen(true);
  }

  function handleOpenEdit(habit) {
    setEditingHabit(habit);
    setFormOpen(true);
  }

  function handleFormSaved() {
    setFormOpen(false);
    setEditingHabit(null);
    reload();
  }

  async function handleArchive(habit) {
    try {
      await api.archiveHabit(habit._id);
      showToast('Hábito arquivado', 'info');
      reload();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  function handleCheckinModalClose() {
    setCheckinHabit(null);
    setCheckinMode('form');
  }

  async function handleCheckinSaved() {
    const habit = checkinHabit;
    await reload();

    if (habit && JOINT_CHECKIN_TYPES.includes(habit.type)) {
      const todayKey = toDayKey(new Date());
      try {
        const freshCheckins = await api.getHabitCheckins({ habit: habit._id, day: todayKey });
        const checkinsByDay = groupCheckinsByDay(freshCheckins);
        if (!isDayComplete(habit, todayKey, checkinsByDay, users)) {
          setCheckinMode('waiting');
          return;
        }
      } catch {
        // se a checagem falhar, cai no comportamento padrão de fechar o modal
      }
    }

    handleCheckinModalClose();
  }

  function handleJointComplete() {
    showToast('Vocês completaram juntos! 💕', 'success');
    reload();
    handleCheckinModalClose();
  }

  return (
    <section className="view habit-page">
      <div className="habit-bg-pattern" aria-hidden="true" />

      <div className="habit-page-header">
        <div className="habit-page-header-title">
          <HabitLogo />
          <h2 className="habit-page-title">Hábitos</h2>
        </div>
        <div className="habit-header-actions">
          <button
            type="button"
            className={`habit-type-toggle-btn${showArchived ? ' is-active' : ''}`}
            onClick={() => setShowArchived((prev) => !prev)}
          >
            {showArchived ? 'Ver ativos' : 'Ver arquivados'}
          </button>
        </div>
      </div>

      <div className="habit-list">
        {habits.length === 0 && <p className="habit-empty">Nenhum hábito ainda. Crie o primeiro!</p>}
        {habits.map((habit) => (
          <HabitCard
            key={habit._id}
            habit={habit}
            checkins={checkinsByHabit.get(habit._id) || []}
            users={users}
            currentUserId={user?._id}
            onCheckin={setCheckinHabit}
            onEdit={handleOpenEdit}
            onArchive={handleArchive}
            onViewHistory={setHistoryHabit}
            onFrozen={reload}
            onReacted={reload}
          />
        ))}
      </div>

      <button type="button" className="habit-fab" onClick={handleOpenCreate} aria-label="Criar hábito">
        <Icon name="plus" />
      </button>

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editingHabit ? 'Editar hábito' : 'Novo hábito'}>
        <HabitForm
          habit={editingHabit}
          users={users}
          currentUserId={user?._id}
          onSaved={handleFormSaved}
          onCancel={() => setFormOpen(false)}
        />
      </Modal>

      <Modal
        open={!!checkinHabit}
        onClose={handleCheckinModalClose}
        title={checkinMode === 'waiting' ? 'Check-in conjunto' : `Check-in: ${checkinHabit?.name ?? ''}`}
      >
        {checkinHabit && checkinMode === 'waiting' && (
          <HabitJointWaitingView
            habit={checkinHabit}
            day={toDayKey(new Date())}
            users={users}
            onComplete={handleJointComplete}
            onClose={handleCheckinModalClose}
          />
        )}
        {checkinHabit &&
          checkinMode === 'form' &&
          (checkinHabit.type === 'colaborativo' ? (
            <HabitSubtaskChecklist
              habit={checkinHabit}
              day={toDayKey(new Date())}
              checkins={checkinsByHabit.get(checkinHabit._id) || []}
              onChanged={reload}
            />
          ) : (
            <HabitCheckinForm
              habit={checkinHabit}
              day={toDayKey(new Date())}
              onSaved={handleCheckinSaved}
              onCancel={handleCheckinModalClose}
            />
          ))}
      </Modal>

      <Modal open={!!historyHabit} onClose={() => setHistoryHabit(null)} title={`Histórico: ${historyHabit?.name ?? ''}`}>
        {historyHabit && (
          <HabitHistoryView
            habit={historyHabit}
            checkins={checkinsByHabit.get(historyHabit._id) || []}
            users={users}
          />
        )}
      </Modal>
    </section>
  );
}
