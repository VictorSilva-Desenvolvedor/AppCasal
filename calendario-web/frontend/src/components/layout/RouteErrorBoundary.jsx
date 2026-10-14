import { Component } from 'react';
import { Link } from 'react-router-dom';
import { Button, Card } from '../ui/index.js';

// Um erro de render numa tela derrubava a árvore inteira e deixava a página em
// branco, sem saída. Aqui ele fica contido no conteúdo: sidebar e topbar
// continuam de pé e a pessoa pode tentar de novo ou voltar ao lobby. O AppShell
// troca a `key` a cada navegação, o que limpa o erro ao mudar de tela.
export class RouteErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('Erro ao renderizar a tela:', error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <section className="view">
        <Card className="route-error" role="alert">
          <h2>Algo deu errado nesta tela</h2>
          <p>Seus dados estão seguros. Tente de novo ou volte ao início.</p>
          <div className="route-error-actions">
            <Button type="button" onClick={() => this.setState({ error: null })}>
              Tentar de novo
            </Button>
            <Link to="/app" className="btn btn-secondary">
              Voltar ao início
            </Link>
          </div>
        </Card>
      </section>
    );
  }
}
