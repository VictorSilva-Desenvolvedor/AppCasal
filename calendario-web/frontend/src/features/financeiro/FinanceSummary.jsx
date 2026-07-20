import { Card } from '../../components/ui/index.js';
import { formatCurrency } from './financeUtils.js';

export function FinanceSummary({ report }) {
  if (!report) {
    return <p className="sidebar-empty">Carregando resumo…</p>;
  }

  const { totalReceitas, totalDespesas, saldo, percentualGasto, porCategoria } = report;
  const maxCategoria = porCategoria.reduce((max, item) => Math.max(max, item.total), 0);

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
        </Card>
      </div>

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
                      background: item.color,
                    }}
                  />
                </div>
                <span className="finance-category-bar-value">{formatCurrency(item.total)}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
