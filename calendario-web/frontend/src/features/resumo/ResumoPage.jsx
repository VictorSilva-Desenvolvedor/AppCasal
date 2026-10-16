import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api.js';
import { Button, HeartLoader } from '../../components/ui/index.js';
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

  // A semana contada como uma carta do casal (decisão de 2026-10-16): em vez de
  // cinco contadores iguais, um parágrafo por área, com o link para o módulo.
  const stitchedDays = habits.items.reduce((sum, h) => sum + (h.completedDaysThisWeek || 0), 0);
  const steadiest = [...habits.items].sort((a, b) => (b.currentStreak || 0) - (a.currentStreak || 0))[0];
  const hasMoney = finance.totalReceitas || finance.totalDespesas;
  const candyWinner = candy.ranking.find((row) => row.isWinner && row.count >= 0);
  const anyCandy = candy.ranking.some((row) => row.count > 0);
  const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

  return (
    <section className="view resumo-page">
      <div className="resumo-header">
        <h2>Carta da semana</h2>
        <span className="resumo-date-range">{formatWeekRange(weekStart, weekEnd)}</span>
      </div>

      <article className="resumo-letter card card-stitched">
        <p className="resumo-letter-greeting">Querido casal,</p>

        <p>
          {habits.items.length === 0 ? (
            <>
              Ainda não tem nenhum hábito bordado por aqui.{' '}
              <Link to="/app/habitos">Que tal começar um juntos?</Link>
            </>
          ) : (
            <>
              Nesta semana vocês bordaram <strong>{plural(stitchedDays, 'ponto', 'pontos')}</strong> nos hábitos.
              {steadiest && steadiest.currentStreak > 0 && (
                <>
                  {' '}
                  O mais firme foi{' '}
                  <strong>
                    <span aria-hidden="true">{steadiest.emoji}</span> {steadiest.name}
                  </strong>
                  , com {plural(steadiest.currentStreak, 'dia seguido', 'dias seguidos')}.
                </>
              )}{' '}
              <Link to="/app/habitos">Ver hábitos</Link>
            </>
          )}
        </p>

        <p>
          {hasMoney ? (
            <>
              Em {monthLabel(finance.month, finance.year).toLowerCase()} entraram{' '}
              <strong className="tabular">{formatCurrency(finance.totalReceitas, hideFinanceValues)}</strong> e saíram{' '}
              <strong className="tabular">{formatCurrency(finance.totalDespesas, hideFinanceValues)}</strong>; o saldo
              está em{' '}
              <strong
                className={`tabular ${finance.saldo > 0 ? 'finance-value--positive' : finance.saldo < 0 ? 'finance-value--negative' : ''}`}
              >
                {formatCurrency(finance.saldo, hideFinanceValues)}
              </strong>
              .{finance.status !== 'aberto' && ' O mês já foi fechado.'}{' '}
              <Link to="/app/financeiro">Ver financeiro</Link>
            </>
          ) : (
            <>
              Nada foi lançado no financeiro de {monthLabel(finance.month, finance.year).toLowerCase()} ainda.{' '}
              <Link to="/app/financeiro">Lançar a primeira conta</Link>
            </>
          )}
        </p>

        <p>
          {emotions.count === 0 ? (
            <>
              Ninguém contou como se sentiu esta semana. <Link to="/app/emocoes">Contem como estão</Link>
            </>
          ) : (
            <>
              Vocês guardaram <strong>{plural(emotions.count, 'momento', 'momentos')}</strong> na jarra de emoções, com
              intensidade média de {emotions.averageIntensity.toLocaleString('pt-BR')} de 5.{' '}
              <Link to="/app/emocoes">Abrir a jarra</Link>
            </>
          )}
        </p>

        <p>
          {tasks.completedThisWeek === 0 && tasks.totalActive === 0 ? (
            <>
              A lista de tarefas está vazia. <Link to="/app/tarefas">Anotar uma</Link>
            </>
          ) : (
            <>
              Foram <strong>{plural(tasks.completedThisWeek, 'tarefa concluída', 'tarefas concluídas')}</strong>, e{' '}
              {plural(tasks.totalActive, 'continua pendente', 'continuam pendentes')}.{' '}
              <Link to="/app/tarefas">Ver tarefas</Link>
            </>
          )}
        </p>

        <p>
          {!anyCandy ? (
            <>
              Na disputa dos doces, ninguém registrou nada. <Link to="/app/doces">Abrir a balança</Link>
            </>
          ) : (
            <>
              Na disputa dos doces,{' '}
              {candyWinner ? (
                <>
                  <strong>{candyWinner.user.name}</strong> segurou melhor a vontade (
                  {formatCandyCount(candyWinner.count)}, {formatScore(candyWinner.totalMs)}).
                </>
              ) : (
                'deu empate.'
              )}{' '}
              <Link to="/app/doces">Ver o ranking</Link>
            </>
          )}
        </p>

        <p className="resumo-letter-signature">
          Com carinho,
          <br />
          <span>o AppCasal</span>
        </p>
      </article>
    </section>
  );
}
