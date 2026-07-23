import { useEffect, useState } from 'react';
import { Icon, Button } from '../../components/ui/index.js';
import { api } from '../../services/api.js';
import { isDayComplete, groupCheckinsByDay } from './habitUtils.js';

const POLL_INTERVAL_MS = 4000;
const TIMEOUT_MS = 10 * 60 * 1000;
const CELEBRATION_MS = 800;

// Tela de espera do "check-in conjunto": o primeiro parceiro já criou o check-in
// dele antes desta tela abrir — aqui só ficamos consultando o servidor até o
// outro também confirmar. Fechar a tela não afeta os dados de forma alguma.
export function HabitJointWaitingView({ habit, day, users, onComplete, onClose }) {
  const [checking, setChecking] = useState(true);
  const [celebrating, setCelebrating] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let intervalId;
    let timeoutId;

    async function poll() {
      try {
        const checkins = await api.getHabitCheckins({ habit: habit._id, day });
        const checkinsByDay = groupCheckinsByDay(checkins);
        if (isDayComplete(habit, day, checkinsByDay, users)) {
          if (cancelled) return;
          clearInterval(intervalId);
          setCelebrating(true);
          setTimeout(() => {
            if (!cancelled) onComplete();
          }, CELEBRATION_MS);
          return;
        }
      } catch {
        // silencioso — a próxima tentativa do polling tenta de novo
      }
      if (!cancelled) setChecking(false);
    }

    poll();
    intervalId = setInterval(poll, POLL_INTERVAL_MS);
    timeoutId = setTimeout(() => {
      if (!cancelled) onClose();
    }, TIMEOUT_MS);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
      clearTimeout(timeoutId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [habit._id, day]);

  return (
    <div className="habit-joint-waiting">
      <div className={`habit-joint-waiting-icon${celebrating ? ' habit-joint-celebration' : ' habit-heart-pulse'}`}>
        <Icon name="habit-double-heart" />
      </div>
      <p className="habit-joint-waiting-text">
        {celebrating
          ? 'Vocês completaram juntos! 💕'
          : checking
            ? 'Verificando...'
            : 'Aguardando seu parceiro confirmar o check-in de hoje...'}
      </p>
      {!celebrating && (
        <Button type="button" variant="secondary" onClick={onClose}>
          Fechar
        </Button>
      )}
    </div>
  );
}
