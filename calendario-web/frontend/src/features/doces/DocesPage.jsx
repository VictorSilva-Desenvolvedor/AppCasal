import { useCallback, useEffect, useState } from 'react';
import { api } from '../../services/api.js';
import { useToast } from '../../hooks/useToast.js';
import { CandyHoldButton } from './CandyHoldButton.jsx';
import { CandyRankingBoard } from './CandyRankingBoard.jsx';
import { CandyHistoryList } from './CandyHistoryList.jsx';

const TABS = [
  { value: 'registrar', label: 'Registrar' },
  { value: 'ranking', label: 'Ranking' },
  { value: 'historico', label: 'Histórico' },
];

export function DocesPage() {
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('registrar');
  const [period, setPeriod] = useState('day');
  const [ranking, setRanking] = useState(null);
  const [entries, setEntries] = useState([]);

  const reloadRanking = useCallback(async () => {
    setRanking(await api.getCandyRanking({ period }));
  }, [period]);

  const reloadHistory = useCallback(async () => {
    setEntries(await api.getCandyEntries());
  }, []);

  useEffect(() => {
    reloadRanking();
  }, [reloadRanking]);

  useEffect(() => {
    reloadHistory();
  }, [reloadHistory]);

  async function handleLogged(durationMs) {
    try {
      await api.createCandyEntry({ durationMs });
      showToast('Registrado!', 'success');
      await Promise.all([reloadRanking(), reloadHistory()]);
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  async function handleDeleted() {
    await Promise.all([reloadRanking(), reloadHistory()]);
  }

  return (
    <section className="view candy-page">
      <div className="candy-page-header">
        <div>
          <h2>Doces</h2>
          <p>Competição de quem come menos doce/besteira no dia, semana e mês.</p>
        </div>
      </div>

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

      {activeTab === 'registrar' && <CandyHoldButton onLogged={handleLogged} />}

      {activeTab === 'ranking' && (
        <CandyRankingBoard period={period} onPeriodChange={setPeriod} ranking={ranking} />
      )}

      {activeTab === 'historico' && <CandyHistoryList entries={entries} onDeleted={handleDeleted} />}
    </section>
  );
}
