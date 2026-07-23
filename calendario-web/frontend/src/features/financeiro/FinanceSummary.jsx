import { Card } from '../../components/ui/index.js';
import { formatCurrency, monthLabel } from './financeUtils.js';

const NATURE_LABEL = { fixa: 'Fixas', com_prazo: 'Com prazo', unica: 'Únicas', a_decidir: 'A decidir' };

function formatPct(value) {
  if (value === null || value === undefined) return '—';
  return `${value >= 0 ? '+' : ''}${Math.round(value)}%`;
}

export function FinanceSummary({ report, goals = [], history = [] }) {
  if (!report) {
    return <p className="sidebar-empty">Carregando resumo…</p>;
  }

  const { totalReceitas, totalDespesas, saldo, percentualGasto, porCategoria, porNatureza, topDespesas, comparativoMesAnterior } = report;
  const maxCategoria = porCategoria.reduce((max, item) => Math.max(max, item.total), 0);

  const activeGoals = goals.filter((g) => g.status !== 'concluido');
  const goalsTargetTotal = activeGoals.reduce((sum, g) => sum + g.targetAmount, 0);
  const goalsCurrentTotal = activeGoals.reduce((sum, g) => sum + g.currentAmount, 0);
  const goalsProgressPct = goalsTargetTotal ? Math.min(100, (goalsCurrentTotal / goalsTargetTotal) * 100) : 0;

  const remainingInstallmentsTotal = goals
    .filter((g) => g.type === 'parcelamento' && g.totalInstallments)
    .reduce((sum, g) => sum + Math.max(0, g.totalInstallments - g.paidInstallments) * (g.installmentAmount || 0), 0);

  const maxNatureza = (porNatureza || []).reduce((max, item) => Math.max(max, item.total), 0);
  const maxHistorySaldo = history.reduce((max, item) => Math.max(max, Math.abs(item.saldo)), 0);

  return (
    <div className="finance-summary">
      <div className="finance-summary-cards">
        <Card className="finance-summary-card">
          <span className="finance-summary-card-label">Receita total</span>
          <strong className="finance-summary-card-value finance-value--positive">
            {formatCurrency(totalReceitas)}
          </strong>
        </Card>
        <Card className="finance-summary-card">
          <span className="finance-summary-card-label">Despesa total</span>
          <strong className="finance-summary-card-value finance-value--negative">
            {formatCurrency(totalDespesas)}
          </strong>
        </Card>
        <Card className="finance-summary-card">
          <span className="finance-summary-card-label">Saldo</span>
          <strong className={`finance-summary-card-value ${saldo >= 0 ? 'finance-value--positive' : 'finance-value--negative'}`}>
            {formatCurrency(saldo)}
          </strong>
        </Card>
        <Card className="finance-summary-card">
          <span className="finance-summary-card-label">% da renda gasta</span>
          <strong className="finance-summary-card-value">{Math.round(percentualGasto * 100)}%</strong>
          <div className="finance-category-bar-track finance-percent-bar-track">
            <div
              className={`finance-category-bar-fill ${percentualGasto > 1 ? 'finance-percent-bar-fill--over' : 'finance-percent-bar-fill'}`}
              style={{ width: `${Math.min(100, percentualGasto * 100)}%` }}
            />
          </div>
        </Card>
      </div>

      <Card className="finance-report-card">
        <h3>Receita x Despesa</h3>
        <div className="finance-comparison-bars">
          <div className="finance-category-bar-row">
            <span className="finance-category-bar-label">Receita</span>
            <div className="finance-category-bar-track">
              <div
                className="finance-category-bar-fill finance-value--positive-bg"
                style={{ width: `${Math.max(totalReceitas, totalDespesas) ? (totalReceitas / Math.max(totalReceitas, totalDespesas)) * 100 : 0}%` }}
              />
            </div>
            <span className="finance-category-bar-value">{formatCurrency(totalReceitas)}</span>
          </div>
          <div className="finance-category-bar-row">
            <span className="finance-category-bar-label">Despesa</span>
            <div className="finance-category-bar-track">
              <div
                className="finance-category-bar-fill finance-value--negative-bg"
                style={{ width: `${Math.max(totalReceitas, totalDespesas) ? (totalDespesas / Math.max(totalReceitas, totalDespesas)) * 100 : 0}%` }}
              />
            </div>
            <span className="finance-category-bar-value">{formatCurrency(totalDespesas)}</span>
          </div>
        </div>
      </Card>

      <Card className="finance-report-card">
        <h3>Despesas por categoria</h3>
        {porCategoria.length === 0 ? (
          <p className="sidebar-empty">Nenhuma despesa lançada neste mês</p>
        ) : (
          <div className="finance-category-bars">
            {porCategoria.map((item) => (
              <div className="finance-category-bar-row" key={item.categoryId || 'sem-categoria'}>
                <span className="finance-category-bar-label">{item.name}</span>
                <div className="finance-category-bar-track">
                  <div
                    className="finance-category-bar-fill"
                    style={{
                      width: `${maxCategoria ? (item.total / maxCategoria) * 100 : 0}%`,
                      background: item.categoryId ? item.color : 'var(--color-danger)',
                    }}
                  />
                </div>
                <span className="finance-category-bar-value">{formatCurrency(item.total)}</span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {goalsTargetTotal > 0 && (
        <Card className="finance-report-card">
          <h3>Progresso dos objetivos</h3>
          <div className="finance-goal-progress-track">
            <div className="finance-goal-progress-fill" style={{ width: `${goalsProgressPct}%` }} />
          </div>
          <span className="finance-entry-item-meta">
            {formatCurrency(goalsCurrentTotal)} de {formatCurrency(goalsTargetTotal)} ({Math.round(goalsProgressPct)}%)
          </span>
        </Card>
      )}

      {topDespesas?.length > 0 && (
        <Card className="finance-report-card">
          <h3>Maiores despesas do mês</h3>
          <div className="finance-category-bars">
            {topDespesas.map((item) => (
              <div className="finance-category-bar-row" key={item._id}>
                <span className="finance-category-bar-label">{item.description}</span>
                <span className="finance-category-bar-value finance-value--negative">{formatCurrency(item.amount)}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {comparativoMesAnterior && (
        <Card className="finance-report-card">
          <h3>Comparado ao mês anterior</h3>
          <div className="finance-comparison-bars">
            <div className="finance-category-bar-row">
              <span className="finance-category-bar-label">Despesas</span>
              <span
                className={`finance-category-bar-value ${
                  comparativoMesAnterior.variacaoDespesasPct > 0 ? 'finance-value--negative' : 'finance-value--positive'
                }`}
              >
                {formatPct(comparativoMesAnterior.variacaoDespesasPct)}
              </span>
            </div>
            <div className="finance-category-bar-row">
              <span className="finance-category-bar-label">Receitas</span>
              <span
                className={`finance-category-bar-value ${
                  comparativoMesAnterior.variacaoReceitasPct < 0 ? 'finance-value--negative' : 'finance-value--positive'
                }`}
              >
                {formatPct(comparativoMesAnterior.variacaoReceitasPct)}
              </span>
            </div>
          </div>
        </Card>
      )}

      {porNatureza?.length > 0 && (
        <Card className="finance-report-card">
          <h3>Despesas fixas vs. variáveis</h3>
          <div className="finance-category-bars">
            {porNatureza.map((item) => (
              <div className="finance-category-bar-row" key={item.natureza}>
                <span className="finance-category-bar-label">{NATURE_LABEL[item.natureza] || item.natureza}</span>
                <div className="finance-category-bar-track">
                  <div
                    className="finance-category-bar-fill"
                    style={{ width: `${maxNatureza ? (item.total / maxNatureza) * 100 : 0}%` }}
                  />
                </div>
                <span className="finance-category-bar-value">{formatCurrency(item.total)}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {remainingInstallmentsTotal > 0 && (
        <Card className="finance-report-card">
          <h3>Parcelas futuras a pagar</h3>
          <strong className="finance-summary-card-value finance-value--negative">
            {formatCurrency(remainingInstallmentsTotal)}
          </strong>
          <span className="finance-entry-item-meta">Soma do que ainda falta em financiamentos ativos</span>
        </Card>
      )}

      {history.length > 0 && (
        <Card className="finance-report-card">
          <h3>Histórico de saldo</h3>
          <div className="finance-category-bars">
            {history.map((item) => (
              <div className="finance-category-bar-row" key={`${item.year}-${item.month}`}>
                <span className="finance-category-bar-label">{monthLabel(item.month, item.year)}</span>
                <div className="finance-category-bar-track">
                  <div
                    className={`finance-category-bar-fill ${
                      item.saldo >= 0 ? 'finance-value--positive-bg' : 'finance-value--negative-bg'
                    }`}
                    style={{ width: `${maxHistorySaldo ? (Math.abs(item.saldo) / maxHistorySaldo) * 100 : 0}%` }}
                  />
                </div>
                <span className="finance-category-bar-value">{formatCurrency(item.saldo)}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
