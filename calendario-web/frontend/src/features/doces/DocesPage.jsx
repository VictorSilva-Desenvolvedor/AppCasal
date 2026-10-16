import { useCallback, useEffect, useState } from 'react';
import { api } from '../../services/api.js';
import { HeartLoader } from '../../components/ui/index.js';
import { useToast } from '../../hooks/useToast.js';
import { useAuth } from '../../hooks/useAuth.js';
import { useCalendarData } from '../../hooks/useCalendarData.js';
import { personColorFor } from '../calendar/calendarUtils.js';
import { CandyHoldButton } from './CandyHoldButton.jsx';
import { CandyRankingBoard } from './CandyRankingBoard.jsx';
import { CandyHistoryList } from './CandyHistoryList.jsx';
import { JusticeScale } from './JusticeScale.jsx';
import { MAX_HOLD_MS } from './candyConfig.js';
import { formatDuration, formatScore } from './candyUtils.js';

const TABS = [
  { value: 'ranking', label: 'Placar' },
  { value: 'historico', label: 'Histórico' },
];

// A frase do topo diz quem está na frente, pelo mesmo peso (tempo somado) que
// inclina a balança.
function weekVerdict(weekEntries, me, partner) {
  const total = (id) => weekEntries.filter((e) => e.user?._id === id).reduce((sum, e) => sum + e.durationMs, 0);
  const mine = total(me?._id);
  if (!partner) return mine === 0 ? 'Sua semana está sem doces até agora.' : `Sua semana: ${formatScore(mine)} de doce.`;
  const theirs = total(partner._id);
  if (mine === 0 && theirs === 0) return 'Semana sem doces até agora.';
  if (mine === theirs) return 'Empate nesta semana.';
  return mine < theirs ? 'Você está na frente nesta semana.' : `${partner.name} está na frente nesta semana.`;
}

export function DocesPage() {
  const { users } = useCalendarData();
  const { showToast } = useToast();
  const { user: me } = useAuth();
  const myColor = personColorFor(users, me?._id);

  const [activeTab, setActiveTab] = useState('ranking');
  const [period, setPeriod] = useState('day');
  const [ranking, setRanking] = useState(null);
  const [rankingEntries, setRankingEntries] = useState([]);
  const [weekRanking, setWeekRanking] = useState(null);
  const [weekEntries, setWeekEntries] = useState([]);
  const [entries, setEntries] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const reloadRanking = useCallback(async () => {
    const [rankingData, entriesList] = await Promise.all([
      api.getCandyRanking({ period }),
      api.getCandyEntries({ period }),
    ]);
    setRanking(rankingData);
    setRankingEntries(entriesList);
  }, [period]);

  const reloadWeek = useCallback(async () => {
    const [week, weekList] = await Promise.all([
      api.getCandyRanking({ period: 'week' }),
      api.getCandyEntries({ period: 'week' }),
    ]);
    setWeekRanking(week);
    setWeekEntries(weekList);
  }, []);

  const reloadHistory = useCallback(async () => {
    setEntries(await api.getCandyEntries());
  }, []);

  // Sem o catch, uma falha de rede deixava a tela em branco (balança e ranking
  // vazios) sem nenhum aviso de que os dados não carregaram.
  useEffect(() => {
    reloadRanking().catch((err) => showToast(err.message, 'error'));
  }, [reloadRanking, showToast]);

  useEffect(() => {
    Promise.all([reloadWeek(), reloadHistory()])
      .catch((err) => showToast(err.message, 'error'))
      .finally(() => setLoading(false));
  }, [reloadWeek, reloadHistory, showToast]);

  async function handleLogged(durationMs) {
    setSubmitting(true);
    try {
      await api.createCandyEntry({ durationMs });
      showToast('Registrado!', 'success');
      await Promise.all([reloadRanking(), reloadWeek(), reloadHistory()]);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleted() {
    await Promise.all([reloadRanking(), reloadWeek(), reloadHistory()]);
  }

  if (loading) {
    return (
      <section className="view candy-page">
        <HeartLoader />
      </section>
    );
  }

  const partner = users.find((u) => u._id !== me?._id);
  const verdict = weekVerdict(weekEntries, me, partner);

  return (
    <section className="view candy-page">
      <header className="candy-page-header">
        <h2>Doces</h2>
        <p>Quem comer menos doce na semana ganha.</p>
      </header>

      <section className="candy-stage card card-stitched" aria-labelledby="candy-verdict">
        <h3 id="candy-verdict" className="candy-verdict">
          {verdict}
        </h3>
        {users.length > 0 && <JusticeScale users={users} weekEntries={weekEntries} resetKey={weekRanking?.start} />}
        <div className="candy-hold-area">
          <CandyHoldButton onLogged={handleLogged} submitting={submitting} color={myColor} />
          <p className="candy-hold-hint">
            Comeu um doce? Segure o botão enquanto come. Quanto mais tempo, mais pesa (até {formatDuration(MAX_HOLD_MS)}).
          </p>
        </div>
      </section>

      <section className="candy-board card" aria-label="Placar e histórico">
        <div className="candy-switch" role="group" aria-label="Ver">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              className={`candy-switch-btn${activeTab === tab.value ? ' is-active' : ''}`}
              aria-pressed={activeTab === tab.value}
              onClick={() => setActiveTab(tab.value)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'ranking' && (
          <CandyRankingBoard period={period} onPeriodChange={setPeriod} ranking={ranking} entries={rankingEntries} />
        )}

        {activeTab === 'historico' && <CandyHistoryList entries={entries} onDeleted={handleDeleted} />}
      </section>
    </section>
  );
}
