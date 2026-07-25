import { useCallback, useEffect, useState } from 'react';
import { api } from '../../services/api.js';
import { Card, Pill, HeartLoader } from '../../components/ui/index.js';
import { useToast } from '../../hooks/useToast.js';
import { useTheme } from '../../hooks/useTheme.js';
import { formatCurrency } from '../financeiro/financeUtils.js';
import { formatCandyCount, formatScore } from '../doces/candyUtils.js';

function formatWeekRange(weekStart, weekEnd) {
  const toLocalDate = (dayKey) => {
    const [y, m, d] = dayKey.split('-').map(Number);
    return new Date(y, m - 1, d, 12);
  };
  const fmt = (date) => date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  return `${fmt(toLocalDate(weekStart))} – ${fmt(toLocalDate(weekEnd))}`;
}

export function ResumoPage() {
  const { showToast } = useToast();
  const { hideFinanceValues } = useTheme();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setSummary(await api.getWeeklySummary());
  }, []);

  useEffect(() => {
    reload()
      .catch((err) => showToast(err.message, 'error'))
      .finally(() => setLoading(false));
  }, [reload, showToast]);

  if (loading) {
    return (
      <section className="view resumo-page">
        <HeartLoader />
      </section>
    );
  }

  if (!summary) {
    return (
      <section className="view resumo-page">
        <p className="sidebar-empty">Não foi possível carregar o resumo da semana.</p>
      </section>
    );
  }

  const { weekStart, weekEnd, habits, finance, emotions, tasks, candy } = summary;

  return (
    <section className="view resumo-page">
      <div className="resumo-header">
        <h2>Resumo da semana</h2>
        <span className="resumo-date-range">{formatWeekRange(weekStart, weekEnd)}</span>
      </div>

      <div className="resumo-cards">
        <Card className="resumo-card">
          <h3>Hábitos</h3>
          {habits.items.length === 0 ? (
            <p className="sidebar-empty">Nenhum hábito ativo.</p>
          ) : (
            <ul className="resumo-list">
              {habits.items.map((habit) => (
                <li key={habit._id} className="resumo-list-row">
                  <span className="resumo-list-label">
                    {habit.emoji} {habit.name}
                  </span>
                  <span className="resumo-list-meta">
                    🔥 {habit.currentStreak} · {habit.completedDaysThisWeek}/7 dias
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="resumo-card">
          <h3>Financeiro</h3>
          <div className="resumo-finance-row">
            <strong
              className={`resumo-finance-saldo ${finance.saldo >= 0 ? 'finance-value--positive' : 'finance-value--negative'}`}
            >
              {formatCurrency(finance.saldo, hideFinanceValues)}
            </strong>
            {finance.status !== 'aberto' && (
              <Pill className="finance-status-pill finance-status--pago">Finalizado</Pill>
            )}
          </div>
          <p className="resumo-card-detail">
            {formatCurrency(finance.totalReceitas, hideFinanceValues)} de receita ·{' '}
            {formatCurrency(finance.totalDespesas, hideFinanceValues)} de despesa
          </p>
        </Card>

        <Card className="resumo-card">
          <h3>Emoções</h3>
          {emotions.count === 0 ? (
            <p className="sidebar-empty">Nenhum registro esta semana.</p>
          ) : (
            <p className="resumo-card-detail">
              Intensidade média {emotions.averageIntensity}/5 em {emotions.count}{' '}
              {emotions.count === 1 ? 'registro' : 'registros'}
            </p>
          )}
        </Card>

        <Card className="resumo-card">
          <h3>Tarefas</h3>
          <p className="resumo-card-detail">
            {tasks.completedThisWeek} concluída{tasks.completedThisWeek === 1 ? '' : 's'} esta semana
          </p>
          <p className="resumo-card-detail">{tasks.totalActive} pendente{tasks.totalActive === 1 ? '' : 's'} agora</p>
        </Card>

        <Card className="resumo-card">
          <h3>Doces</h3>
          {candy.ranking.every((row) => row.count === 0) ? (
            <p className="sidebar-empty">Ninguém registrou doces esta semana.</p>
          ) : (
            <ul className="resumo-list">
              {candy.ranking.map((row) => (
                <li key={row.user._id} className="resumo-list-row">
                  <span className="resumo-list-label">
                    {row.isWinner && '🏆 '}
                    {row.user.name}
                  </span>
                  <span className="resumo-list-meta">
                    {formatScore(row.totalMs)} · {formatCandyCount(row.count)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </section>
  );
}
