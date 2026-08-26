export function HabitRecoveryBanner({ habit }) {
  if (!habit.recoveryChallenge?.active) return null;

  const { daysCompleted, restoredAmount } = habit.recoveryChallenge;

  return (
    <div className="habit-recovery-banner">
      <span className="habit-recovery-title">Desafio de recuperação: dia {daysCompleted}/3</span>
      <div
        className="habit-recovery-progress"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={3}
        aria-valuenow={daysCompleted}
        aria-label="Progresso do desafio de recuperação"
      >
        <div className="habit-recovery-progress-fill" style={{ transform: `scaleX(${daysCompleted / 3})` }} />
      </div>
      <span className="habit-recovery-hint">Complete os 3 dias para recuperar {restoredAmount} da sua streak</span>
    </div>
  );
}
