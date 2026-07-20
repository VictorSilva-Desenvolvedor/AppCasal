import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Card, Field } from '../../components/ui/index.js';
import { useAuth } from '../../hooks/useAuth.js';
import { useToast } from '../../hooks/useToast.js';
import { AuthHeroPanel } from './AuthHeroPanel.jsx';

export function LoginPage() {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    try {
      await login({ name: name.trim(), password });
      navigate('/app', { replace: true });
    } catch (err) {
      showToast(err.message, 'error');
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-shell">
        <AuthHeroPanel />

        <div className="auth-form-side">
          <Card className="auth-card fade-in">
            <h2>Bem-vindo de volta</h2>
            <p>Entre para ver o calendário de nós dois</p>

            <form onSubmit={handleSubmit}>
              <Field label="Nome" htmlFor="name">
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  autoComplete="username"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
              </Field>
              <Field label="Senha" htmlFor="password">
                <input
                  type="password"
                  id="password"
                  name="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </Field>
              <Button type="submit" block loading={loading}>
                Entrar
              </Button>
            </form>

            <p className="auth-hint">
              Usuário: <strong>primeiro nome nosso</strong> · Senha: <strong>data de namoro</strong>
            </p>

            <p className="auth-footer">
              Não tem conta? <Link to="/register">Cadastre-se</Link>
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
