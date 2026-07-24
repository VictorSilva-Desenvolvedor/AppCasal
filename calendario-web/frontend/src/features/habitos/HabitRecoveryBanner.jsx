export function HabitRecoveryBanner({ habit }) {
  if (!habit.recoveryChallenge?.active) return null;

  const { daysCompleted, restoredAmount } = habit.recoveryChallenge;

  return (
    <div className="habit-recovery-banner">
      <span className="habit-recovery-title">Desafio de recuperação: dia {daysCompleted}/3</span>
      <div className="habit-recovery-progress">
        <div className="habit-recovery-progress-fill" style={{ width: `${(daysCompleted / 3) * 100}%` }} />
      </div>
      <span className="habit-recovery-hint">Complete os 3 dias para recuperar {restoredAmount} da sua streak</span>
    </div>
  );
}
