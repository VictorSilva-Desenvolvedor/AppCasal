import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api.js';
import { Button, Card, Pill, HeartLoader } from '../../components/ui/index.js';
import { useToast } from '../../hooks/useToast.js';
import { useTheme } from '../../hooks/useTheme.js';
import { formatCurrency, monthLabel } from '../financeiro/financeUtils.js';
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
  const [loadError, setLoadError] = useState('');

  const reload = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      setSummary(await api.getWeeklySummary());
    } catch (err) {
      setLoadError(err.message);
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    reload();
  }, [reload]);

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
        <div className="resumo-load-error" role="alert">
          <p>Não foi possível carregar o resumo da semana.</p>
          {loadError && <p className="resumo-card-detail">{loadError}</p>}
          <Button type="button" variant="secondary" onClick={reload}>
            Tentar novamente
          </Button>
        </div>
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
        <Card as={Link} to="/app/habitos" className="resumo-card resumo-card-link" aria-label="Abrir Hábitos">
          <h3>Hábitos</h3>
          {habits.items.length === 0 ? (
            <p className="sidebar-empty">Nenhum hábito ativo.</p>
          ) : (
            <ul className="resumo-list">
              {habits.items.map((habit) => (
                <li key={habit._id} className="resumo-list-row">
                  <span className="resumo-list-label">
                    <span aria-hidden="true">{habit.emoji}</span> {habit.name}
                  </span>
                  <span
                    className="resumo-list-meta"
                    aria-label={`Sequência de ${habit.currentStreak} ${habit.currentStreak === 1 ? 'dia' : 'dias'}, ${habit.completedDaysThisWeek} de 7 dias nesta semana`}
                  >
                    <span aria-hidden="true">🔥</span> {habit.currentStreak} ·{' '}
                    {habit.completedDaysThisWeek}/7 dias
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card
          as={Link}
          to="/app/financeiro"
          className="resumo-card resumo-card-link"
          aria-label="Abrir Financeiro"
        >
          <h3>
            Financeiro <span className="resumo-card-period">· {monthLabel(finance.month, finance.year)}</span>
          </h3>
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

        <Card as={Link} to="/app/emocoes" className="resumo-card resumo-card-link" aria-label="Abrir Emoções">
          <h3>Emoções</h3>
          {emotions.count === 0 ? (
            <p className="sidebar-empty">Nenhum registro esta semana.</p>
          ) : (
            <p className="resumo-card-detail">
              Intensidade média {emotions.averageIntensity.toLocaleString('pt-BR')}/5 em {emotions.count}{' '}
              {emotions.count === 1 ? 'registro' : 'registros'}
            </p>
          )}
        </Card>

        <Card as={Link} to="/app/tarefas" className="resumo-card resumo-card-link" aria-label="Abrir Tarefas">
          <h3>Tarefas</h3>
          <p className="resumo-card-detail">
            {tasks.completedThisWeek} concluída{tasks.completedThisWeek === 1 ? '' : 's'} esta semana
          </p>
          <p className="resumo-card-detail">{tasks.totalActive} pendente{tasks.totalActive === 1 ? '' : 's'} agora</p>
        </Card>

        <Card as={Link} to="/app/doces" className="resumo-card resumo-card-link" aria-label="Abrir Doces">
          <h3>Doces</h3>
          {candy.ranking.every((row) => row.count === 0) ? (
            <p className="sidebar-empty">Ninguém registrou doces esta semana.</p>
          ) : (
            <ul className="resumo-list">
              {candy.ranking.map((row) => (
                <li key={row.user._id} className="resumo-list-row">
                  <span className="resumo-list-label">
                    {row.isWinner && (
                      <>
                        <span aria-hidden="true">🏆</span>
                        <span className="sr-only">Vencedor da semana: </span>{' '}
                      </>
                    )}
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
