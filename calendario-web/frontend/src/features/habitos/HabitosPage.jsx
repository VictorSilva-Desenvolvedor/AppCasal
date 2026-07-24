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
  const { users } = useCalendarData();
  const { user } = useAuth();
  const { showToast } = useToast();
  const otherUser = users.find((u) => u._id !== user?._id);

  const [habits, setHabits] = useState([]);
  const [checkins, setCheckins] = useState([]);
  const [showArchived, setShowArchived] = useState(false);
  const [viewScope, setViewScope] = useState('ambos'); // 'ambos' | 'meu' | 'parceiro'
  const [formOpen, setFormOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState(null);
  const [checkinHabit, setCheckinHabit] = useState(null);
  const [checkinMode, setCheckinMode] = useState('form'); // 'form' | 'waiting'
  const [historyHabit, setHistoryHabit] = useState(null);

  const reload = useCallback(async () => {
    const [habitsData, checkinsData] = await Promise.all([
      api.getHabits({ active: showArchived ? 'false' : 'true' }),
      api.getHabitCheckins(),
    ]);
    setHabits(habitsData);
    setCheckins(checkinsData);
  }, [showArchived]);

  useEffect(() => {
    reload();
  }, [reload]);

  const checkinsByHabit = groupCheckinsByHabit(checkins);

  const scopedHabits = habits.filter((habit) => {
    if (viewScope === 'ambos') return habit.type !== 'individual';
    const ownerId = habit.owner?._id ?? habit.owner;
    return viewScope === 'meu' ? ownerId === user?._id : ownerId === otherUser?._id;
  });

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

  async function handleUnarchive(habit) {
    try {
      await api.updateHabit(habit._id, { active: true });
      showToast('Hábito reativado', 'success');
      reload();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  async function handleDelete(habit) {
    if (!window.confirm(`Excluir "${habit.name}" permanentemente? Essa ação não pode ser desfeita.`)) return;
    try {
      await api.deleteHabit(habit._id);
      showToast('Hábito excluído', 'info');
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
          <div className="habit-tabs" role="tablist" aria-label="Filtrar hábitos">
            <button
              type="button"
              role="tab"
              aria-selected={!showArchived}
              className={`habit-type-toggle-btn${!showArchived ? ' is-active' : ''}`}
              onClick={() => setShowArchived(false)}
            >
              Ativos
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={showArchived}
              className={`habit-type-toggle-btn${showArchived ? ' is-active' : ''}`}
              onClick={() => setShowArchived(true)}
            >
              Arquivados
            </button>
          </div>
        </div>
      </div>

      <div className="habit-scope-tabs" role="tablist" aria-label="De quem é o hábito">
        <button
          type="button"
          role="tab"
          aria-selected={viewScope === 'ambos'}
          className={`habit-type-toggle-btn${viewScope === 'ambos' ? ' is-active' : ''}`}
          onClick={() => setViewScope('ambos')}
        >
          Ambos
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={viewScope === 'meu'}
          className={`habit-type-toggle-btn${viewScope === 'meu' ? ' is-active' : ''}`}
          onClick={() => setViewScope('meu')}
        >
          Meu
        </button>
        {otherUser && (
          <button
            type="button"
            role="tab"
            aria-selected={viewScope === 'parceiro'}
            className={`habit-type-toggle-btn${viewScope === 'parceiro' ? ' is-active' : ''}`}
            onClick={() => setViewScope('parceiro')}
          >
            {otherUser.name}
          </button>
        )}
      </div>

      <div className="habit-list">
        {scopedHabits.length === 0 && (
          <p className="habit-empty">
            {showArchived
              ? 'Nenhum hábito arquivado.'
              : viewScope === 'meu'
                ? 'Nenhum hábito individual seu ainda.'
                : viewScope === 'parceiro'
                  ? `Nenhum hábito individual de ${otherUser?.name ?? 'parceiro(a)'} ainda.`
                  : 'Nenhum hábito ainda. Crie o primeiro!'}
          </p>
        )}
        {scopedHabits.map((habit) => (
          <HabitCard
            key={habit._id}
            habit={habit}
            checkins={checkinsByHabit.get(habit._id) || []}
            users={users}
            currentUserId={user?._id}
            onCheckin={setCheckinHabit}
            onEdit={handleOpenEdit}
            onArchive={handleArchive}
            onUnarchive={handleUnarchive}
            onDelete={handleDelete}
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
