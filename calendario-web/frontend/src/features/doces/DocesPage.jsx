import { useCallback, useEffect, useState } from 'react';
import { api } from '../../services/api.js';
import { useToast } from '../../hooks/useToast.js';
import { useCalendarData } from '../../hooks/useCalendarData.js';
import { CandyHoldButton } from './CandyHoldButton.jsx';
import { CandyRankingBoard } from './CandyRankingBoard.jsx';
import { CandyHistoryList } from './CandyHistoryList.jsx';
import { JusticeScale } from './JusticeScale.jsx';

const TABS = [
  { value: 'registrar', label: 'Registrar' },
  { value: 'ranking', label: 'Ranking' },
  { value: 'historico', label: 'Histórico' },
];

export function DocesPage() {
  const { users } = useCalendarData();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('registrar');
  const [period, setPeriod] = useState('day');
  const [ranking, setRanking] = useState(null);
  const [weekRanking, setWeekRanking] = useState(null);
  const [weekEntries, setWeekEntries] = useState([]);
  const [entries, setEntries] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const reloadRanking = useCallback(async () => {
    setRanking(await api.getCandyRanking({ period }));
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

  useEffect(() => {
    reloadRanking();
  }, [reloadRanking]);

  useEffect(() => {
    reloadWeek();
    reloadHistory();
  }, [reloadWeek, reloadHistory]);

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

  return (
    <section className="view candy-page">
      <div className="candy-page-header">
        <div>
          <h2>Doces</h2>
          <p>Competição de quem come menos doce/besteira no dia, semana e mês.</p>
        </div>
      </div>

      {users.length > 0 && (
        <JusticeScale users={users} weekEntries={weekEntries} resetKey={weekRanking?.start} />
      )}

      <div className="candy-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            className={`candy-tab-btn${activeTab === tab.value ? ' is-active' : ''}`}
            onClick={() => setActiveTab(tab.value)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'registrar' && <CandyHoldButton onLogged={handleLogged} submitting={submitting} />}

      {activeTab === 'ranking' && (
        <CandyRankingBoard period={period} onPeriodChange={setPeriod} ranking={ranking} />
      )}

      {activeTab === 'historico' && <CandyHistoryList entries={entries} onDeleted={handleDeleted} />}
    </section>
  );
}
